import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { getArticleById, updateArticle } from '@/lib/services/article-service';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  body: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  coverImageUrl: z
    .string()
    .optional()
    .transform(v => v || undefined),
  seoTitle: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
  targetKeywords: z.array(z.string()).optional(),
  toolSlugs: z.array(z.string()).optional(),
  clusterId: z.string().optional(),
  clusterRole: z.enum(['PILLAR', 'SPOKE']).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const article = await getArticleById(id);
    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const article = await updateArticle(id, parsed.data);
    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const hardDelete = request.headers.get('x-hard-delete') === '1';

  try {
    if (hardDelete) {
      await prisma.article.delete({ where: { id } });
    } else {
      await prisma.article.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      {
        error: hardDelete
          ? 'Failed to delete article'
          : 'Failed to archive article',
      },
      { status: 500 }
    );
  }
}
