import { prisma } from '@/lib/db';
import { getAllTools } from '@/lib/tools/registry';

/**
 * Syncs the in-memory tool registry into the `tools` DB table.
 * Safe to call on every deploy; it upserts each tool by slug.
 */
export async function syncToolRegistry(): Promise<void> {
  const tools = getAllTools();
  await Promise.all(
    tools.map(t =>
      prisma.tool.upsert({
        where: { slug: t.slug },
        create: {
          slug: t.slug,
          name: t.name,
          tagline: t.tagline,
          category: t.category,
          gradient: t.gradient,
          features: t.features,
          fullscreen: t.fullscreen ?? false,
        },
        update: {
          name: t.name,
          tagline: t.tagline,
          category: t.category,
          gradient: t.gradient,
          features: t.features,
          fullscreen: t.fullscreen ?? false,
        },
      })
    )
  );
}

export async function getToolsFromDB() {
  return prisma.tool.findMany({ orderBy: { slug: 'asc' } });
}

export async function getToolBySlugFromDB(slug: string) {
  return prisma.tool.findUnique({ where: { slug } });
}
