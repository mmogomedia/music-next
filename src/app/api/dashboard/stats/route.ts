import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const userId = session.user.id;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get user's artist profile
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId },
      select: { id: true, artistName: true, isVerified: true },
    });

    // Get user's tracks
    const userTracks = await prisma.track.findMany({
      where: { userId },
      select: { id: true, title: true, playCount: true },
    });

    const trackIds = userTracks.map(track => track.id);

    // Get aggregated stats for user's tracks
    const stats = await getAggregatedStats(trackIds, startDate, timeRange);

    // Get recent activity
    const recentActivity = await getRecentActivity(trackIds, startDate);

    // Get top performing tracks
    const topTracks = await getTopPerformingTracks(trackIds, startDate);

    // Get engagement metrics
    const engagementMetrics = await getEngagementMetrics(trackIds, startDate);

    // Get playlist performance
    const playlistStats = await getPlaylistStats(userId, startDate);

    // Get growth metrics (compare with previous period)
    const growthMetrics = await getGrowthMetrics(
      trackIds,
      startDate,
      timeRange
    );

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalTracks: userTracks.length,
          totalPlays: stats.totalPlays,
          totalLikes: stats.totalLikes,
          totalShares: stats.totalShares,
          totalDownloads: stats.totalDownloads,
          totalSaves: stats.totalSaves,
          uniqueListeners: stats.uniqueListeners,
          avgDuration: stats.avgDuration,
          avgCompletionRate: stats.avgCompletionRate,
        },
        artistProfile,
        recentActivity,
        topTracks,
        engagementMetrics,
        playlistStats,
        growthMetrics,
        timeRange,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

async function getAggregatedStats(
  trackIds: string[],
  startDate: Date,
  timeRange: string
) {
  if (trackIds.length === 0) {
    return {
      totalPlays: 0,
      totalLikes: 0,
      totalShares: 0,
      totalDownloads: 0,
      totalSaves: 0,
      uniqueListeners: 0,
      avgDuration: 0,
      avgCompletionRate: 0,
    };
  }

  // Try to get aggregated data first
  let aggregatedData = null;

  if (timeRange === '7d') {
    aggregatedData = await prisma.weeklyStats.findMany({
      where: {
        trackId: { in: trackIds },
        weekStart: { gte: startDate },
      },
    });
  } else if (timeRange === '30d' || timeRange === '90d') {
    aggregatedData = await prisma.monthlyStats.findMany({
      where: {
        trackId: { in: trackIds },
        monthStart: { gte: startDate },
      },
    });
  } else if (timeRange === '1y') {
    aggregatedData = await prisma.yearlyStats.findMany({
      where: {
        trackId: { in: trackIds },
        year: { gte: startDate.getFullYear() },
      },
    });
  }

  if (aggregatedData && aggregatedData.length > 0) {
    return {
      totalPlays: aggregatedData.reduce(
        (sum, stat) => sum + stat.totalPlays,
        0
      ),
      totalLikes: aggregatedData.reduce(
        (sum, stat) => sum + stat.totalLikes,
        0
      ),
      totalShares: aggregatedData.reduce(
        (sum, stat) => sum + stat.totalShares,
        0
      ),
      totalDownloads: aggregatedData.reduce(
        (sum, stat) => sum + stat.totalDownloads,
        0
      ),
      totalSaves: aggregatedData.reduce(
        (sum, stat) => sum + stat.totalSaves,
        0
      ),
      uniqueListeners: aggregatedData.reduce(
        (sum, stat) => sum + stat.uniquePlays,
        0
      ),
      avgDuration:
        aggregatedData.reduce((sum, stat) => sum + stat.avgDuration, 0) /
        aggregatedData.length,
      avgCompletionRate:
        aggregatedData.reduce((sum, stat) => sum + stat.avgCompletionRate, 0) /
        aggregatedData.length,
    };
  }

  // Fallback to raw data
  const [plays, likes, shares, downloads, saves] = await Promise.all([
    prisma.playEvent.count({
      where: {
        trackId: { in: trackIds },
        timestamp: { gte: startDate },
      },
    }),
    prisma.likeEvent.count({
      where: {
        trackId: { in: trackIds },
        timestamp: { gte: startDate },
        action: 'like',
      },
    }),
    prisma.shareEvent.count({
      where: {
        trackId: { in: trackIds },
        timestamp: { gte: startDate },
      },
    }),
    prisma.downloadEvent.count({
      where: {
        trackId: { in: trackIds },
        timestamp: { gte: startDate },
      },
    }),
    prisma.saveEvent.count({
      where: {
        trackId: { in: trackIds },
        timestamp: { gte: startDate },
        action: 'save',
      },
    }),
  ]);

  const uniqueListeners = await prisma.playEvent.groupBy({
    by: ['sessionId'],
    where: {
      trackId: { in: trackIds },
      timestamp: { gte: startDate },
    },
  });

  const avgDuration = await prisma.playEvent.aggregate({
    where: {
      trackId: { in: trackIds },
      timestamp: { gte: startDate },
    },
    _avg: { duration: true },
  });

  return {
    totalPlays: plays,
    totalLikes: likes,
    totalShares: shares,
    totalDownloads: downloads,
    totalSaves: saves,
    uniqueListeners: uniqueListeners.length,
    avgDuration: avgDuration._avg.duration || 0,
    avgCompletionRate: 0, // Would need to calculate from raw data
  };
}

async function getRecentActivity(trackIds: string[], startDate: Date) {
  if (trackIds.length === 0) {
    return {
      plays: [],
      likes: [],
      downloads: [],
      pageVisits: [],
    };
  }

  const recentPlays = await prisma.playEvent.findMany({
    where: {
      trackId: { in: trackIds },
      timestamp: { gte: startDate },
    },
    include: {
      track: {
        select: {
          id: true,
          title: true,
          artist: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: 10,
  });

  const recentLikes = await prisma.likeEvent.findMany({
    where: {
      trackId: { in: trackIds },
      timestamp: { gte: startDate },
      action: 'like',
    },
    include: {
      track: {
        select: {
          id: true,
          title: true,
          artist: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: 5,
  });

  const recentDownloads = await prisma.downloadEvent.findMany({
    where: {
      trackId: { in: trackIds },
      timestamp: { gte: startDate },
    },
    include: {
      track: {
        select: {
          id: true,
          title: true,
          artist: true,
        },
      },
    },
    orderBy: { timestamp: 'desc' },
    take: 5,
  });

  const recentPageVisits = await prisma.quickLink.findMany({
    where: {
      trackId: { in: trackIds },
      lastVisitedAt: { gte: startDate },
    },
    include: {
      track: {
        select: {
          id: true,
          title: true,
          artist: true,
        },
      },
    },
    orderBy: { lastVisitedAt: 'desc' },
    take: 5,
  });

  return {
    plays: recentPlays
      .filter(play => play.track)
      .map(play => ({
        type: 'play' as const,
        track: {
          id: play.track!.id,
          title: play.track!.title,
          artist: play.track!.artist || 'Unknown Artist',
        },
        timestamp: play.timestamp,
        source: play.source,
      })),
    likes: recentLikes
      .filter(like => like.track)
      .map(like => ({
        type: 'like' as const,
        track: {
          id: like.track!.id,
          title: like.track!.title,
          artist: like.track!.artist || 'Unknown Artist',
        },
        timestamp: like.timestamp,
      })),
    downloads: recentDownloads
      .filter(download => download.track)
      .map(download => ({
        type: 'download' as const,
        track: {
          id: download.track!.id,
          title: download.track!.title,
          artist: download.track!.artist || 'Unknown Artist',
        },
        timestamp: download.timestamp,
      })),
    pageVisits: recentPageVisits
      .filter(visit => visit.track && visit.lastVisitedAt)
      .map(visit => ({
        type: 'page_visit' as const,
        track: {
          id: visit.track!.id,
          title: visit.track!.title,
          artist: visit.track!.artist || 'Unknown Artist',
        },
        timestamp: visit.lastVisitedAt!,
        slug: visit.slug,
      })),
  };
}

async function getTopPerformingTracks(trackIds: string[], startDate: Date) {
  if (trackIds.length === 0) return [];

  const topTracks = await prisma.playEvent.groupBy({
    by: ['trackId'],
    where: {
      trackId: { in: trackIds },
      timestamp: { gte: startDate },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });

  const trackDetails = await prisma.track.findMany({
    where: { id: { in: topTracks.map(t => t.trackId) } },
    select: {
      id: true,
      title: true,
      artist: true,
      playCount: true,
      coverImageUrl: true,
      completionPercentage: true,
    },
  });

  return topTracks.map(stat => {
    const track = trackDetails.find(t => t.id === stat.trackId);
    return {
      ...stat,
      track: track || null,
    };
  });
}

async function getEngagementMetrics(trackIds: string[], startDate: Date) {
  if (trackIds.length === 0) {
    return {
      likeRate: 0,
      shareRate: 0,
      saveRate: 0,
      downloadRate: 0,
      completionRate: 0,
    };
  }

  const [totalPlays, totalLikes, totalShares, totalSaves, totalDownloads] =
    await Promise.all([
      prisma.playEvent.count({
        where: {
          trackId: { in: trackIds },
          timestamp: { gte: startDate },
        },
      }),
      prisma.likeEvent.count({
        where: {
          trackId: { in: trackIds },
          timestamp: { gte: startDate },
          action: 'like',
        },
      }),
      prisma.shareEvent.count({
        where: {
          trackId: { in: trackIds },
          timestamp: { gte: startDate },
        },
      }),
      prisma.saveEvent.count({
        where: {
          trackId: { in: trackIds },
          timestamp: { gte: startDate },
          action: 'save',
        },
      }),
      prisma.downloadEvent.count({
        where: {
          trackId: { in: trackIds },
          timestamp: { gte: startDate },
        },
      }),
    ]);

  return {
    likeRate: totalPlays > 0 ? (totalLikes / totalPlays) * 100 : 0,
    shareRate: totalPlays > 0 ? (totalShares / totalPlays) * 100 : 0,
    saveRate: totalPlays > 0 ? (totalSaves / totalPlays) * 100 : 0,
    downloadRate: totalPlays > 0 ? (totalDownloads / totalPlays) * 100 : 0,
    completionRate: 0, // Would need to calculate from duration data
  };
}

async function getPlaylistStats(userId: string, startDate: Date) {
  // Get playlists created by user
  const userPlaylists = await prisma.playlist.findMany({
    where: { createdBy: userId },
    select: {
      id: true,
      name: true,
      currentTracks: true,
      status: true,
      analytics: {
        where: { date: { gte: startDate } },
        select: {
          views: true,
          plays: true,
          likes: true,
          shares: true,
          uniqueListeners: true,
        },
      },
    },
  });

  // Get playlist submissions by user
  const submissions = await prisma.playlistSubmission.findMany({
    where: {
      artistId: userId,
      submittedAt: { gte: startDate },
    },
    include: {
      playlist: {
        select: {
          id: true,
          name: true,
        },
      },
      track: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
    take: 10,
  });

  return {
    playlists: userPlaylists,
    submissions,
  };
}

async function getGrowthMetrics(
  trackIds: string[],
  startDate: Date,
  timeRange: string
) {
  if (trackIds.length === 0)
    return { playsGrowth: 0, likesGrowth: 0, sharesGrowth: 0 };

  // Calculate previous period
  const periodLength = startDate.getTime() - new Date(0).getTime();
  const previousStartDate = new Date(startDate.getTime() - periodLength);

  const [currentStats, previousStats] = await Promise.all([
    getAggregatedStats(trackIds, startDate, timeRange),
    getAggregatedStats(trackIds, previousStartDate, timeRange),
  ]);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return {
    playsGrowth: calculateGrowth(
      currentStats.totalPlays,
      previousStats.totalPlays
    ),
    likesGrowth: calculateGrowth(
      currentStats.totalLikes,
      previousStats.totalLikes
    ),
    sharesGrowth: calculateGrowth(
      currentStats.totalShares,
      previousStats.totalShares
    ),
  };
}
