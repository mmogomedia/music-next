/**
 * MCP OAuth 2.1 authorization-server helpers.
 *
 * Shared by the discovery docs, dynamic client registration, authorize, token,
 * and admin-token-mint route handlers under `src/app/api/mcp/oauth/` and
 * `src/app/.well-known/`.
 *
 * Crypto primitives come exclusively from `@/lib/mcp/crypto` — this module never
 * hand-rolls hashing/HMAC. Scopes are always validated against `MCP_SCOPES`.
 */

import { hmacSign, hmacVerify, sha256 } from './crypto';
import { MCP_SCOPES, type McpScope } from './contract';

/** Path of the OAuth issuer's discovery / endpoints relative to the origin. */
export const OAUTH_PATHS = {
  authorization: '/api/mcp/oauth/authorize',
  token: '/api/mcp/oauth/token',
  registration: '/api/mcp/oauth/register',
  adminToken: '/api/mcp/oauth/admin-token',
  /** The protected MCP resource. */
  resource: '/api/mcp',
} as const;

/** Authorization-code TTL: short-lived single-use code (60 seconds). */
export const AUTH_CODE_TTL_MS = 60 * 1000;
/** Access-token lifetime (~1 hour). */
export const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;
/** Refresh-token lifetime (~30 days). */
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** clientId used for admin-minted static tokens (synthetic registered client). */
export const STATIC_CLIENT_ID = 'static-admin';

/**
 * Derive the public base URL (issuer) for OAuth metadata + redirects.
 *
 * Order of precedence:
 *  1. `NEXT_PUBLIC_SITE_URL` (explicit deployment origin), else
 *  2. the incoming request's origin (scheme + host).
 *
 * Always returned without a trailing slash.
 */
export function getBaseUrl(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

/** The server secret used to sign stateless authorization codes. */
function authCodeSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured');
  }
  return secret;
}

/** Validate that every scope is a known `MCP_SCOPES` member. */
export function areValidScopes(scopes: string[]): scopes is McpScope[] {
  return scopes.every(s => (MCP_SCOPES as readonly string[]).includes(s));
}

/**
 * Parse a space-delimited OAuth `scope` string into a deduped array,
 * restricted to the supplied `allowed` set (defaults to all MCP scopes).
 * Returns `null` if any requested scope is unknown or not allowed.
 */
export function parseScopes(
  raw: string | null | undefined,
  allowed: readonly string[] = MCP_SCOPES
): McpScope[] | null {
  if (!raw || !raw.trim()) {
    // No scope requested → grant the full allowed set.
    return [...allowed].filter((s): s is McpScope =>
      (MCP_SCOPES as readonly string[]).includes(s)
    );
  }
  const requested = Array.from(new Set(raw.trim().split(/\s+/)));
  if (
    !requested.every(s => allowed.includes(s)) ||
    !areValidScopes(requested)
  ) {
    return null;
  }
  return requested;
}

/** base64url-encode a UTF-8 string. */
function b64urlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

/** base64url-decode to a UTF-8 string. */
function b64urlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

/** Stateless authorization-code payload (signed, never persisted). */
export interface AuthCodePayload {
  clientId: string;
  redirectUri: string;
  scope: McpScope[];
  codeChallenge: string;
  userId: string;
  /** Expiry epoch milliseconds. */
  exp: number;
}

/**
 * Mint a compact, signed authorization code:
 *   base64url(JSON(payload)) + '.' + hmac(secret, base64url(JSON(payload)))
 *
 * Stateless: the code carries everything the token endpoint needs and is
 * verified by signature + expiry, so no DB row is required.
 */
export function signAuthCode(payload: AuthCodePayload): string {
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = hmacSign(authCodeSecret(), body);
  return `${body}.${sig}`;
}

/**
 * Verify + decode an authorization code. Returns the payload, or `null` when the
 * code is malformed, the signature is invalid, or it has expired.
 */
export function verifyAuthCode(code: string): AuthCodePayload | null {
  const dot = code.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = code.slice(0, dot);
  const sig = code.slice(dot + 1);
  if (!hmacVerify(authCodeSecret(), body, sig)) return null;

  let payload: AuthCodePayload;
  try {
    payload = JSON.parse(b64urlDecode(body)) as AuthCodePayload;
  } catch {
    return null;
  }
  if (typeof payload.exp !== 'number' || payload.exp <= Date.now()) {
    return null;
  }
  return payload;
}

/**
 * Verify a PKCE code_verifier against an S256 code_challenge.
 * S256: BASE64URL(SHA256(ASCII(code_verifier))) === code_challenge.
 *
 * `sha256()` from crypto returns hex, so we re-derive the digest as base64url
 * here (Node `createHash`) — still no hand-rolled algorithm, just a different
 * digest encoding of the same SHA-256.
 */
export function verifyPkceS256(
  codeVerifier: string,
  codeChallenge: string
): boolean {
  // Derive base64url(sha256(verifier)). `sha256` gives hex; convert to bytes.
  const hex = sha256(codeVerifier);
  const challenge = Buffer.from(hex, 'hex').toString('base64url');
  return challenge === codeChallenge;
}
