/**
 * MCP crypto helpers — deterministic hashing, HMAC signing, opaque tokens.
 *
 * The hashing helpers MUST be used identically by the article tools (computing
 * `get_article` field hashes + `contentHash`) and the webhook emitter
 * (computing `changedFields` + `contentHash`) so both sides agree bit-for-bit.
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { CANONICAL_ARTICLE_FIELDS } from './contract';

/** SHA-256 of a UTF-8 string, returned as lowercase hex. */
export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Stable JSON stringify with recursively sorted object keys so that two
 * structurally-equal values always serialize to the same string.
 */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const entries = keys.map(
    k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`
  );
  return `{${entries.join(',')}}`;
}

/**
 * Normalize a single canonical field value to a stable string, then sha256 it.
 * - null/undefined        → hash of "" (empty string)
 * - string/number/boolean → hash of its JSON scalar
 * - arrays/objects        → hash of stable (key-sorted) JSON
 */
export function hashField(value: unknown): string {
  if (value === null || value === undefined) return sha256('');
  if (typeof value === 'object') return sha256(stableStringify(value));
  return sha256(JSON.stringify(value));
}

/**
 * Generalized per-field hash map over an arbitrary STABLE field list. This is
 * the single hashing implementation shared by v1 (`CANONICAL_ARTICLE_FIELDS`)
 * and v2 (`CANONICAL_ARTICLE_FIELDS_V2`, `CANONICAL_CLUSTER_FIELDS`). The
 * returned shape matches the `hashes` map in `get_article` / `get_cluster`.
 */
export function fieldHashesFor(
  canonical: Record<string, unknown>,
  fields: readonly string[]
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of fields) {
    out[field] = hashField(canonical[field]);
  }
  return out;
}

/**
 * Generalized combined content hash: sha256 over the concatenation of each
 * per-field hash, in the supplied field-list order. Deterministic and
 * order-stable; shared by v1 and v2 hashing.
 */
export function contentHashFor(
  canonical: Record<string, unknown>,
  fields: readonly string[]
): string {
  const hashes = fieldHashesFor(canonical, fields);
  const concatenated = fields.map(f => hashes[f]).join('');
  return sha256(concatenated);
}

/**
 * Generalized diff of two field-hash maps over a STABLE field list — returns the
 * names of fields whose hashes changed, in field-list order. Shared by v1 and
 * v2 for webhook `changedFields` and conflict reporting.
 */
export function changedFieldsFor(
  before: Record<string, string>,
  after: Record<string, string>,
  fields: readonly string[]
): string[] {
  return fields.filter(f => before[f] !== after[f]);
}

/**
 * Compute the per-field hash map over `CANONICAL_ARTICLE_FIELDS` (stable order).
 * v1 wrapper — delegates to `fieldHashesFor`.
 */
export function fieldHashes(
  canonical: Record<string, unknown>
): Record<string, string> {
  return fieldHashesFor(canonical, CANONICAL_ARTICLE_FIELDS);
}

/**
 * Combined content hash over `CANONICAL_ARTICLE_FIELDS` order. v1 wrapper —
 * delegates to `contentHashFor`.
 */
export function contentHash(canonical: Record<string, unknown>): string {
  return contentHashFor(canonical, CANONICAL_ARTICLE_FIELDS);
}

/**
 * Diff two canonical field-hash maps and return the names of fields whose
 * hashes changed (in `CANONICAL_ARTICLE_FIELDS` order). v1 wrapper — delegates
 * to `changedFieldsFor`. Used for webhook `changedFields` and
 * optimistic-concurrency conflict reporting.
 */
export function changedFields(
  before: Record<string, string>,
  after: Record<string, string>
): string[] {
  return changedFieldsFor(before, after, CANONICAL_ARTICLE_FIELDS);
}

/** HMAC-SHA256 signature of `body` using `secret`, returned as hex. */
export function hmacSign(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

/** Constant-time verification of an HMAC-SHA256 signature. */
export function hmacVerify(
  secret: string,
  body: string,
  signature: string
): boolean {
  const expected = hmacSign(secret, body);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Generate an opaque, URL-safe random token (default 32 bytes → 256-bit). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Hash an opaque token for storage/lookup (never store the raw token). */
export function hashToken(token: string): string {
  return sha256(token);
}
