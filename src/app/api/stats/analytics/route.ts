import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AnalyticsQuery {
  trackId?: string;
  artistId?: string;
  timeRange?: '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
  metric?: 'plays' | 'likes' | 'shares' | 'downloads' | 'saves';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');
    const artistId = searchParams.get('artistId');
    const timeRange =
      (searchParams.get('timeRange') as AnalyticsQuery['timeRange']) || '7d';
    const metric =
      (searchParams.get('metric') as AnalyticsQuery['metric']) || 'plays';

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

    let analytics;

    if (trackId) {
      // Track-specific analytics
      analytics = await getTrackAnalytics(
        trackId,
        startDate,
        metric,
        timeRange
      );
    } else if (artistId) {
      // Artist-specific analytics
      analytics = await getArtistAnalytics(artistId, startDate, metric);
    } else {
      // Global analytics
      analytics = await getGlobalAnalytics(startDate, metric);
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      timeRange,
      metric,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function getTrackAnalytics(
  trackId: string,
  startDate: Date,
  metric: string,
  timeRange: string
) {
  // Determine which aggregated table to use based on time range
  let aggregatedData: any = null;
  let rawData: any = null;

  // Try to get aggregated data first for better performance
  if (
    timeRange === '7d' ||
    timeRange === '30d' ||
    timeRange === '90d' ||
    timeRange === '1y'
  ) {
    aggregatedData = await getAggregatedTrackData(
      trackId,
      startDate,
      timeRange
    );
  }

  // Fallback to raw data if aggregated data is not available
  if (!aggregatedData) {
    rawData = await getRawTrackData(trackId, startDate, metric);
  }

  const data = aggregatedData || rawData;

  switch (metric) {
    case 'plays':
      return {
        totalPlays: data.totalPlays || 0,
        uniquePlays: data.uniquePlays || 0,
        sourceBreakdown: data.sourceBreakdown || [],
        avgDuration: data.avgDuration || 0,
        avgCompletionRate: data.avgCompletionRate || 0,
        skipRate: data.skipRate || 0,
        replayRate: data.replayRate || 0,
      };

    case 'likes':
      return { totalLikes: data.totalLikes || 0 };

    case 'shares':
      return {
        totalShares: data.totalShares || 0,
        platformBreakdown: data.platformBreakdown || [],
      };

    case 'downloads':
      return { totalDownloads: data.totalDownloads || 0 };

    case 'saves':
      return { totalSaves: data.totalSaves || 0 };

    default:
      return {};
  }
}

async function getAggregatedTrackData(
  trackId: string,
  startDate: Date,
  timeRange: string
) {
  const endDate = new Date();

  switch (timeRange) {
    case '7d': {
      const weeklyStats = await prisma.weeklyStats.findMany({
        where: {
          trackId,
          weekStart: { gte: startDate, lte: endDate },
        },
      });

      if (weeklyStats.length === 0) return null;

      return {
        totalPlays: weeklyStats.reduce((sum, stat) => sum + stat.totalPlays, 0),
        uniquePlays: weeklyStats.reduce(
          (sum, stat) => sum + stat.uniquePlays,
          0
        ),
        totalLikes: weeklyStats.reduce((sum, stat) => sum + stat.totalLikes, 0),
        totalShares: weeklyStats.reduce(
          (sum, stat) => sum + stat.totalShares,
          0
        ),
        totalDownloads: weeklyStats.reduce(
          (sum, stat) => sum + stat.totalDownloads,
          0
        ),
        totalSaves: weeklyStats.reduce((sum, stat) => sum + stat.totalSaves, 0),
        avgDuration:
          weeklyStats.reduce((sum, stat) => sum + stat.avgDuration, 0) /
          weeklyStats.length,
        avgCompletionRate:
          weeklyStats.reduce((sum, stat) => sum + stat.avgCompletionRate, 0) /
          weeklyStats.length,
        skipRate:
          weeklyStats.reduce((sum, stat) => sum + stat.skipRate, 0) /
          weeklyStats.length,
        replayRate:
          weeklyStats.reduce((sum, stat) => sum + stat.replayRate, 0) /
          weeklyStats.length,
      };
    }

    case '30d':
    case '90d': {
      const monthlyStats = await prisma.monthlyStats.findMany({
        where: {
          trackId,
          monthStart: { gte: startDate, lte: endDate },
        },
      });

      if (monthlyStats.length === 0) return null;

      return {
        totalPlays: monthlyStats.reduce(
          (sum, stat) => sum + stat.totalPlays,
          0
        ),
        uniquePlays: monthlyStats.reduce(
          (sum, stat) => sum + stat.uniquePlays,
          0
        ),
        totalLikes: monthlyStats.reduce(
          (sum, stat) => sum + stat.totalLikes,
          0
        ),
        totalShares: monthlyStats.reduce(
          (sum, stat) => sum + stat.totalShares,
          0
        ),
        totalDownloads: monthlyStats.reduce(
          (sum, stat) => sum + stat.totalDownloads,
          0
        ),
        totalSaves: monthlyStats.reduce(
          (sum, stat) => sum + stat.totalSaves,
          0
        ),
        avgDuration:
          monthlyStats.reduce((sum, stat) => sum + stat.avgDuration, 0) /
          monthlyStats.length,
        avgCompletionRate:
          monthlyStats.reduce((sum, stat) => sum + stat.avgCompletionRate, 0) /
          monthlyStats.length,
        skipRate:
          monthlyStats.reduce((sum, stat) => sum + stat.skipRate, 0) /
          monthlyStats.length,
        replayRate:
          monthlyStats.reduce((sum, stat) => sum + stat.replayRate, 0) /
          monthlyStats.length,
      };
    }

    case '1y': {
      const yearlyStats = await prisma.yearlyStats.findMany({
        where: {
          trackId,
          year: { gte: startDate.getFullYear(), lte: endDate.getFullYear() },
        },
      });

      if (yearlyStats.length === 0) return null;

      return {
        totalPlays: yearlyStats.reduce((sum, stat) => sum + stat.totalPlays, 0),
        uniquePlays: yearlyStats.reduce(
          (sum, stat) => sum + stat.uniquePlays,
          0
        ),
        totalLikes: yearlyStats.reduce((sum, stat) => sum + stat.totalLikes, 0),
        totalShares: yearlyStats.reduce(
          (sum, stat) => sum + stat.totalShares,
          0
        ),
        totalDownloads: yearlyStats.reduce(
          (sum, stat) => sum + stat.totalDownloads,
          0
        ),
        totalSaves: yearlyStats.reduce((sum, stat) => sum + stat.totalSaves, 0),
        avgDuration:
          yearlyStats.reduce((sum, stat) => sum + stat.avgDuration, 0) /
          yearlyStats.length,
        avgCompletionRate:
          yearlyStats.reduce((sum, stat) => sum + stat.avgCompletionRate, 0) /
          yearlyStats.length,
        skipRate:
          yearlyStats.reduce((sum, stat) => sum + stat.skipRate, 0) /
          yearlyStats.length,
        replayRate:
          yearlyStats.reduce((sum, stat) => sum + stat.replayRate, 0) /
          yearlyStats.length,
      };
    }

    default:
      return null;
  }
}

async function getRawTrackData(
  trackId: string,
  startDate: Date,
  metric: string
) {
  const whereClause = {
    trackId,
    timestamp: { gte: startDate },
  };

  switch (metric) {
    case 'plays': {
      const playStats = await prisma.playEvent.groupBy({
        by: ['source'],
        where: whereClause,
        _count: { id: true },
        _avg: { duration: true, completionRate: true },
      });

      const totalPlays = await prisma.playEvent.count({
        where: whereClause,
      });

      const uniquePlays = await prisma.playEvent.groupBy({
        by: ['sessionId'],
        where: whereClause,
        _count: { id: true },
      });

      return {
        totalPlays,
        uniquePlays: uniquePlays.length,
        sourceBreakdown: playStats,
        avgDuration: playStats[0]?._avg.duration || 0,
        avgCompletionRate: playStats[0]?._avg.completionRate || 0,
      };
    }

    case 'likes': {
      const likeStats = await prisma.likeEvent.count({
        where: { ...whereClause, action: 'like' },
      });

      return { totalLikes: likeStats };
    }

    case 'shares': {
      const shareStats = await prisma.shareEvent.groupBy({
        by: ['platform'],
        where: whereClause,
        _count: { id: true },
      });

      return {
        totalShares: shareStats.reduce((sum, stat) => sum + stat._count.id, 0),
        platformBreakdown: shareStats,
      };
    }

    case 'downloads': {
      const downloadStats = await prisma.downloadEvent.count({
        where: whereClause,
      });

      return { totalDownloads: downloadStats };
    }

    case 'saves': {
      const saveStats = await prisma.saveEvent.count({
        where: { ...whereClause, action: 'save' },
      });

      return { totalSaves: saveStats };
    }

    default:
      return {};
  }
}

async function getArtistAnalytics(
  artistId: string,
  startDate: Date,
  metric: string
) {
  // Get all tracks by artist
  const artistTracks = await prisma.track.findMany({
    where: {
      artistProfileId: artistId,
    },
    select: { id: true },
  });

  const trackIds = artistTracks.map(track => track.id);

  const whereClause = {
    trackId: { in: trackIds },
    timestamp: { gte: startDate },
  };

  switch (metric) {
    case 'plays': {
      const totalPlays = await prisma.playEvent.count({
        where: whereClause,
      });

      const uniquePlays = await prisma.playEvent.groupBy({
        by: ['sessionId'],
        where: whereClause,
        _count: { id: true },
      });

      return {
        totalPlays,
        uniquePlays: uniquePlays.length,
        tracksCount: trackIds.length,
      };
    }

    case 'likes': {
      const totalLikes = await prisma.likeEvent.count({
        where: { ...whereClause, action: 'like' },
      });

      return { totalLikes };
    }

    case 'shares': {
      const totalShares = await prisma.shareEvent.count({
        where: whereClause,
      });

      return { totalShares };
    }

    case 'downloads': {
      const totalDownloads = await prisma.downloadEvent.count({
        where: whereClause,
      });

      return { totalDownloads };
    }

    default:
      return {};
  }
}

async function getGlobalAnalytics(startDate: Date, metric: string) {
  const whereClause = {
    timestamp: { gte: startDate },
  };

  switch (metric) {
    case 'plays': {
      const totalPlays = await prisma.playEvent.count({
        where: whereClause,
      });

      const topTracks = await prisma.playEvent.groupBy({
        by: ['trackId'],
        where: whereClause,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      // Get track details for top tracks
      const topTrackIds = topTracks.map(t => t.trackId);
      const trackDetails = await prisma.track.findMany({
        where: { id: { in: topTrackIds } },
        select: {
          id: true,
          title: true,
          artist: true,
          artistProfile: { select: { artistName: true } },
        },
      });

      const topTracksWithDetails = topTracks.map(stat => {
        const track = trackDetails.find(t => t.id === stat.trackId);
        return {
          ...stat,
          track: track
            ? {
                title: track.title,
                artist: track.artist || track.artistProfile?.artistName,
              }
            : null,
        };
      });

      return {
        totalPlays,
        topTracks: topTracksWithDetails,
      };
    }

    case 'likes': {
      const totalLikes = await prisma.likeEvent.count({
        where: { ...whereClause, action: 'like' },
      });

      return { totalLikes };
    }

    case 'shares': {
      const totalShares = await prisma.shareEvent.count({
        where: whereClause,
      });

      return { totalShares };
    }

    case 'downloads': {
      const totalDownloads = await prisma.downloadEvent.count({
        where: whereClause,
      });

      return { totalDownloads };
    }

    default:
      return {};
  }
}
