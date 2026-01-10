import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimelineService } from '@/lib/services';

export const dynamic = 'force-dynamic';

/**
 * GET /api/timeline/feed
 * Get timeline feed with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor') || undefined;
    const sortBy =
      (searchParams.get('sortBy') as 'relevance' | 'recent' | 'trending') ||
      'relevance';
    const genreId = searchParams.get('genreId') || undefined;
    const authorId = searchParams.get('authorId') || undefined;
    const following = searchParams.get('following') === 'true';
    const searchQuery = searchParams.get('searchQuery') || undefined;

    // Parse postTypes filter (comma-separated)
    const postTypesParam = searchParams.get('postTypes');
    const postTypes = postTypesParam
      ? (postTypesParam.split(',') as any[])
      : undefined;

    const feed = await TimelineService.getTimelineFeed({
      userId: session.user.id,
      limit: Math.min(limit, 50), // Max 50 per request
      cursor,
      postTypes,
      sortBy,
      genreId,
      authorId,
      following,
      searchQuery,
    });

    return NextResponse.json(feed);
  } catch (error) {
    const { logger } = await import('@/lib/utils/logger');
    logger.error('Error fetching timeline feed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: 'Failed to fetch timeline feed',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      },
      { status: 500 }
    );
  }
}
