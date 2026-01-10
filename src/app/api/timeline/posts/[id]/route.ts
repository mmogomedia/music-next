import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimelineService } from '@/lib/services';
import { z } from 'zod';
import type { PostStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const updatePostSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.any().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
  songUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED']).optional(),
  publishedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  featuredUntil: z.string().datetime().optional(),
});

/**
 * GET /api/timeline/posts/[id]
 * Get a single timeline post by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const post = await TimelineService.getPostById(id, session.user.id);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching timeline post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline post' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/timeline/posts/[id]
 * Update a timeline post
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = updatePostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const post = await TimelineService.updatePost(id, session.user.id, {
      title: data.title,
      description: data.description,
      content: data.content,
      coverImageUrl: data.coverImageUrl || undefined,
      videoUrl: data.videoUrl || undefined,
      songUrl: data.songUrl || undefined,
      status: data.status as PostStatus | undefined,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
      tags: data.tags,
      isFeatured: data.isFeatured,
      featuredUntil: data.featuredUntil
        ? new Date(data.featuredUntil)
        : undefined,
    });

    return NextResponse.json({ post });
  } catch (error: any) {
    if (
      error.message === 'Post not found' ||
      error.message.includes('Unauthorized')
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error updating timeline post:', error);
    return NextResponse.json(
      { error: 'Failed to update timeline post' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/timeline/posts/[id]
 * Delete a timeline post (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await TimelineService.deletePost(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (
      error.message === 'Post not found' ||
      error.message.includes('Unauthorized')
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Error deleting timeline post:', error);
    return NextResponse.json(
      { error: 'Failed to delete timeline post' },
      { status: 500 }
    );
  }
}
