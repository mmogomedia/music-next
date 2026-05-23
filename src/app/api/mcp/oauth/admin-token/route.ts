/**
 * Admin static-token mint (contract's non-OAuth fallback).
 *
 * An ADMIN (NextAuth session) POSTs `{ scopes[], name?, expiresInDays? }` to mint
 * a long-lived ACCESS token bound to a synthetic `static-admin` client. The raw
 * token is returned exactly ONCE; only its hash is persisted.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashToken, randomToken } from '@/lib/mcp/crypto';
import { MCP_SCOPES } from '@/lib/mcp/contract';
import { STATIC_CLIENT_ID, areValidScopes } from '@/lib/mcp/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MintSchema = z.object({
  scopes: z.array(z.enum(MCP_SCOPES)).min(1, 'At least one scope is required'),
  name: z.string().optional(),
  expiresInDays: z.number().int().positive().max(3650).optional(),
});

const DEFAULT_EXPIRY_DAYS = 365;

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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return oauthError(403, 'forbidden', 'Admin session required');
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return oauthError(400, 'invalid_request', 'Request body must be JSON');
  }

  const parsed = MintSchema.safeParse(body);
  if (!parsed.success) {
    return oauthError(
      400,
      'invalid_request',
      parsed.error.issues[0]?.message ?? 'Invalid mint request'
    );
  }

  const scopes = parsed.data.scopes;
  if (!areValidScopes(scopes)) {
    return oauthError(400, 'invalid_scope', 'Unsupported scope requested');
  }

  // Ensure the synthetic static client exists (FK target for the token).
  await prisma.mcpClient.upsert({
    where: { clientId: STATIC_CLIENT_ID },
    update: {},
    create: {
      clientId: STATIC_CLIENT_ID,
      // Static client never authenticates via secret; store an unusable hash.
      clientSecretHash: hashToken(randomToken(32)),
      name: 'Static Admin Tokens',
      redirectUris: [],
      scopes: [...MCP_SCOPES],
    },
  });

  const token = randomToken(32);
  const days = parsed.data.expiresInDays ?? DEFAULT_EXPIRY_DAYS;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.mcpAccessToken.create({
    data: {
      tokenHash: hashToken(token),
      clientId: STATIC_CLIENT_ID,
      scopes,
      type: 'ACCESS',
      expiresAt,
    },
  });

  return NextResponse.json(
    {
      access_token: token,
      token_type: 'Bearer',
      scope: scopes.join(' '),
      name: parsed.data.name ?? null,
      expires_at: expiresAt.toISOString(),
    },
    {
      status: 201,
      headers: { 'cache-control': 'no-store', pragma: 'no-cache' },
    }
  );
}
