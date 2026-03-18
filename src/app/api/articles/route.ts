import { NextRequest, NextResponse } from 'next/server';
import { getArticles } from '@/lib/services/article-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getArticles({
      status: 'PUBLISHED',
      clusterId: searchParams.get('clusterId') ?? undefined,
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 20),
      search: searchParams.get('search') ?? undefined,
    });

    // Strip body from list response
    const articles = result.articles.map(({ body: _body, ...rest }) => rest);

    return NextResponse.json({ ...result, articles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
