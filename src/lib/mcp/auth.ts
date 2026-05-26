/**
 * MCP server-side auth + runtime helpers.
 *
 * Used by the MCP route (`src/app/api/mcp/route.ts`) and by every tool
 * (via `wrapTool` in `src/lib/mcp/tools/types.ts`) to authenticate bearer
 * tokens, enforce scopes, rate-limit per client, and write audit logs.
 */

import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';
import { checkRateLimit } from '@/lib/rate-limit';
import { hashToken } from './crypto';
import type { McpScope } from './contract';

/** Per-client rate-limit window (requests / window). */
const RATE_LIMIT_MAX = 120;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Resolved auth context for a single MCP request. `clientId` is null only for
 * the static admin token path; `static` is true when authenticated via the
 * admin-minted token rather than an OAuth-issued token.
 */
export interface McpToolContext {
  clientId: string | null;
  scopes: string[];
  static: boolean;
  /**
   * Negotiated contract version from the `x-contract-version` header (1 or 2).
   * Defaults to 1. The MCP route sets this after authentication; tool modules
   * may branch on it to expose v2-only behaviour.
   */
  contractVersion: number;
}

/** Typed error thrown by MCP auth/tool code; maps cleanly to HTTP/JSON-RPC. */
export class McpError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  /** Optional structured payload (e.g. current field hashes on a conflict). */
  readonly detail?: unknown;

  constructor(
    code: string,
    message: string,
    httpStatus = 400,
    detail?: unknown
  ) {
    super(message);
    this.name = 'McpError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.detail = detail;
  }
}

/**
 * Extract the bearer token from an Authorization header.
 */
function extractBearer(req: Request): string | null {
  const header = req.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/**
 * Verify an MCP bearer token.
 *
 * Resolution order:
 *  1. Static admin token (`MCP_STATIC_ADMIN_TOKEN`) → full scopes, no client.
 *  2. OAuth-issued `McpAccessToken` (looked up by hashed token) → must be type
 *     ACCESS, not expired, not revoked, and its client not revoked.
 *
 * Returns the resolved context, or `null` when no/invalid token is presented.
 */
export async function verifyBearerToken(
  req: Request
): Promise<McpToolContext | null> {
  const token = extractBearer(req);
  if (!token) return null;

  // 1. Static admin fallback. Full scope set (incl. v2 cluster scopes); the
  // route overrides `contractVersion` from the request header after auth.
  const staticToken = process.env.MCP_STATIC_ADMIN_TOKEN;
  if (staticToken && token === staticToken) {
    return {
      clientId: null,
      scopes: [
        'docs:read',
        'articles:read',
        'articles:write',
        'clusters:read',
        'clusters:write',
      ],
      static: true,
      contractVersion: 1,
    };
  }

  // 2. OAuth-issued access token.
  const tokenHash = hashToken(token);
  const record = await prisma.mcpAccessToken.findUnique({
    where: { tokenHash },
    include: { client: true },
  });

  if (!record) return null;
  if (record.type !== 'ACCESS') return null;
  if (record.revokedAt) return null;
  if (record.expiresAt.getTime() <= Date.now()) return null;
  if (record.client.revokedAt) return null;

  return {
    clientId: record.clientId,
    scopes: record.scopes,
    static: false,
    contractVersion: 1,
  };
}

/**
 * Throw an McpError (code `forbidden`, 403) when the context lacks `scope`.
 */
export function requireScope(ctx: McpToolContext, scope: McpScope): void {
  if (!ctx.scopes.includes(scope)) {
    throw new McpError('forbidden', `Missing required scope: ${scope}`, 403);
  }
}

/**
 * Simple per-client rate limit. Uses Upstash Redis when configured (shared
 * across serverless instances); otherwise falls back to the in-memory limiter.
 * Throws an McpError (code `rate_limited`, 429) when the limit is exceeded.
 */
export async function rateLimit(clientId: string | null): Promise<void> {
  const identifier = `mcp:${clientId ?? 'static'}`;

  const redisConfigured =
    Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (redisConfigured) {
    const key = `mcp:ratelimit:${identifier}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
      }
      if (count > RATE_LIMIT_MAX) {
        throw new McpError('rate_limited', 'Rate limit exceeded', 429);
      }
      return;
    } catch (error) {
      if (error instanceof McpError) throw error;
      // Redis transport error → fall through to in-memory limiter.
    }
  }

  const result = checkRateLimit(identifier, {
    maxRequests: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
  if (!result.allowed) {
    throw new McpError('rate_limited', 'Rate limit exceeded', 429);
  }
}

/**
 * Write an audit-log row for a tool invocation. Never throws — audit failures
 * must not break a tool call.
 */
export async function audit(
  clientId: string | null,
  tool: string,
  ok: boolean,
  detail?: string
): Promise<void> {
  try {
    await prisma.mcpAuditLog.create({
      data: {
        clientId: clientId ?? undefined,
        tool,
        ok,
        detail: detail ?? undefined,
      },
    });
  } catch (error) {
    console.error('[MCP] audit log write failed:', error);
  }
}
