import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getLinksTo } from '@/lib/services/graph-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const links = await getLinksTo('TOOL', slug, 'ARTICLE', 'REFERENCES');
    if (links.length === 0)
      return NextResponse.json({ articles: [], linkIds: {} });

    const articleIds = links.map(l => l.fromId);
    const rows = await prisma.article.findMany({
      where: { id: { in: articleIds }, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        readTime: true,
      },
    });

    // Preserve link order
    const articles = articleIds
      .map(id => rows.find(r => r.id === id))
      .filter((r): r is NonNullable<typeof r> => r !== undefined);

    // Map articleId → ContentLink.id for client-side deletion
    const linkIds: Record<string, string> = {};
    for (const link of links) linkIds[link.fromId] = link.id;

    return NextResponse.json({ articles, linkIds });
  } catch (error) {
    console.error('Error fetching tool articles:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
