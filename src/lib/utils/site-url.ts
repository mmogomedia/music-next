/**
 * Site URL utilities
 *
 * Single source of truth for building absolute URLs.
 * Uses NEXTAUTH_URL (always defined in production) as the base.
 */

export const SITE_URL = (
  process.env.NEXTAUTH_URL ?? 'https://flemoji.com'
).replace(/\/$/, '');

/**
 * Build an absolute URL from a path.
 * absoluteUrl('/learn/my-article') → 'https://flemoji.com/learn/my-article'
 */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
