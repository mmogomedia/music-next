import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimelineService } from '@/lib/services';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const sharePostSchema = z.object({
  platform: z.string().optional(),
});

/**
 * POST /api/timeline/posts/[id]/share
 * Share a timeline post
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
    const body = await request.json().catch(() => ({}));
    const validationResult = sharePostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { platform } = validationResult.data;
    const result = await TimelineService.sharePost(
      id,
      session.user.id,
      platform
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sharing post:', error);
    return NextResponse.json(
      { error: 'Failed to share post' },
      { status: 500 }
    );
  }
}
