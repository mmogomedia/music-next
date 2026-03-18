/**
 * One-time migration: reads article.toolSlugs and creates ContentLink rows.
 * Safe to run multiple times (upsert).
 * Call POST /api/admin/tools/migrate-slugs from the admin dashboard.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { setToolLinksForArticle } from '@/lib/services/graph-service';
import { syncToolRegistry } from '@/lib/services/tool-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // 1. Sync registry so Tool rows exist
    await syncToolRegistry();

    // 2. Load all articles that have toolSlugs
    const articles = await prisma.article.findMany({
      select: { id: true, toolSlugs: true },
    });

    let migrated = 0;
    for (const article of articles) {
      const slugs: string[] = (article as any).toolSlugs ?? [];
      if (slugs.length === 0) continue;
      await setToolLinksForArticle(article.id, slugs);
      migrated++;
    }

    return NextResponse.json({ ok: true, migrated });
  } catch (error) {
    console.error('Error migrating tool slugs:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
