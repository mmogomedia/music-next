import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PulseScoringService } from '@/lib/services/pulse-scoring-service';
import { TikTokService } from '@/lib/services/tiktok-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pulse/calculate-breakdown
 * Returns detailed calculation breakdown for the current user's eligibility score
 */
export async function GET(_req: NextRequest) {
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
        { error: 'TikTok not connected' },
        { status: 400 }
      );
    }

    const userInfo = tiktokConnection.userInfo;
    const followerCount = userInfo.followerCount || 0;

    // Get most recent platform data
    const latestPlatformData = await prisma.pulsePlatformData.findFirst({
      where: {
        artistProfileId: artistProfile.id,
        platform: 'tiktok',
      },
      orderBy: { fetchedAt: 'desc' },
    });

    const platformData = latestPlatformData?.data as any;
    const videos = (platformData?.videos || []).slice(0, 20);

    // Calculate TikTok data summary
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalViews = 0;
    const engagementRates: number[] = [];
    const performanceRatios: number[] = [];

    for (const video of videos) {
      const viewCount = video.viewCount || 0;
      const likeCount = video.likeCount || 0;
      const commentCount = video.commentCount || 0;
      const shareCount = video.shareCount || 0;

      totalLikes += likeCount;
      totalComments += commentCount;
      totalShares += shareCount;
      totalViews += viewCount;

      const engagement = likeCount + commentCount + shareCount;
      const denominator = Math.max(viewCount, followerCount, 100);
      const engagementRate = denominator > 0 ? engagement / denominator : 0;
      engagementRates.push(engagementRate);

      const performanceRatio =
        Math.max(followerCount, 100) > 0
          ? viewCount / Math.max(followerCount, 100)
          : 0;
      performanceRatios.push(performanceRatio);
    }

    const avgEngagementRate =
      engagementRates.length > 0
        ? engagementRates.reduce((sum, rate) => sum + rate, 0) /
          engagementRates.length
        : 0;

    const avgPerformanceRatio =
      performanceRatios.length > 0
        ? performanceRatios.reduce((sum, ratio) => sum + ratio, 0) /
          performanceRatios.length
        : 0;

    // Calculate videos per day (last 30 days)
    let videosPerDay = 0;
    if (videos.length > 0) {
      const sortedVideos = [...videos].sort(
        (a, b) => (b.createTime || 0) - (a.createTime || 0)
      );
      const oldestVideo = sortedVideos[sortedVideos.length - 1];
      const newestVideo = sortedVideos[0];

      if (oldestVideo?.createTime && newestVideo?.createTime) {
        const daysDiff =
          (newestVideo.createTime - oldestVideo.createTime) / (24 * 60 * 60);
        videosPerDay = daysDiff > 0 ? videos.length / daysDiff : 0;
      } else {
        // Fallback: assume videos are from last 30 days
        videosPerDay = videos.length / 30;
      }
    }

    // Calculate eligibility score
    const scoreResult = await PulseScoringService.calculateEligibilityScore(
      artistProfile.id
    );

    return NextResponse.json({
      tiktokData: {
        followerCount,
        videoCount: userInfo.videoCount || 0,
        videosAnalyzed: videos.length,
        totalLikes,
        totalComments,
        totalShares,
        totalViews,
        avgEngagementRate,
        avgPerformanceRatio,
        videosPerDay,
      },
      scoreBreakdown: {
        followerScore: scoreResult.components.followerScore,
        engagementScore: scoreResult.components.engagementScore,
        consistencyScore: scoreResult.components.consistencyScore,
        platformDiversityScore: scoreResult.components.platformDiversityScore,
        totalScore: scoreResult.score,
      },
    });
  } catch (error: any) {
    console.error('Error calculating score breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to calculate score breakdown' },
      { status: 500 }
    );
  }
}
