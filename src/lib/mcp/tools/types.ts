/**
 * Shared MCP tool registrar contract + `wrapTool` enforcement helper.
 *
 * Every tool module exports a `ToolRegistrar` that attaches its tools to the
 * server. Tool bodies SHOULD be registered through `wrapTool` so that rate
 * limiting, scope checks, error mapping, and audit logging are applied
 * uniformly across all tools.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  audit,
  rateLimit,
  requireScope,
  McpError,
  type McpToolContext,
} from '../auth';
import type { McpScope } from '../contract';

export type { McpToolContext };

/**
 * Signature every tool module's registrar must implement. The MCP route calls
 * each registrar once per request with the live server + resolved auth context.
 */
export type ToolRegistrar = (_server: McpServer, _ctx: McpToolContext) => void;

/** A business handler: takes validated args, returns a JSON-serializable value. */
export type ToolHandler<TArgs, TResult> = (
  _args: TArgs,
  _ctx: McpToolContext
) => Promise<TResult> | TResult;

/** Options controlling enforcement applied by `wrapTool`. */
export interface WrapToolOptions {
  /** Tool name (used for audit + error context). */
  name: string;
  /** Scopes required to call this tool; all must be present. */
  scopes?: McpScope[];
  /** Auth context for the current request. */
  ctx: McpToolContext;
}

/** Serialize an arbitrary handler result into a CallToolResult. */
function toCallToolResult(result: unknown): CallToolResult {
  const text =
    typeof result === 'string' ? result : JSON.stringify(result ?? null);
  const structured =
    result !== null && typeof result === 'object' && !Array.isArray(result)
      ? (result as Record<string, unknown>)
      : undefined;
  return {
    content: [{ type: 'text', text }],
    ...(structured ? { structuredContent: structured } : {}),
  };
}

/** Map an error into an isError CallToolResult carrying code + detail. */
function toErrorResult(error: unknown): CallToolResult {
  if (error instanceof McpError) {
    const payload: Record<string, unknown> = {
      error: error.code,
      message: error.message,
    };
    if (error.detail !== undefined) payload.detail = error.detail;
    return {
      content: [{ type: 'text', text: JSON.stringify(payload) }],
      structuredContent: payload,
      isError: true,
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [
      { type: 'text', text: JSON.stringify({ error: 'internal', message }) },
    ],
    structuredContent: { error: 'internal', message },
    isError: true,
  };
}

/**
 * Wrap a business handler with uniform enforcement: rate limit → scope check →
 * handler → audit, with errors mapped to an `isError` CallToolResult.
 *
 * Usage in a tool module:
 * ```ts
 * server.registerTool(
 *   'get_article',
 *   { description, inputSchema: GetArticleInputSchema.shape },
 *   wrapTool({ name: 'get_article', scopes: ['articles:read'], ctx }, async (args) => {
 *     return getArticleImpl(args);
 *   })
 * );
 * ```
 */
export function wrapTool<TArgs, TResult>(
  options: WrapToolOptions,
  handler: ToolHandler<TArgs, TResult>
): (_args: TArgs) => Promise<CallToolResult> {
  const { name, scopes = [], ctx } = options;
  return async (args: TArgs): Promise<CallToolResult> => {
    try {
      await rateLimit(ctx.clientId);
      for (const scope of scopes) {
        requireScope(ctx, scope);
      }
      const result = await handler(args, ctx);
      await audit(ctx.clientId, name, true);
      return toCallToolResult(result);
    } catch (error) {
      const detail =
        error instanceof McpError
          ? `${error.code}: ${error.message}`
          : error instanceof Error
            ? error.message
            : String(error);
      await audit(ctx.clientId, name, false, detail);
      return toErrorResult(error);
    }
  };
}
