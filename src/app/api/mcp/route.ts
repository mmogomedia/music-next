/**
 * MCP Streamable-HTTP endpoint (Picasite integration).
 *
 * Per-request, stateless MCP server: authenticates the bearer token, enforces
 * the `x-contract-version` header, builds the tool context, attaches all tool
 * modules, and hands the request to the SDK's Web-Standard transport.
 *
 * Tool bodies live in the four `@/lib/mcp/tools/*` modules (filled in by other
 * agents). Enforcement (rate limit / scope / audit) is applied uniformly via
 * `wrapTool` inside those modules.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { MCP_CONTRACT_VERSIONS } from '@/lib/mcp/contract';
import { verifyBearerToken, type McpToolContext } from '@/lib/mcp/auth';
import { registerDocsTools } from '@/lib/mcp/tools/docs';
import { registerArticleTools } from '@/lib/mcp/tools/articles';
import { registerImageTools } from '@/lib/mcp/tools/images';
import { registerScheduleTools } from '@/lib/mcp/tools/scheduling';
import { registerClusterTools } from '@/lib/mcp/tools/clusters';
import { registerSystemTools } from '@/lib/mcp/tools/system';
import { registerPlanTools } from '@/lib/mcp/tools/plan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SERVER_INFO = {
  name: 'flemoji-mcp',
  version: '1.0.0',
} as const;

function jsonError(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ error: code, message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const SUPPORTED_VERSIONS = MCP_CONTRACT_VERSIONS.join(', ');

/**
 * Negotiate the `x-contract-version` header. The header is required and must be
 * one of `MCP_CONTRACT_VERSIONS` (1 or 2); anything else is rejected with a
 * clear error. Returns the negotiated version number on success, or a
 * ready-to-send error `Response`.
 */
function negotiateContractVersion(req: Request): number | Response {
  const raw = req.headers.get('x-contract-version');
  if (raw === null) {
    return jsonError(
      400,
      'missing_contract_version',
      `Missing x-contract-version header (supported: ${SUPPORTED_VERSIONS})`
    );
  }
  const version = Number(raw);
  if (!(MCP_CONTRACT_VERSIONS as readonly number[]).includes(version)) {
    return jsonError(
      400,
      'unsupported_contract_version',
      `Unsupported x-contract-version "${raw}" (this server supports ${SUPPORTED_VERSIONS})`
    );
  }
  return version;
}

async function handle(req: Request): Promise<Response> {
  // 1. Contract version gate (accepts 1 or 2).
  const negotiated = negotiateContractVersion(req);
  if (negotiated instanceof Response) return negotiated;

  // 2. Authenticate the bearer token, then thread the negotiated version in.
  const ctx: McpToolContext | null = await verifyBearerToken(req);
  if (!ctx) {
    return jsonError(401, 'unauthorized', 'Invalid or missing access token');
  }
  ctx.contractVersion = negotiated;

  // 3. Build the MCP server and attach every tool module.
  // v1 tools are ALWAYS registered (v1 clients unaffected).
  const server = new McpServer(SERVER_INFO);
  registerDocsTools(server, ctx);
  registerArticleTools(server, ctx);
  registerImageTools(server, ctx);
  registerScheduleTools(server, ctx);

  // v2 tools are registered only when the client negotiates contract version 2.
  if (ctx.contractVersion === 2) {
    registerClusterTools(server, ctx);
    registerSystemTools(server, ctx);
    registerPlanTools(server, ctx);
  }

  // 4. Stateless Web-Standard transport — one server per request.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(req);
  } finally {
    // Per-request server: tear down once the response is produced.
    await server.close();
  }
}

export async function POST(req: Request): Promise<Response> {
  return handle(req);
}

export async function GET(req: Request): Promise<Response> {
  return handle(req);
}

export async function DELETE(req: Request): Promise<Response> {
  return handle(req);
}
