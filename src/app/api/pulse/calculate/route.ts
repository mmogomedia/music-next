import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PulseScoringService } from '@/lib/services/pulse-scoring-service';
import { TikTokService } from '@/lib/services/tiktok-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pulse/calculate
 * Calculate and save PULSE³ scores for the current artist
 * Can be called manually or by a background job
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

    // Fetch latest TikTok data and store it
    try {
      const tiktokConnection = await TikTokService.getConnection(
        session.user.id
      );
      if (tiktokConnection) {
        const userInfo = tiktokConnection.userInfo;
        const tokens = tiktokConnection.tokens;

        // Try to fetch video list if scope is granted
        let videos: any[] | undefined;
        let videoListError: string | undefined;
        try {
          if (tokens.scope && tokens.scope.includes('video.list')) {
            const videoData = await TikTokService.getVideoList(
              tokens.accessToken,
              {
                maxCount: 20, // TikTok API limit is 20
                grantedScopes: tokens.scope,
                openId: tokens.openId,
              }
            );
            videos = videoData.videos;
          }
        } catch (videoError: any) {
          console.warn(
            'Error fetching video list during calculation:',
            videoError
          );
          videoListError = videoError.message;
        }

        // Store platform data with videos if available
        await PulseScoringService.savePlatformData(artistProfile.id, 'tiktok', {
          follower_count: userInfo.followerCount,
          following_count: userInfo.followingCount,
          likes_count: userInfo.likesCount,
          video_count: userInfo.videoCount,
          display_name: userInfo.displayName,
          open_id: userInfo.openId,
          bio_description: userInfo.bioDescription,
          profile_deep_link: userInfo.profileDeepLink,
          is_verified: userInfo.isVerified,
          ...(videos && {
            videos: JSON.parse(JSON.stringify(videos)), // Serialize for JSON storage
            video_list_fetched_at: new Date().toISOString(),
            video_count_in_list: videos.length,
          }),
          ...(videoListError && { video_list_error: videoListError }),
        });
      }
    } catch (error) {
      console.error('Error fetching TikTok data:', error);
      // Continue with calculation even if data fetch fails
    }

    // Calculate eligibility score
    const eligibilityResult =
      await PulseScoringService.calculateEligibilityScore(artistProfile.id);

    // Verify components exist before saving
    if (!eligibilityResult.components) {
      throw new Error('Eligibility score components are missing');
    }

    // Save eligibility score
    await PulseScoringService.saveEligibilityScore(
      artistProfile.id,
      eligibilityResult.score,
      eligibilityResult.components,
      eligibilityResult.rank
    );

    // Determine if artist should be actively monitored (Top 100)
    // Get all eligibility scores and rank them
    const allEligibilityScores = await prisma.pulseEligibilityScore.findMany({
      where: {
        calculatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { score: 'desc' },
      take: 100,
      select: { artistProfileId: true },
    });

    const top100ArtistIds = new Set(
      allEligibilityScores.map(s => s.artistProfileId)
    );
    const isActivelyMonitored = top100ArtistIds.has(artistProfile.id);

    // Update monitoring status
    await PulseScoringService.updateMonitoringStatus(
      artistProfile.id,
      isActivelyMonitored
    );

    // Note: Momentum score calculation is not yet implemented
    // Will be added in a future update

    return NextResponse.json({
      success: true,
      eligibilityScore: eligibilityResult.score,
      eligibilityRank: eligibilityResult.rank,
      eligibilityComponents: eligibilityResult.components,
      momentumScore: null,
      momentumComponents: null,
      position: null,
      isActivelyMonitored,
    });
  } catch (error) {
    console.error('Error calculating PULSE³ scores:', error);
    return NextResponse.json(
      { error: 'Failed to calculate PULSE³ scores' },
      { status: 500 }
    );
  }
}
