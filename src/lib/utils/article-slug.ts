/**
 * Article slug generation — a pure, dependency-free helper.
 *
 * This lives outside `lib/services/article-service.ts` so that CLIENT components
 * can use it without importing that module's server-only dependency graph
 * (article-service → lib/db → @prisma/adapter-pg → pg → node:net/tls).
 * Under Prisma 5 that accidental client import merely bloated the bundle;
 * under Prisma 7 the `pg` driver adapter makes it a hard build failure.
 *
 * NOTE: this is deliberately NOT the same algorithm as `slugify` in
 * `lib/utils/string.ts`. That one strips underscores and trims leading/trailing
 * hyphens and caps at 90 chars. This one preserves word characters (so `_`
 * becomes `-`) and caps at 80. Article slugs are public URLs — switching
 * algorithms would silently change them.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}
