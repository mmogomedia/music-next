/**
 * OAuth 2.1 Authorization Server Metadata (RFC 8414).
 *
 * Discovery document Picasite (or any MCP client) fetches to learn how to run
 * the OAuth flow against Flemoji's MCP authorization server.
 */

import { NextResponse } from 'next/server';
import { MCP_SCOPES } from '@/lib/mcp/contract';
import { getBaseUrl, OAUTH_PATHS } from '@/lib/mcp/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: Request): NextResponse {
  const base = getBaseUrl(req);

  return NextResponse.json({
    issuer: base,
    authorization_endpoint: `${base}${OAUTH_PATHS.authorization}`,
    token_endpoint: `${base}${OAUTH_PATHS.token}`,
    registration_endpoint: `${base}${OAUTH_PATHS.registration}`,
    scopes_supported: [...MCP_SCOPES],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
  });
}
