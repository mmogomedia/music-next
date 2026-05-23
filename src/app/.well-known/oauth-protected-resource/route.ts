/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728).
 *
 * Tells MCP clients which authorization server protects the MCP resource
 * (`/api/mcp`) and which scopes it supports.
 */

import { NextResponse } from 'next/server';
import { MCP_SCOPES } from '@/lib/mcp/contract';
import { getBaseUrl, OAUTH_PATHS } from '@/lib/mcp/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: Request): NextResponse {
  const base = getBaseUrl(req);

  return NextResponse.json({
    resource: `${base}${OAUTH_PATHS.resource}`,
    authorization_servers: [base],
    scopes_supported: [...MCP_SCOPES],
    bearer_methods_supported: ['header'],
  });
}
