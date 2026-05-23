/**
 * OAuth 2.1 Authorization endpoint (Authorization Code + PKCE).
 *
 * GET  → validate the request, require an ADMIN NextAuth session (redirect to
 *        /login otherwise), then render a minimal consent screen.
 * POST → re-check the ADMIN session; on Approve, mint a stateless signed
 *        authorization code and 302 to `redirect_uri?code=…&state=…`. On Deny,
 *        302 back with `error=access_denied`.
 *
 * The authorization code is stateless: it is an HMAC-signed compact token
 * (see `signAuthCode`) carrying clientId / redirectUri / scope / codeChallenge /
 * userId / exp(60s). Nothing is persisted at this step.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MCP_SCOPES, type McpScope } from '@/lib/mcp/contract';
import {
  AUTH_CODE_TTL_MS,
  OAUTH_PATHS,
  getBaseUrl,
  parseScopes,
  signAuthCode,
} from '@/lib/mcp/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Validated authorize-request parameters shared by GET + POST. */
interface AuthorizeParams {
  clientId: string;
  redirectUri: string;
  responseType: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string | null;
  state: string | null;
}

function readParams(params: URLSearchParams): AuthorizeParams {
  return {
    clientId: params.get('client_id') ?? '',
    redirectUri: params.get('redirect_uri') ?? '',
    responseType: params.get('response_type') ?? '',
    codeChallenge: params.get('code_challenge') ?? '',
    codeChallengeMethod: params.get('code_challenge_method') ?? '',
    scope: params.get('scope'),
    state: params.get('state'),
  };
}

/** Plain HTML error page (used when we cannot safely redirect back). */
function htmlError(status: number, message: string): NextResponse {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Authorization error</title></head><body style="font-family:system-ui;max-width:32rem;margin:4rem auto;padding:0 1rem"><h1 style="font-size:1.25rem">Authorization error</h1><p>${escapeHtml(
    message
  )}</p></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Build a redirect URL back to the client carrying error params. */
function redirectError(
  redirectUri: string,
  error: string,
  description: string,
  state: string | null
): NextResponse {
  const url = new URL(redirectUri);
  url.searchParams.set('error', error);
  url.searchParams.set('error_description', description);
  if (state) url.searchParams.set('state', state);
  return NextResponse.redirect(url, { status: 302 });
}

/**
 * Validate the registered client + that the redirect_uri is allow-listed and
 * resolve the effective scopes (subset of client scopes ∩ MCP_SCOPES).
 * Returns either a validated context or a Response describing the failure.
 */
async function validate(
  p: AuthorizeParams
): Promise<
  | { ok: true; clientName: string; scopes: McpScope[] }
  | { ok: false; response: NextResponse }
> {
  if (!p.clientId) {
    return { ok: false, response: htmlError(400, 'Missing client_id') };
  }

  const client = await prisma.mcpClient.findUnique({
    where: { clientId: p.clientId },
  });
  if (!client || client.revokedAt) {
    return { ok: false, response: htmlError(400, 'Unknown or revoked client') };
  }

  // redirect_uri must exactly match a registered URI before we trust it.
  if (!p.redirectUri || !client.redirectUris.includes(p.redirectUri)) {
    return {
      ok: false,
      response: htmlError(400, 'Invalid or unregistered redirect_uri'),
    };
  }

  // From here failures can be safely reported back to the client redirect_uri.
  if (p.responseType !== 'code') {
    return {
      ok: false,
      response: redirectError(
        p.redirectUri,
        'unsupported_response_type',
        'Only response_type=code is supported',
        p.state
      ),
    };
  }
  if (!p.codeChallenge || p.codeChallengeMethod !== 'S256') {
    return {
      ok: false,
      response: redirectError(
        p.redirectUri,
        'invalid_request',
        'PKCE code_challenge with code_challenge_method=S256 is required',
        p.state
      ),
    };
  }

  // Effective scopes = requested ∩ client scopes ∩ MCP_SCOPES.
  const allowed = client.scopes.filter((s): s is McpScope =>
    (MCP_SCOPES as readonly string[]).includes(s)
  );
  const scopes = parseScopes(p.scope, allowed);
  if (!scopes) {
    return {
      ok: false,
      response: redirectError(
        p.redirectUri,
        'invalid_scope',
        'Requested scope exceeds what this client is allowed',
        p.state
      ),
    };
  }

  return { ok: true, clientName: client.name, scopes };
}

/**
 * Resolve the current ADMIN session, or a 302 redirect to /login that returns
 * the user to the original authorize URL after sign-in.
 */
async function requireAdminOrLogin(
  req: Request,
  base: string
): Promise<{ userId: string } | { redirect: NextResponse }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id && session.user.role === 'ADMIN') {
    return { userId: session.user.id };
  }

  // Preserve the full authorize request (incl. query) as the callback.
  const callbackUrl = req.url;
  const loginUrl = new URL('/login', base);
  loginUrl.searchParams.set('callbackUrl', callbackUrl);
  return { redirect: NextResponse.redirect(loginUrl, { status: 302 }) };
}

/** Render the consent screen (server-rendered HTML form). */
function consentPage(
  p: AuthorizeParams,
  clientName: string,
  scopes: McpScope[]
): NextResponse {
  const scopeItems = scopes
    .map(s => `<li><code>${escapeHtml(s)}</code></li>`)
    .join('');

  const hidden = (name: string, value: string | null): string =>
    value === null
      ? ''
      : `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authorize ${escapeHtml(clientName)}</title>
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;background:#faf5ff;color:#1f2937;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center}
    .card{background:#fff;max-width:26rem;width:100%;margin:1rem;padding:2rem;border-radius:1rem;box-shadow:0 10px 30px rgba(147,51,234,.15)}
    h1{font-size:1.25rem;margin:0 0 .25rem}
    p.sub{color:#6b7280;margin:0 0 1.5rem}
    ul{list-style:none;padding:0;margin:0 0 1.5rem;display:flex;flex-direction:column;gap:.5rem}
    li{background:#f5f3ff;border:1px solid #ede9fe;border-radius:.5rem;padding:.5rem .75rem}
    code{font-family:ui-monospace,monospace;font-size:.875rem}
    .actions{display:flex;gap:.75rem}
    button{flex:1;padding:.625rem 1rem;border-radius:.5rem;border:0;font-size:1rem;font-weight:600;cursor:pointer}
    .approve{background:#9333ea;color:#fff}
    .deny{background:#e5e7eb;color:#374151}
  </style>
</head>
<body>
  <form class="card" method="post" action="${escapeHtml(
    OAUTH_PATHS.authorization
  )}">
    <h1>Authorize ${escapeHtml(clientName)}</h1>
    <p class="sub">This application is requesting access to your Flemoji MCP server with the following scopes:</p>
    <ul>${scopeItems}</ul>
    ${hidden('client_id', p.clientId)}
    ${hidden('redirect_uri', p.redirectUri)}
    ${hidden('response_type', p.responseType)}
    ${hidden('code_challenge', p.codeChallenge)}
    ${hidden('code_challenge_method', p.codeChallengeMethod)}
    ${hidden('scope', p.scope)}
    ${hidden('state', p.state)}
    <div class="actions">
      <button class="deny" type="submit" name="decision" value="deny">Deny</button>
      <button class="approve" type="submit" name="decision" value="approve">Approve</button>
    </div>
  </form>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export async function GET(req: Request): Promise<NextResponse> {
  const base = getBaseUrl(req);
  const url = new URL(req.url);
  const p = readParams(url.searchParams);

  const valid = await validate(p);
  if (!valid.ok) return valid.response;

  const auth = await requireAdminOrLogin(req, base);
  if ('redirect' in auth) return auth.redirect;

  return consentPage(p, valid.clientName, valid.scopes);
}

export async function POST(req: Request): Promise<NextResponse> {
  const base = getBaseUrl(req);
  const form = await req.formData();
  const params = new URLSearchParams();
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string') params.set(key, value);
  }
  const p = readParams(params);
  const decision = params.get('decision');

  const valid = await validate(p);
  if (!valid.ok) return valid.response;

  const auth = await requireAdminOrLogin(req, base);
  if ('redirect' in auth) return auth.redirect;

  if (decision !== 'approve') {
    return redirectError(
      p.redirectUri,
      'access_denied',
      'The resource owner denied the request',
      p.state
    );
  }

  // Mint the stateless authorization code (60s TTL).
  const code = signAuthCode({
    clientId: p.clientId,
    redirectUri: p.redirectUri,
    scope: valid.scopes,
    codeChallenge: p.codeChallenge,
    userId: auth.userId,
    exp: Date.now() + AUTH_CODE_TTL_MS,
  });

  const redirect = new URL(p.redirectUri);
  redirect.searchParams.set('code', code);
  if (p.state) redirect.searchParams.set('state', p.state);
  return NextResponse.redirect(redirect, { status: 302 });
}
