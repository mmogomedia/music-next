/**
 * Site URL utilities
 *
 * Single source of truth for building absolute URLs.
 *
 * Priority order:
 *  1. NEXT_PUBLIC_SITE_URL  — explicit canonical URL; MUST be set to https://flemoji.com
 *                             in Vercel so canonical/og:url always uses the non-www form,
 *                             even if VERCEL_PROJECT_PRODUCTION_URL returns www.flemoji.com.
 *  2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's stable custom-domain env var (no protocol)
 *  3. Hard-coded fallback   — https://flemoji.com
 *
 * NEXTAUTH_URL is intentionally NOT used here: it can be set to localhost
 * in Vercel without breaking auth (NextAuth auto-detects the deployment URL)
 * but it would corrupt every og:url / canonical tag if misset.
 */

/**
 * Strip surrounding whitespace and any trailing slash.
 *
 * The trim is load-bearing, not cosmetic. Piping a value into `vercel env add`
 * (`echo "https://flemoji.com" | vercel env add …`) stores the trailing
 * newline, and this function only used to strip a trailing slash. The newline
 * then rode through every raw interpolation of SITE_URL and shipped to
 * production as:
 *
 *   sitemap.xml   <loc>https://flemoji.com\n/learn</loc>
 *   robots.txt    Sitemap: https://flemoji.com\n/sitemap.xml
 *
 * Metadata canonicals happened to survive because Next normalises those
 * through `new URL()`, which hid the problem — the sitemap and robots.txt do
 * plain string concatenation and did not.
 */
function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function resolveSiteUrl(): string {
  // 1. Explicit override — must be a full URL with protocol
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
  }

  // 2. Vercel automatically sets this to the production custom domain (no protocol)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return normalizeBaseUrl(
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
    );
  }

  // 3. Hard-coded canonical fallback
  return 'https://flemoji.com';
}

export const SITE_URL = resolveSiteUrl();

/**
 * Build an absolute URL from a path.
 * absoluteUrl('/my-article') → 'https://flemoji.com/my-article'
 */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
