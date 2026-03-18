import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  getArticles,
  createArticle,
  slugify,
} from '@/lib/services/article-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const articleSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  body: z.string().min(1),
  excerpt: z.string().optional(),
  coverImageUrl: z
    .string()
    .optional()
    .transform(v => v || undefined),
  seoTitle: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
  targetKeywords: z.array(z.string()).default([]),
  toolSlugs: z.array(z.string()).default([]),
  clusterId: z.string().optional(),
  clusterRole: z.enum(['PILLAR', 'SPOKE']).default('SPOKE'),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const result = await getArticles({
      status:
        (searchParams.get('status') as
          | 'DRAFT'
          | 'PUBLISHED'
          | 'ARCHIVED'
          | undefined) ?? undefined,
      clusterId: searchParams.get('clusterId') ?? undefined,
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 20),
      search: searchParams.get('search') ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = articleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (!data.slug) data.slug = slugify(data.title);

    const article = await createArticle(data, session.user.id);
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
