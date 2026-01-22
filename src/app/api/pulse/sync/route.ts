import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TikTokService } from '@/lib/services/tiktok-service';
import { PulseScoringService } from '@/lib/services/pulse-scoring-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pulse/sync
 * Refetches all TikTok data required for PULSE³ calculations:
 * - User info (follower_count, following_count, likes_count, video_count, etc.)
 * - Video list (up to 50 videos with engagement metrics)
 * Stores the data in PulsePlatformData for use in score calculations
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get artist profile
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: 'Artist profile not found' },
        { status: 404 }
      );
    }

    // Get TikTok connection
    const tiktokConnection = await TikTokService.getConnection(session.user.id);

    if (!tiktokConnection) {
      return NextResponse.json(
        { error: 'TikTok not connected. Please connect TikTok first.' },
        { status: 400 }
      );
    }

    const userInfo = tiktokConnection.userInfo;
    const tokens = tiktokConnection.tokens;

    // Fetch fresh user info (in case it was updated)
    let freshUserInfo = userInfo;
    try {
      freshUserInfo = await TikTokService.getUserInfo(
        tokens.accessToken,
        tokens.scope
      );
    } catch (error: any) {
      console.warn('Error fetching fresh user info, using cached:', error);
      // Continue with cached user info
    }

    // Fetch video list if scope is granted
    let videos: any[] | undefined;
    let videoListError: string | undefined;
    let videoCount = 0;
    let hasMoreVideos = false;

    try {
      if (tokens.scope && tokens.scope.includes('video.list')) {
        const videoData = await TikTokService.getVideoList(tokens.accessToken, {
          maxCount: 20, // TikTok API limit is 20 per request
          grantedScopes: tokens.scope,
          openId: tokens.openId,
        });
        videos = videoData.videos;
        videoCount = videoData.videos.length;
        hasMoreVideos = videoData.hasMore || false;
      } else {
        videoListError = 'video.list scope not granted';
      }
    } catch (videoError: any) {
      console.error('Error fetching video list during sync:', videoError);
      videoListError = videoError.message;
    }

    // Store platform data snapshot
    await PulseScoringService.savePlatformData(artistProfile.id, 'tiktok', {
      follower_count: freshUserInfo.followerCount,
      following_count: freshUserInfo.followingCount,
      likes_count: freshUserInfo.likesCount,
      video_count: freshUserInfo.videoCount,
      display_name: freshUserInfo.displayName,
      open_id: freshUserInfo.openId,
      avatar_url: freshUserInfo.avatarUrl,
      bio_description: freshUserInfo.bioDescription,
      profile_deep_link: freshUserInfo.profileDeepLink,
      is_verified: freshUserInfo.isVerified,
      ...(videos && {
        videos: JSON.parse(JSON.stringify(videos)), // Serialize for JSON storage
        video_list_fetched_at: new Date().toISOString(),
        video_count_in_list: videoCount,
        has_more_videos: hasMoreVideos,
      }),
      ...(videoListError && { video_list_error: videoListError }),
      synced_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Data synced successfully',
      data: {
        userInfo: {
          followerCount: freshUserInfo.followerCount,
          followingCount: freshUserInfo.followingCount,
          likesCount: freshUserInfo.likesCount,
          videoCount: freshUserInfo.videoCount,
          displayName: freshUserInfo.displayName,
        },
        videos: {
          count: videoCount,
          hasMore: hasMoreVideos,
          fetched: !!videos,
        },
        errors: {
          videoList: videoListError || null,
        },
      },
    });
  } catch (error: any) {
    console.error('Error syncing PULSE³ data:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync PULSE³ data',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
