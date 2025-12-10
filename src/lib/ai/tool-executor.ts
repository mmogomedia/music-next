/**
 * Central Tool-Call Executor
 *
 * Provides a shared loop that executes LLM tool calls, feeds results back
 * to the model, and returns the final assistant message plus execution logs.
 *
 * @module tool-executor
 */

import {
  AIMessage,
  ToolMessage,
  type BaseMessageLike,
} from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { SSEEventEmitter } from '@/lib/ai/sse-event-emitter';

/**
 * Minimal interface for chat models that support bindTools().
 */
export interface BindableToolModel {
  bindTools: (_tools: StructuredToolInterface[]) => {
    invoke: (_messages: BaseMessageLike[]) => Promise<AIMessage>;
  };
}

/**
 * Record of a single executed tool call.
 */
export interface ExecutedToolResult {
  toolCallId?: string;
  name: string;
  args: unknown;
  rawResult: unknown;
  parsedResult?: unknown;
  error?: string;
}

/**
 * Options for executing the tool-call loop.
 */
export interface ExecuteToolCallLoopOptions {
  model: BindableToolModel;
  tools: StructuredToolInterface[];
  messages: BaseMessageLike[];
  maxIterations?: number;
  emitEvent?: SSEEventEmitter;
  originalMessage?: string; // Original user message for debugging
}

/**
 * Result returned after executing the loop.
 */
export interface ExecuteToolCallLoopResult {
  finalMessage: AIMessage;
  messages: BaseMessageLike[];
  toolResults: ExecutedToolResult[];
  iterations: number;
  toolExecutionTruncated: boolean;
}

/**
 * Try to parse a JSON string. Returns undefined if parsing fails.
 */
function tryParseJson(value: unknown): any | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

/**
 * Normalize assistant content (string or multimodal array) to plain text.
 */
export function extractTextContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          if ('text' in item && typeof item.text === 'string') {
            return item.text;
          }
          if ('content' in item && typeof item.content === 'string') {
            return item.content;
          }
        }
        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  if (content && typeof content === 'object') {
    const maybeText =
      'text' in (content as any)
        ? (content as any).text
        : 'content' in (content as any)
          ? (content as any).content
          : undefined;
    if (typeof maybeText === 'string') {
      return maybeText;
    }
  }

  return '';
}

/**
 * Execute an LLM tool-call loop until the assistant returns a final answer.
 */
export async function executeToolCallLoop({
  model,
  tools,
  messages,
  maxIterations = 6,
  emitEvent,
  originalMessage,
}: ExecuteToolCallLoopOptions): Promise<ExecuteToolCallLoopResult> {
  const conversation: BaseMessageLike[] = [...messages];
  const toolResults: ExecutedToolResult[] = [];
  const runnable = model.bindTools(tools);

  // Extract original user message from messages array if not provided
  const userMessage =
    originalMessage ||
    (() => {
      const userMsg = messages.find(
        msg =>
          msg && typeof msg === 'object' && 'role' in msg && msg.role === 'user'
      );
      if (userMsg && typeof userMsg === 'object' && 'content' in userMsg) {
        return typeof userMsg.content === 'string'
          ? userMsg.content
          : undefined;
      }
      return undefined;
    })() ||
    'Unknown';

  const { logger } = await import('@/lib/utils/logger');
  logger.info('[ToolExecutor] ===== TOOL EXECUTION START =====', {
    originalMessage: userMessage,
    toolsAvailable: tools.map(t => t.name),
    maxIterations,
  });

  let finalMessage: AIMessage | undefined;
  let truncated = false;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const aiResponse = await runnable.invoke(conversation);
    finalMessage = aiResponse;
    conversation.push(aiResponse);

    const toolCalls = aiResponse.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return {
        finalMessage: aiResponse,
        messages: conversation,
        toolResults,
        iterations: iteration + 1,
        toolExecutionTruncated: truncated,
      };
    }

    for (const toolCall of toolCalls) {
      const matchingTool = tools.find(tool => tool.name === toolCall.name);

      let parsedArgs: unknown = toolCall.args;
      if (typeof parsedArgs === 'string') {
        parsedArgs = tryParseJson(parsedArgs) ?? {};
      }

      // Enhanced logging with original message context
      logger.info('[ToolExecutor] ===== TOOL CALL =====', {
        originalMessage: userMessage,
        toolName: toolCall.name,
        toolCallId: toolCall.id,
        iteration: iteration + 1,
        parameters: parsedArgs,
        rawArgs: toolCall.args,
      });

      logger.debug('[ToolExecutor] Parsed args:', parsedArgs);

      // Emit calling_tool event
      const toolMessages: Record<string, string> = {
        search_tracks: 'Searching tracks...',
        get_tracks_by_genre: 'Finding tracks by genre...',
        get_playlists_by_genre: 'Discovering playlists...',
        get_artist: 'Looking up artist...',
        get_trending_tracks: 'Getting trending tracks...',
        get_genres: 'Fetching genres...',
      };

      emitEvent?.({
        type: 'calling_tool',
        tool: toolCall.name,
        message: toolMessages[toolCall.name] || `Executing ${toolCall.name}...`,
        parameters: parsedArgs as Record<string, any>,
        stage: 'tool_execution',
        timestamp: new Date().toISOString(),
        // Include original message in SSE event for debugging
        ...(originalMessage && { originalMessage }),
      });

      if (!matchingTool) {
        logger.error('[ToolExecutor] Tool not found:', toolCall.name);
        const errorPayload = {
          error: `Tool "${toolCall.name}" not found`,
        };

        const toolCallId =
          toolCall.id || `tool-call-${Date.now()}-${Math.random()}`;

        toolResults.push({
          toolCallId,
          name: toolCall.name,
          args: parsedArgs,
          rawResult: errorPayload,
          parsedResult: errorPayload,
          error: errorPayload.error,
        });

        conversation.push(
          new ToolMessage({
            tool_call_id: toolCallId,
            content: JSON.stringify(errorPayload),
          })
        );
        continue;
      }

      let rawResult: unknown;
      let parsedResult: unknown;
      let error: string | undefined;

      const toolStartTime = Date.now();

      // Enhanced debug logging
      logger.info('[ToolExecutor] Invoking tool:', {
        originalMessage: userMessage,
        toolName: matchingTool.name,
        parameters: parsedArgs,
        iteration: iteration + 1,
      });

      logger.log('[ToolExecutor] ===== TOOL INVOCATION =====');
      logger.log('[ToolExecutor] Original Message:', userMessage);
      logger.log('[ToolExecutor] Tool:', matchingTool.name);
      logger.log(
        '[ToolExecutor] Parameters:',
        JSON.stringify(parsedArgs, null, 2)
      );

      try {
        rawResult = await (matchingTool as unknown as any).invoke(parsedArgs);
        parsedResult = tryParseJson(rawResult) ?? rawResult;
        const toolLatency = Date.now() - toolStartTime;

        // Enhanced success logging
        logger.info('[ToolExecutor] Tool execution success:', {
          originalMessage: userMessage,
          toolName: matchingTool.name,
          latency: toolLatency,
          parameters: parsedArgs,
          resultType: typeof rawResult,
          resultLength:
            typeof rawResult === 'string' ? rawResult.length : 'N/A',
          parsedResultKeys:
            typeof parsedResult === 'object' && parsedResult !== null
              ? Object.keys(parsedResult)
              : 'N/A',
        });

        logger.log('[ToolExecutor] ===== TOOL SUCCESS =====');
        logger.log('[ToolExecutor] Original Message:', userMessage);
        logger.log('[ToolExecutor] Tool:', matchingTool.name);
        logger.log(
          '[ToolExecutor] Parameters:',
          JSON.stringify(parsedArgs, null, 2)
        );
        logger.log('[ToolExecutor] Latency:', `${toolLatency}ms`);
        logger.log('[ToolExecutor] Result Type:', typeof rawResult);

        // Extract result count for tool_result event
        let resultCount: number | undefined;
        if (typeof parsedResult === 'object' && parsedResult !== null) {
          if ('tracks' in parsedResult && Array.isArray(parsedResult.tracks)) {
            resultCount = parsedResult.tracks.length;
          } else if (
            'playlists' in parsedResult &&
            Array.isArray(parsedResult.playlists)
          ) {
            resultCount = parsedResult.playlists.length;
          } else if (
            'artists' in parsedResult &&
            Array.isArray(parsedResult.artists)
          ) {
            resultCount = parsedResult.artists.length;
          } else if (
            'genres' in parsedResult &&
            Array.isArray(parsedResult.genres)
          ) {
            resultCount = parsedResult.genres.length;
          } else if (
            'count' in parsedResult &&
            typeof parsedResult.count === 'number'
          ) {
            resultCount = parsedResult.count;
          }
        }

        // Emit tool_result event (only if there are results or if it's important)
        // Suppress zero-result messages to avoid confusion
        if (resultCount !== undefined && resultCount > 0) {
          // Get user-friendly tool names
          const toolNames: Record<string, string> = {
            search_tracks: 'tracks',
            get_tracks_by_genre: 'tracks',
            get_trending_tracks: 'tracks',
            get_playlists_by_genre: 'playlists',
            get_playlists_by_province: 'playlists',
            get_top_charts: 'playlists',
            get_featured_playlists: 'playlists',
            get_artist: 'artist',
            search_artists: 'artists',
            get_genres: 'genres',
          };

          const toolType = toolNames[toolCall.name] || 'results';
          emitEvent?.({
            type: 'tool_result',
            tool: toolCall.name,
            resultCount,
            message: `Found ${resultCount} ${toolType}${resultCount !== 1 ? '' : ''}`,
            stage: 'tool_complete',
            timestamp: new Date().toISOString(),
          });
        }
        // Don't emit events for zero results - it's confusing for users
      } catch (err) {
        error =
          err instanceof Error ? err.message : 'Unknown tool execution error';
        rawResult = { error };
        parsedResult = rawResult;

        logger.error('[ToolExecutor] Tool execution error:', {
          originalMessage: userMessage,
          toolName: matchingTool.name,
          error: error,
          parameters: parsedArgs,
        });

        logger.error('[ToolExecutor] ===== TOOL ERROR =====');
        logger.error('[ToolExecutor] Original Message:', userMessage);
        logger.error('[ToolExecutor] Tool:', matchingTool.name);
        logger.error(
          '[ToolExecutor] Parameters:',
          JSON.stringify(parsedArgs, null, 2)
        );
        logger.error('[ToolExecutor] Error:', error);
      }

      const toolCallId =
        toolCall.id || `tool-call-${Date.now()}-${Math.random()}`;

      toolResults.push({
        toolCallId,
        name: toolCall.name,
        args: parsedArgs,
        rawResult,
        parsedResult,
        error,
      });

      const toolContent =
        typeof rawResult === 'string'
          ? rawResult
          : JSON.stringify(rawResult ?? {});

      conversation.push(
        new ToolMessage({
          tool_call_id: toolCallId,
          content: toolContent,
        })
      );
    }
  }

  truncated = true;

  // Final summary log
  logger.info('[ToolExecutor] ===== TOOL EXECUTION COMPLETE =====', {
    originalMessage: userMessage,
    totalIterations: maxIterations,
    toolsCalled: toolResults.map(t => t.name),
    totalToolCalls: toolResults.length,
    truncated,
    toolCallsSummary: toolResults.map(t => ({
      name: t.name,
      parameters: t.args,
      hasError: !!t.error,
    })),
  });

  return {
    finalMessage:
      finalMessage ??
      new AIMessage({
        content:
          'I was unable to complete tool execution within the allowed iterations.',
      }),
    messages: conversation,
    toolResults,
    iterations: maxIterations,
    toolExecutionTruncated: truncated,
  };
}
