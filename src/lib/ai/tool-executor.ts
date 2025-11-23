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
}: ExecuteToolCallLoopOptions): Promise<ExecuteToolCallLoopResult> {
  const conversation: BaseMessageLike[] = [...messages];
  const toolResults: ExecutedToolResult[] = [];
  const runnable = model.bindTools(tools);

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
      const { logger } = await import('@/lib/utils/logger');
      logger.info('[ToolExecutor] Processing tool call:', {
        toolName: toolCall.name,
        rawArgs: toolCall.args,
        toolCallId: toolCall.id,
      });

      const matchingTool = tools.find(tool => tool.name === toolCall.name);

      let parsedArgs: unknown = toolCall.args;
      if (typeof parsedArgs === 'string') {
        parsedArgs = tryParseJson(parsedArgs) ?? {};
      }

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
      // eslint-disable-next-line no-console
      console.log('[ToolExecutor] Invoking tool:', {
        toolName: matchingTool.name,
        args: parsedArgs,
      });

      try {
        rawResult = await (matchingTool as unknown as any).invoke(parsedArgs);
        parsedResult = tryParseJson(rawResult) ?? rawResult;
        const toolLatency = Date.now() - toolStartTime;

        // eslint-disable-next-line no-console
        console.log('[ToolExecutor] Tool execution success:', {
          toolName: matchingTool.name,
          latency: toolLatency,
          resultType: typeof rawResult,
          resultLength:
            typeof rawResult === 'string' ? rawResult.length : 'N/A',
          parsedResultKeys:
            typeof parsedResult === 'object' && parsedResult !== null
              ? Object.keys(parsedResult)
              : 'N/A',
        });

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

        // eslint-disable-next-line no-console
        console.error('[ToolExecutor] Tool execution error:', {
          toolName: matchingTool.name,
          error: error,
          args: parsedArgs,
        });
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
