import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimelineService } from '@/lib/services';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const addCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().optional(),
});

/**
 * POST /api/timeline/posts/[id]/comments
 * Add a comment to a timeline post
 */
export async function POST(
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
    const validationResult = addCommentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { content, parentId } = validationResult.data;
    const comment = await TimelineService.addComment(
      id,
      session.user.id,
      content,
      parentId
    );

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/timeline/posts/[id]/comments
 * Get comments for a timeline post
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor') || undefined;

    const result = await TimelineService.getComments(
      id,
      limit,
      cursor,
      session.user.id
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
