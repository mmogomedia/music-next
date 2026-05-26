/**
 * OAuth 2.1 Token endpoint.
 *
 * Supports two grants:
 *  - `authorization_code`: verifies the signed code + client credentials + PKCE
 *    + redirect_uri, then issues an ACCESS + REFRESH token pair.
 *  - `refresh_token`: validates + rotates a refresh token, revoking the old one.
 *
 * Accepts both `application/x-www-form-urlencoded` and JSON bodies.
 */

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';
import { hashToken, randomToken } from '@/lib/mcp/crypto';
import { MCP_SCOPES, type McpScope } from '@/lib/mcp/contract';
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  verifyAuthCode,
  verifyPkceS256,
} from '@/lib/mcp/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function oauthError(
  status: number,
  error: string,
  description: string
): NextResponse {
  return NextResponse.json(
    { error, error_description: description },
    {
      status,
      headers: { 'cache-control': 'no-store', pragma: 'no-cache' },
    }
  );
}

/** Read form-encoded or JSON body into a flat string map. */
async function readBody(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get('content-type') ?? '';
  const out: Record<string, string> = {};

  if (contentType.includes('application/json')) {
    try {
      const json = (await req.json()) as Record<string, unknown>;
      for (const [k, v] of Object.entries(json)) {
        if (typeof v === 'string') out[k] = v;
      }
    } catch {
      // Ignore — handled by missing-field validation downstream.
    }
    return out;
  }

  const form = await req.formData();
  for (const [k, v] of form.entries()) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

/**
 * Verify a client_id/client_secret pair against the stored secret hash.
 *
 * When `requireSecret` is false (public-client `token_endpoint_auth_method:
 * none` on the authorization_code grant) a missing secret is accepted — the
 * grant is still bound to the client by PKCE + the signed authorization code.
 * If a secret IS presented it is always verified.
 */
async function verifyClient(
  clientId: string | undefined,
  clientSecret: string | undefined,
  requireSecret = true
): Promise<
  { ok: true; scopes: McpScope[] } | { ok: false; response: NextResponse }
> {
  if (!clientId) {
    return {
      ok: false,
      response: oauthError(401, 'invalid_client', 'client_id is required'),
    };
  }
  if (requireSecret && !clientSecret) {
    return {
      ok: false,
      response: oauthError(401, 'invalid_client', 'client_secret is required'),
    };
  }

  const client = await prisma.mcpClient.findUnique({ where: { clientId } });
  if (!client || client.revokedAt) {
    return {
      ok: false,
      response: oauthError(401, 'invalid_client', 'Unknown or revoked client'),
    };
  }

  if (clientSecret) {
    // Constant-time compare via fixed-length sha256 hashes.
    const presented = Buffer.from(hashToken(clientSecret));
    const stored = Buffer.from(client.clientSecretHash);
    const match =
      presented.length === stored.length && timingSafeEqual(presented, stored);
    if (!match) {
      return {
        ok: false,
        response: oauthError(
          401,
          'invalid_client',
          'Invalid client credentials'
        ),
      };
    }
  }

  // Filter against the canonical MCP_SCOPES union — adding new scopes
  // (e.g. clusters:read / clusters:write in v2) automatically flows
  // through both this helper and the refresh path below. Previously
  // this list was hardcoded and silently dropped cluster scopes on
  // every refresh, which broke any client that needed them.
  const scopes = client.scopes.filter((s): s is McpScope =>
    (MCP_SCOPES as readonly string[]).includes(s)
  );
  return { ok: true, scopes };
}

/** Issue a fresh ACCESS + REFRESH token pair for a client. */
async function issueTokens(
  clientId: string,
  scopes: McpScope[]
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const accessToken = randomToken(32);
  const refreshToken = randomToken(32);
  const now = Date.now();

  await prisma.$transaction([
    prisma.mcpAccessToken.create({
      data: {
        tokenHash: hashToken(accessToken),
        clientId,
        scopes,
        type: 'ACCESS',
        expiresAt: new Date(now + ACCESS_TOKEN_TTL_MS),
      },
    }),
    prisma.mcpAccessToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        clientId,
        scopes,
        type: 'REFRESH',
        expiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
      },
    }),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
  };
}

function tokenResponse(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scopes: McpScope[];
}): NextResponse {
  return NextResponse.json(
    {
      access_token: tokens.accessToken,
      token_type: 'Bearer',
      expires_in: tokens.expiresIn,
      refresh_token: tokens.refreshToken,
      scope: tokens.scopes.join(' '),
    },
    { headers: { 'cache-control': 'no-store', pragma: 'no-cache' } }
  );
}

async function handleAuthorizationCode(
  body: Record<string, string>
): Promise<NextResponse> {
  const code = body.code;
  const redirectUri = body.redirect_uri;
  const codeVerifier = body.code_verifier;

  if (!code) {
    return oauthError(400, 'invalid_request', 'Missing authorization code');
  }
  if (!codeVerifier) {
    return oauthError(400, 'invalid_request', 'Missing PKCE code_verifier');
  }

  const payload = verifyAuthCode(code);
  if (!payload) {
    return oauthError(
      400,
      'invalid_grant',
      'Authorization code is invalid or expired'
    );
  }

  if (redirectUri !== payload.redirectUri) {
    return oauthError(400, 'invalid_grant', 'redirect_uri mismatch');
  }

  if (!verifyPkceS256(codeVerifier, payload.codeChallenge)) {
    return oauthError(400, 'invalid_grant', 'PKCE verification failed');
  }

  // Public clients (auth_method none) may omit the secret here — PKCE + the
  // signed code's client_id binding still authenticate the exchange.
  const client = await verifyClient(
    body.client_id ?? payload.clientId,
    body.client_secret,
    false
  );
  if (!client.ok) return client.response;

  if ((body.client_id ?? payload.clientId) !== payload.clientId) {
    return oauthError(400, 'invalid_grant', 'client_id mismatch');
  }

  const tokens = await issueTokens(payload.clientId, payload.scope);
  return tokenResponse({ ...tokens, scopes: payload.scope });
}

async function handleRefreshToken(
  body: Record<string, string>
): Promise<NextResponse> {
  const refreshToken = body.refresh_token;
  if (!refreshToken) {
    return oauthError(400, 'invalid_request', 'Missing refresh_token');
  }

  const record = await prisma.mcpAccessToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { client: true },
  });

  if (
    !record ||
    record.type !== 'REFRESH' ||
    record.revokedAt ||
    record.expiresAt.getTime() <= Date.now() ||
    record.client.revokedAt
  ) {
    return oauthError(
      400,
      'invalid_grant',
      'Refresh token is invalid, expired, or revoked'
    );
  }

  // Confidential client must re-authenticate on refresh.
  const client = await verifyClient(body.client_id, body.client_secret);
  if (!client.ok) return client.response;
  if (body.client_id !== record.clientId) {
    return oauthError(400, 'invalid_grant', 'client_id mismatch');
  }

  // Same canonical filter as verifyClient() above — refresh used to
  // hardcode the same incomplete allowlist and silently strip
  // clusters:read / clusters:write off the new token, so a client
  // that connected with all v2 scopes lost cluster access on its
  // first refresh.
  const scopes = record.scopes.filter((s): s is McpScope =>
    (MCP_SCOPES as readonly string[]).includes(s)
  );

  // Rotate: revoke the presented refresh token, then issue a new pair.
  await prisma.mcpAccessToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens(record.clientId, scopes);
  return tokenResponse({ ...tokens, scopes });
}

export async function POST(req: Request): Promise<NextResponse> {
  const body = await readBody(req);
  const grantType = body.grant_type;

  switch (grantType) {
    case 'authorization_code':
      return handleAuthorizationCode(body);
    case 'refresh_token':
      return handleRefreshToken(body);
    default:
      return oauthError(
        400,
        'unsupported_grant_type',
        `grant_type "${grantType ?? ''}" is not supported`
      );
  }
}
