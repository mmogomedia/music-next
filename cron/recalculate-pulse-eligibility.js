/* eslint-disable no-console */
/**
 * Recalculate PULSE³ eligibility scores for all artists with a TikTok connection.
 *
 * This script is intended to be run by a scheduler/cron (e.g. daily).
 * It does the following:
 * 1. Finds all users who have a TikTok Account connection and an ArtistProfile.
 * 2. For each artist:
 *    - Fetches latest TikTok data (user info + optional videos) and stores a platform snapshot.
 *    - Calculates eligibility score using PulseScoringService.
 *    - Saves the new eligibility score to the database.
 * 3. After all scores are saved, recalculates the Top 100 monitoring list.
 *
 * Usage:
 *   dotenv -e .env.local -- node cron/recalculate-pulse-eligibility.js
 */

const { prisma } = require('@/lib/db');
const { PulseScoringService } = require('@/lib/services/pulse-scoring-service');
const { TikTokService } = require('@/lib/services/tiktok-service');

async function getArtistsWithTikTokConnection() {
  const accounts = await prisma.account.findMany({
    where: {
      provider: 'tiktok',
      access_token: {
        not: null,
      },
    },
    include: {
      user: {
        include: {
          artistProfile: true,
        },
      },
    },
  });

  const artists = [];

  for (const account of accounts) {
    const user = account.user;
    if (!user?.artistProfile) continue;

    artists.push({
      userId: user.id,
      artistProfileId: user.artistProfile.id,
    });
  }

  return artists;
}

async function refreshTikTokSnapshotForArtist(userId, artistProfileId) {
  try {
    const tiktokConnection = await TikTokService.getConnection(userId);
    if (!tiktokConnection) return;

    const userInfo = tiktokConnection.userInfo;
    const tokens = tiktokConnection.tokens;

    // Try to fetch video list if scope is granted
    let videos;
    let videoListError;

    try {
      if (tokens.scope && tokens.scope.includes('video.list')) {
        const videoData = await TikTokService.getVideoList(tokens.accessToken, {
          maxCount: 20, // TikTok API limit is 20
          grantedScopes: tokens.scope,
          openId: tokens.openId,
        });
        videos = videoData.videos;
      }
    } catch (videoError) {
      console.warn(
        '[PULSE Cron] Error fetching video list for artist',
        artistProfileId,
        videoError
      );
      videoListError =
        videoError instanceof Error ? videoError.message : String(videoError);
    }

    // Store platform data with videos if available
    await PulseScoringService.savePlatformData(artistProfileId, 'tiktok', {
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
  } catch (error) {
    console.error(
      '[PULSE Cron] Error refreshing TikTok snapshot for artist',
      artistProfileId,
      error
    );
  }
}

async function recalculateEligibilityForAllArtists() {
  console.log('[PULSE Cron] Starting eligibility recalculation...');

  const artists = await getArtistsWithTikTokConnection();
  console.log(
    `[PULSE Cron] Found ${artists.length} artists with TikTok connections.`
  );

  for (const { userId, artistProfileId } of artists) {
    console.log('[PULSE Cron] Processing artist:', artistProfileId);

    // 1. Refresh TikTok snapshot (best-effort; failures should not block scoring)
    await refreshTikTokSnapshotForArtist(userId, artistProfileId);

    // 2. Calculate eligibility score
    try {
      const eligibilityResult =
        await PulseScoringService.calculateEligibilityScore(artistProfileId);

      // 3. Save eligibility score
      await PulseScoringService.saveEligibilityScore(
        artistProfileId,
        eligibilityResult.score,
        eligibilityResult.components,
        eligibilityResult.rank
      );

      console.log(
        '[PULSE Cron] Saved eligibility score',
        eligibilityResult.score,
        'for artist',
        artistProfileId
      );
    } catch (error) {
      console.error(
        '[PULSE Cron] Error calculating eligibility score for artist',
        artistProfileId,
        error
      );
    }
  }

  // 4. Rebuild Top 100 monitoring list based on most recent 24h scores
  await rebuildMonitoringStatus();

  console.log('[PULSE Cron] Eligibility recalculation completed.');
}

async function rebuildMonitoringStatus() {
  console.log('[PULSE Cron] Rebuilding monitoring status (Top 100)...');

  // Find top 100 artists by latest eligibility scores in the last 24 hours
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

  // Sort by score desc, then by calculatedAt desc
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

  console.log(
    `[PULSE Cron] Monitoring status updated. Top 100 count: ${top100Ids.length}`
  );
}

async function main() {
  try {
    await recalculateEligibilityForAllArtists();
  } catch (error) {
    console.error(
      '[PULSE Cron] Fatal error during eligibility recalculation:',
      error
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
