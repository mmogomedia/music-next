import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { publishArticle } from '@/lib/services/article-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const article = await publishArticle(id, session.user.id);
    return NextResponse.json({ article });
  } catch (error) {
    const err = error as Error & { statusCode?: number };
    const statusCode = err.statusCode ?? 500;
    console.error('Error publishing article:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to publish article' },
      { status: statusCode }
    );
  }
}
