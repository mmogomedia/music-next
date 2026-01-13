import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimelineService } from '@/lib/services';
import { z } from 'zod';
import type { PostType, AuthorType, PostStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const createPostSchema = z.object({
  postType: z.enum([
    'MUSIC_POST',
    'SONG',
    'NEWS_ARTICLE',
    'ADVERTISEMENT',
    'FEATURED_CONTENT',
    'RELEASE_PROMO',
    'VIDEO_CONTENT',
    'EVENT_ANNOUNCEMENT',
    'POLL',
  ]),
  content: z.any(), // JSON content
  title: z.string().optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
  songUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED']).optional(),
  publishedAt: z.string().datetime().optional(),
  scheduledFor: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  featuredUntil: z.string().datetime().optional(),
});

/**
 * POST /api/timeline/posts
 * Create a new timeline post
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createPostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Determine author type based on user role
    let authorType: AuthorType = 'ARTIST';
    if (session.user.role === 'ADMIN') {
      authorType = 'ADMIN';
    } else if ((session.user as any).canPublishNews) {
      authorType = 'PUBLISHER';
    }

    // Validate post type permissions
    if (
      data.postType === 'NEWS_ARTICLE' &&
      authorType !== 'ADMIN' &&
      authorType !== 'PUBLISHER'
    ) {
      return NextResponse.json(
        { error: 'Only admins and publishers can create news articles' },
        { status: 403 }
      );
    }

    if (data.postType === 'ADVERTISEMENT' && authorType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can create advertisements' },
        { status: 403 }
      );
    }

    const post = await TimelineService.createPost({
      postType: data.postType as PostType,
      authorId: session.user.id,
      authorType,
      content: data.content,
      title: data.title,
      description: data.description,
      coverImageUrl: data.coverImageUrl || undefined,
      videoUrl: data.videoUrl || undefined,
      songUrl: data.songUrl || undefined,
      status: (data.status as PostStatus) || 'DRAFT',
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      tags: data.tags,
      isFeatured: data.isFeatured,
      featuredUntil: data.featuredUntil
        ? new Date(data.featuredUntil)
        : undefined,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating timeline post:', error);
    return NextResponse.json(
      { error: 'Failed to create timeline post' },
      { status: 500 }
    );
  }
}
