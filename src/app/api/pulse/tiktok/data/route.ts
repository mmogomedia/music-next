import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TikTokService } from '@/lib/services/tiktok-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pulse/tiktok/data
 * Fetches TikTok user data and videos
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await TikTokService.getConnection(session.user.id);

    if (!connection) {
      return NextResponse.json(
        { error: 'TikTok not connected' },
        { status: 404 }
      );
    }

    // Get video list (check if scope is granted)
    let videoData;
    try {
      videoData = await TikTokService.getVideoList(
        connection.tokens.accessToken,
        {
          maxCount: 10,
          grantedScopes: connection.tokens.scope,
          openId: connection.tokens.openId,
        }
      );
    } catch (error: any) {
      // If scope error, return empty video list
      if (
        error.message?.includes('scope_not_authorized') ||
        error.message?.includes('video.list scope not granted')
      ) {
        videoData = { videos: [], hasMore: false };
      } else {
        throw error;
      }
    }

    return NextResponse.json({
      userInfo: connection.userInfo,
      videos: videoData.videos,
      hasMore: videoData.hasMore,
    });
  } catch (error) {
    console.error('Error fetching TikTok data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TikTok data' },
      { status: 500 }
    );
  }
}
