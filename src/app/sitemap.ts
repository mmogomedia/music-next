import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { SITE_URL } from '@/lib/utils/site-url';
import { getAllTools } from '@/lib/tools/registry';

export const dynamic = 'force-dynamic';

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
      url: `${SITE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/timeline`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/browse`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
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

  const articleRoutes: MetadataRoute.Sitemap = articles.map(article => ({
    url: `${SITE_URL}/learn/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
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

  return [...staticRoutes, ...toolRoutes, ...articleRoutes, ...artistRoutes];
}
