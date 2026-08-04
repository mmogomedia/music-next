import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { SITE_URL } from '@/lib/utils/site-url';
import { getAllTools } from '@/lib/tools/registry';
import { isReservedSlug } from '@/lib/services/article-service';

export const dynamic = 'force-dynamic';

/**
 * Only ever submit URLs that resolve AND are indexable.
 *
 * Two rules, both learned the hard way — Search Console reports violations as
 * hard errors against the whole sitemap:
 *
 *  1. Every entry must be a real route. `/genres/:slug` used to be listed here
 *     but no `src/app/genres` route was ever built, so all of them 404'd.
 *  2. Never list a page that sets `robots: { index: false }`. `/timeline`,
 *     `/league` and `/pulse` are all noindex — submitting them reports as
 *     "Submitted URL marked 'noindex'".
 *
 * If you add a route here, open it first and check both.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static routes ──────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/learn`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/stream`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // ── Tool routes ────────────────────────────────────────────────────────────
  const toolRoutes: MetadataRoute.Sitemap = getAllTools().map(tool => ({
    url: `${SITE_URL}/tools/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // ── Published article routes ───────────────────────────────────────────────
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  });

  // Guides sit at the root, so a slug matching a real route (`tools`, `learn`,
  // …) is shadowed by that route and unreachable. createArticle/updateArticle
  // reject those slugs, but rows written before that guard existed could still
  // be in the table — skip them rather than submit a URL that serves something
  // else and duplicates a static entry above.
  const articleRoutes: MetadataRoute.Sitemap = articles
    .filter(article => !isReservedSlug(article.slug))
    .map(article => ({
      url: `${SITE_URL}/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // ── Topic (cluster) hub routes ─────────────────────────────────────────────
  // Only clusters that actually have published articles — an empty topic page
  // is thin content and earns a "Crawled — currently not indexed".
  const clusters = await prisma.articleCluster.findMany({
    select: {
      slug: true,
      updatedAt: true,
      _count: { select: { articles: { where: { status: 'PUBLISHED' } } } },
    },
  });

  const topicRoutes: MetadataRoute.Sitemap = clusters
    .filter(cluster => cluster.slug && cluster._count.articles > 0)
    .map(cluster => ({
      url: `${SITE_URL}/topic/${cluster.slug}`,
      lastModified: cluster.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // ── Public artist profile routes ───────────────────────────────────────────
  const artists = await prisma.artistProfile.findMany({
    where: { isVerified: true },
    select: { slug: true, updatedAt: true },
  });

  const artistRoutes: MetadataRoute.Sitemap = artists
    .filter(a => a.slug)
    .map(artist => ({
      url: `${SITE_URL}/artist/${artist.slug}`,
      lastModified: artist.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

  return [
    ...staticRoutes,
    ...toolRoutes,
    ...articleRoutes,
    ...topicRoutes,
    ...artistRoutes,
  ];
}
