import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PulseScoringService } from '@/lib/services/pulse-scoring-service';
import { PulseLeagueService } from '@/lib/services/pulse-league-service';
import { TikTokService } from '@/lib/services/tiktok-service';
import { withRateLimitHandling, sleep } from '@/lib/utils/rate-limit-handler';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pulse/eligibility/recalculate
 * Protected endpoint for cron/scheduler to recalculate eligibility scores
 * Only processes artists in Top 20 (TIER1) and Watchlist (TIER2) tiers
 * Verifies secret token before processing
 * All activity is logged to the database instead of console
 */
export async function POST(req: NextRequest) {
  let recalcLogId: string | null = null;

  try {
    // Verify secret token
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Check for secret in header or query param
    // Preferred: `Authorization: Bearer <CRON_SECRET>` (works well with Vercel Cron)
    // Fallbacks: `x-cron-secret` header or `?secret=` query param (useful for manual testing)
    const authHeader = req.headers.get('authorization');
    const bearerSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;
    const headerSecret = req.headers.get('x-cron-secret');
    const querySecret = req.nextUrl.searchParams.get('secret');
    const providedSecret = bearerSecret || headerSecret || querySecret;

    if (providedSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active tiers (Top 20 and Watchlist)
    const activeTiers = await PulseLeagueService.getActiveTiers();
    const targetTiers = activeTiers.filter(
      tier => tier.code === 'TIER1' || tier.code === 'TIER2'
    );

    if (targetTiers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No target tiers found (TIER1 or TIER2)',
        artistsProcessed: 0,
        successCount: 0,
        errorCount: 0,
      });
    }

    // Get artist IDs from latest league runs for Top 20 and Watchlist
    const artistProfileIds = new Set<string>();

    for (const tier of targetTiers) {
      const entries = await PulseLeagueService.getCurrentLeagueEntries(tier.id);
      for (const entry of entries) {
        artistProfileIds.add(entry.artistProfileId);
      }
    }

    if (artistProfileIds.size === 0) {
      return NextResponse.json({
        success: true,
        message: 'No artists found in target tiers',
        artistsProcessed: 0,
        successCount: 0,
        errorCount: 0,
      });
    }

    // Get user IDs for these artists
    const artistProfiles = await prisma.artistProfile.findMany({
      where: {
        id: { in: Array.from(artistProfileIds) },
      },
      include: {
        user: {
          include: {
            accounts: {
              where: {
                provider: 'tiktok',
                access_token: { not: null },
              },
            },
          },
        },
      },
    });

    const artists = [];
    for (const profile of artistProfiles) {
      const tiktokAccount = profile.user?.accounts?.find(
        acc => acc.provider === 'tiktok' && acc.access_token
      );
      if (!tiktokAccount || !profile.user) continue;

      artists.push({
        userId: profile.user.id,
        artistProfileId: profile.id,
      });
    }

    if (artists.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No artists with TikTok connections found in target tiers',
        artistsProcessed: 0,
        successCount: 0,
        errorCount: 0,
      });
    }

    const startTime = Date.now();

    // Create main activity log entry
    const recalcLog = await prisma.pulseEligibilityRecalcLog.create({
      data: {
        startedAt: new Date(startTime),
        artistsProcessed: artists.length,
        status: 'running',
      },
    });
    recalcLogId = recalcLog.id;

    let successCount = 0;
    let errorCount = 0;
    let rateLimitCount = 0;

    // Process each artist
    for (let i = 0; i < artists.length; i++) {
      const { userId, artistProfileId } = artists[i];
      const artistStartTime = Date.now();

      // Create artist log entry
      const artistLog = await prisma.pulseEligibilityRecalcArtistLog.create({
        data: {
          recalcLogId: recalcLog.id,
          artistProfileId,
          startedAt: new Date(artistStartTime),
          success: false,
        },
      });

      try {
        // 1. Refresh TikTok snapshot with rate limit handling
        let userInfo: any = null;
        let videos: any[] | undefined;
        let videoListError: string | undefined;
        let tiktokUserInfoFetched = false;
        let tiktokVideosFetched = false;

        try {
          const tiktokConnection = await withRateLimitHandling(
            () => TikTokService.getConnection(userId),
            { maxRetries: 3, initialDelay: 1000, maxDelay: 60000 }
          );

          if (tiktokConnection) {
            userInfo = tiktokConnection.userInfo;
            const tokens = tiktokConnection.tokens;
            tiktokUserInfoFetched = true;

            // Try to fetch video list if scope is granted (with rate limit handling)
            try {
              if (tokens.scope && tokens.scope.includes('video.list')) {
                const videoData = await withRateLimitHandling(
                  () =>
                    TikTokService.getVideoList(tokens.accessToken, {
                      maxCount: 20,
                      grantedScopes: tokens.scope,
                      openId: tokens.openId,
                    }),
                  { maxRetries: 3, initialDelay: 1000, maxDelay: 60000 }
                );
                videos = videoData.videos;
                tiktokVideosFetched = true;
              }
            } catch (videoError: any) {
              videoListError = videoError.message;
              if (
                videoError?.status === 429 ||
                videoError?.response?.status === 429
              ) {
                rateLimitCount++;
              }
            }

            // Store platform data
            await PulseScoringService.savePlatformData(
              artistProfileId,
              'tiktok',
              {
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
                  videos: JSON.parse(JSON.stringify(videos)),
                  video_list_fetched_at: new Date().toISOString(),
                  video_count_in_list: videos.length,
                }),
                ...(videoListError && { video_list_error: videoListError }),
              }
            );
          }
        } catch (error: any) {
          if (error?.status === 429 || error?.response?.status === 429) {
            rateLimitCount++;
          }
          // Continue with calculation even if snapshot fails
        }

        // 2. Calculate eligibility score
        const eligibilityResult =
          await PulseScoringService.calculateEligibilityScore(artistProfileId);

        // 3. Save eligibility score
        await PulseScoringService.saveEligibilityScore(
          artistProfileId,
          eligibilityResult.score,
          eligibilityResult.components,
          eligibilityResult.rank
        );

        const duration = Date.now() - artistStartTime;
        successCount++;

        // Update artist log with success
        await prisma.pulseEligibilityRecalcArtistLog.update({
          where: { id: artistLog.id },
          data: {
            completedAt: new Date(),
            durationMs: duration,
            success: true,
            score: eligibilityResult.score,
            rank: eligibilityResult.rank,
            tiktokUserInfoFetched,
            tiktokVideosFetched,
          },
        });

        // Small delay between artists to avoid hitting rate limits
        if (i < artists.length - 1) {
          await sleep(100); // 100ms delay between artists
        }
      } catch (error: any) {
        const duration = Date.now() - artistStartTime;
        errorCount++;

        const isRateLimit =
          error?.status === 429 ||
          error?.response?.status === 429 ||
          error?.message?.includes('rate limit') ||
          error?.message?.includes('429');

        if (isRateLimit) {
          rateLimitCount++;
        }

        // Update artist log with error
        await prisma.pulseEligibilityRecalcArtistLog.update({
          where: { id: artistLog.id },
          data: {
            completedAt: new Date(),
            durationMs: duration,
            success: false,
            rateLimited: isRateLimit,
            errorMessage: error?.message || String(error),
          },
        });
      }
    }

    // Rebuild Top 100 monitoring list
    let top100Updated = 0;
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const latestScores = await prisma.pulseEligibilityScore.groupBy({
        by: ['artistProfileId'],
        where: {
          calculatedAt: {
            gte: since,
          },
        },
        _max: {
          score: true,
          calculatedAt: true,
        },
      });

      const sorted = latestScores
        .slice()
        .sort((a, b) => {
          const scoreA = a._max.score ?? 0;
          const scoreB = b._max.score ?? 0;
          if (scoreA !== scoreB) return scoreB - scoreA;

          const dateA = a._max.calculatedAt
            ? new Date(a._max.calculatedAt).getTime()
            : 0;
          const dateB = b._max.calculatedAt
            ? new Date(b._max.calculatedAt).getTime()
            : 0;
          return dateB - dateA;
        })
        .slice(0, 100);

      const top100Ids = sorted.map(s => s.artistProfileId);

      // Mark Top 100 as actively monitored
      for (const artistProfileId of top100Ids) {
        await PulseScoringService.updateMonitoringStatus(artistProfileId, true);
      }

      // Mark all others as not actively monitored
      await prisma.pulseMonitoringStatus.updateMany({
        where: {
          artistProfileId: {
            notIn: top100Ids,
          },
        },
        data: {
          isActivelyMonitored: false,
        },
      });

      top100Updated = top100Ids.length;
    } catch (error) {
      // Error rebuilding monitoring status - log but don't fail
    }

    const totalDuration = Date.now() - startTime;

    // Update main log with completion
    await prisma.pulseEligibilityRecalcLog.update({
      where: { id: recalcLog.id },
      data: {
        completedAt: new Date(),
        totalDurationMs: totalDuration,
        successCount,
        errorCount,
        rateLimitCount,
        top100Updated,
        status: 'completed',
      },
    });

    const summary = {
      success: true,
      message: `Processed ${artists.length} artist(s)`,
      artistsProcessed: artists.length,
      successCount,
      errorCount,
      rateLimitCount,
      top100Updated,
      totalDurationMs: totalDuration,
      averageDurationMs:
        artists.length > 0 ? Math.round(totalDuration / artists.length) : 0,
      logId: recalcLog.id,
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    // Log error to console for Vercel visibility
    console.error('Error in eligibility recalculate endpoint:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      cause: error?.cause,
    });

    // Update log with failure if it exists
    if (recalcLogId) {
      try {
        await prisma.pulseEligibilityRecalcLog.update({
          where: { id: recalcLogId },
          data: {
            completedAt: new Date(),
            status: 'failed',
            errorMessage: error?.message || String(error),
          },
        });
      } catch (logError) {
        console.error('Failed to update recalc log:', logError);
      }
    } else {
      // If we don't have a log ID, the error happened very early
      console.error('Error occurred before log creation:', error);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to recalculate eligibility scores',
        message: error?.message || String(error),
        stack:
          process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pulse/eligibility/recalculate
 * Vercel cron jobs send GET requests by default
 * This handler calls the POST handler
 */
export async function GET(req: NextRequest) {
  try {
    return await POST(req);
  } catch (error: any) {
    console.error('Error in GET handler for eligibility recalculate:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to recalculate eligibility scores',
        message: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
