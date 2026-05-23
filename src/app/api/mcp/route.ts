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
import { MCP_CONTRACT_VERSION } from '@/lib/mcp/contract';
import { verifyBearerToken, type McpToolContext } from '@/lib/mcp/auth';
import { registerDocsTools } from '@/lib/mcp/tools/docs';
import { registerArticleTools } from '@/lib/mcp/tools/articles';
import { registerImageTools } from '@/lib/mcp/tools/images';
import { registerScheduleTools } from '@/lib/mcp/tools/scheduling';

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

/**
 * Validate the `x-contract-version` header. The header is required and must
 * equal the supported version; anything else is rejected with a clear error.
 */
function checkContractVersion(req: Request): Response | null {
  const raw = req.headers.get('x-contract-version');
  if (raw === null) {
    return jsonError(
      400,
      'missing_contract_version',
      `Missing x-contract-version header (expected ${MCP_CONTRACT_VERSION})`
    );
  }
  if (Number(raw) !== MCP_CONTRACT_VERSION) {
    return jsonError(
      400,
      'unsupported_contract_version',
      `Unsupported x-contract-version "${raw}" (this server supports ${MCP_CONTRACT_VERSION})`
    );
  }
  return null;
}

async function handle(req: Request): Promise<Response> {
  // 1. Contract version gate.
  const versionError = checkContractVersion(req);
  if (versionError) return versionError;

  // 2. Authenticate the bearer token.
  const ctx: McpToolContext | null = await verifyBearerToken(req);
  if (!ctx) {
    return jsonError(401, 'unauthorized', 'Invalid or missing access token');
  }

  // 3. Build the MCP server and attach every tool module.
  const server = new McpServer(SERVER_INFO);
  registerDocsTools(server, ctx);
  registerArticleTools(server, ctx);
  registerImageTools(server, ctx);
  registerScheduleTools(server, ctx);

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
