import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimelineService } from '@/lib/services';

export const dynamic = 'force-dynamic';

/**
 * POST /api/timeline/posts/[id]/view
 * Track a view on a timeline post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || undefined;

    const { id } = await params;
    const result = await TimelineService.trackView(id, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
