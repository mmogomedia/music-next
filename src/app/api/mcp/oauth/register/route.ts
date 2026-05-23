/**
 * Dynamic Client Registration (RFC 7591).
 *
 * POST a `{ client_name, redirect_uris[], scope? }` body to register a new MCP
 * OAuth client. We generate a `client_id` + `client_secret`, store only the
 * hash of the secret, and return the credentials once.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { randomToken, hashToken } from '@/lib/mcp/crypto';
import { MCP_SCOPES } from '@/lib/mcp/contract';
import { parseScopes } from '@/lib/mcp/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RegisterSchema = z.object({
  client_name: z.string().min(1).optional(),
  redirect_uris: z.array(z.string().url()).min(1, 'redirect_uris is required'),
  scope: z.string().optional(),
});

function oauthError(
  status: number,
  error: string,
  description: string
): NextResponse {
  return NextResponse.json(
    { error, error_description: description },
    { status }
  );
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return oauthError(
      400,
      'invalid_client_metadata',
      'Request body must be valid JSON'
    );
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return oauthError(
      400,
      'invalid_redirect_uri',
      parsed.error.issues[0]?.message ?? 'Invalid registration metadata'
    );
  }

  // Validate requested scopes (defaults to full set when omitted).
  const scopes = parseScopes(parsed.data.scope, MCP_SCOPES);
  if (!scopes) {
    return oauthError(
      400,
      'invalid_client_metadata',
      'Requested scope contains unsupported values'
    );
  }

  const clientId = randomToken(16);
  const clientSecret = randomToken(32);
  const name = parsed.data.client_name ?? 'MCP Client';

  await prisma.mcpClient.create({
    data: {
      clientId,
      clientSecretHash: hashToken(clientSecret),
      name,
      redirectUris: parsed.data.redirect_uris,
      scopes,
    },
  });

  return NextResponse.json(
    {
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: name,
      redirect_uris: parsed.data.redirect_uris,
      scope: scopes.join(' '),
      token_endpoint_auth_method: 'client_secret_post',
    },
    { status: 201 }
  );
}
