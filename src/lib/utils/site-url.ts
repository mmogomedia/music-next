/**
 * Site URL utilities
 *
 * Single source of truth for building absolute URLs.
 *
 * Priority order:
 *  1. NEXT_PUBLIC_SITE_URL  — explicit canonical URL (set this in Vercel)
 *  2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's stable custom-domain env var (no protocol)
 *  3. Hard-coded fallback   — https://flemoji.com
 *
 * NEXTAUTH_URL is intentionally NOT used here: it can be set to localhost
 * in Vercel without breaking auth (NextAuth auto-detects the deployment URL)
 * but it would corrupt every og:url / canonical tag if misset.
 */

function resolveSiteUrl(): string {
  // 1. Explicit override — must be a full URL with protocol
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }

  // 2. Vercel automatically sets this to the production custom domain (no protocol)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(
      /\/$/,
      ''
    );
  }

  // 3. Hard-coded canonical fallback
  return 'https://flemoji.com';
}

export const SITE_URL = resolveSiteUrl();

/**
 * Build an absolute URL from a path.
 * absoluteUrl('/learn/my-article') → 'https://flemoji.com/learn/my-article'
 */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
