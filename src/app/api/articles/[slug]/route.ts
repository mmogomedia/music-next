import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/services/article-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const article = await getArticleBySlug(params.slug);

    // Only serve published articles publicly
    if (article.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }
}
