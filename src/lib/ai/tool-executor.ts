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
      const matchingTool = tools.find(tool => tool.name === toolCall.name);

      let parsedArgs: unknown = toolCall.args;
      if (typeof parsedArgs === 'string') {
        parsedArgs = tryParseJson(parsedArgs) ?? {};
      }

      if (!matchingTool) {
        const errorPayload = {
          error: `Tool "${toolCall.name}" not found`,
        };

        toolResults.push({
          toolCallId: toolCall.id,
          name: toolCall.name,
          args: parsedArgs,
          rawResult: errorPayload,
          parsedResult: errorPayload,
          error: errorPayload.error,
        });

        conversation.push(
          new ToolMessage({
            tool_call_id: toolCall.id,
            content: JSON.stringify(errorPayload),
          })
        );
        continue;
      }

      let rawResult: unknown;
      let parsedResult: unknown;
      let error: string | undefined;

      try {
        rawResult = await (matchingTool as unknown as any).invoke(parsedArgs);
        parsedResult = tryParseJson(rawResult) ?? rawResult;
      } catch (err) {
        error =
          err instanceof Error ? err.message : 'Unknown tool execution error';
        rawResult = { error };
        parsedResult = rawResult;
      }

      toolResults.push({
        toolCallId: toolCall.id,
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
          tool_call_id: toolCall.id,
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
