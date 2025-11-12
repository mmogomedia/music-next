import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total counts
    const [
      totalUsers,
      totalArtists,
      totalTracks,
      totalPlaylists,
      totalSubmissions,
      recentUsers,
      recentTracks,
      recentSubmissions,
      playEvents,
      downloadEvents,
      quickLinks,
      recentPlayEvents,
      recentDownloadEvents,
      recentQuickLinkVisits,
      recentLikeEvents,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.artistProfile.count(),
      prisma.track.count(),
      prisma.playlist.count(),
      prisma.playlistSubmission.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true,
        },
      }),
      prisma.track.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          artist: true,
          createdAt: true,
        },
      }),
      prisma.playlistSubmission.findMany({
        take: 5,
        orderBy: { submittedAt: 'desc' },
        include: {
          track: {
            select: {
              title: true,
              artist: true,
            },
          },
          playlist: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.playEvent.count(),
      prisma.downloadEvent.count(),
      prisma.quickLink.aggregate({
        _sum: {
          totalVisits: true,
        },
      }),
      prisma.playEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          track: {
            select: {
              id: true,
              title: true,
              artist: true,
            },
          },
        },
      }),
      prisma.downloadEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          track: {
            select: {
              id: true,
              title: true,
              artist: true,
            },
          },
        },
      }),
      prisma.quickLink.findMany({
        orderBy: { lastVisitedAt: 'desc' },
        take: 10,
        include: {
          track: {
            select: {
              id: true,
              title: true,
              artist: true,
            },
          },
        },
        where: {
          lastVisitedAt: { not: null },
        },
      }),
      prisma.likeEvent.findMany({
        where: {
          action: 'like',
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          track: {
            select: {
              id: true,
              title: true,
              artist: true,
            },
          },
        },
      }),
    ]);

    // Calculate platform health based on recent activity
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = await prisma.user.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
      },
    });

    let platformHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (recentActivity < 1) {
      platformHealth = 'warning';
    }
    if (recentActivity < 0) {
      platformHealth = 'critical';
    }

    const recentActivityStructured = {
      plays: recentPlayEvents
        .filter(event => event.track)
        .map(event => ({
          type: 'play' as const,
          track: {
            id: event.track!.id,
            title: event.track!.title,
            artist: event.track!.artist,
          },
          timestamp: event.timestamp.toISOString(),
          source: event.source,
        })),
      likes: recentLikeEvents
        .filter(event => event.track)
        .map(event => ({
          type: 'like' as const,
          track: {
            id: event.track!.id,
            title: event.track!.title,
            artist: event.track!.artist,
          },
          timestamp: event.timestamp.toISOString(),
        })),
      downloads: recentDownloadEvents
        .filter(event => event.track)
        .map(event => ({
          type: 'download' as const,
          track: {
            id: event.track!.id,
            title: event.track!.title,
            artist: event.track!.artist,
          },
          timestamp: event.timestamp.toISOString(),
        })),
      pageVisits: recentQuickLinkVisits
        .filter(visit => visit.track && visit.lastVisitedAt)
        .map(visit => ({
          type: 'page_visit' as const,
          track: {
            id: visit.track!.id,
            title: visit.track!.title,
            artist: visit.track!.artist,
          },
          timestamp: visit.lastVisitedAt!.toISOString(),
          slug: visit.slug,
        })),
    };

    const recentActivityFeed = [
      ...recentUsers.map(user => ({
        id: `user-${user.id}`,
        type: 'user_registration',
        message: `New user registered: ${user.name || user.email}`,
        timestamp: formatTimeAgo(user.createdAt),
        icon: 'UserGroupIcon',
        color: 'text-blue-600',
      })),
      ...recentTracks.map(track => ({
        id: `track-${track.id}`,
        type: 'track_upload',
        message: `New track uploaded: "${track.title}" by ${track.artist}`,
        timestamp: formatTimeAgo(track.createdAt),
        icon: 'MusicalNoteIcon',
        color: 'text-green-600',
      })),
      ...recentSubmissions.map(submission => ({
        id: `submission-${submission.id}`,
        type: 'playlist_submission',
        message: `Track "${submission.track.title}" submitted to ${submission.playlist.name}`,
        timestamp: formatTimeAgo(submission.submittedAt),
        icon: 'ClockIcon',
        color: 'text-purple-600',
      })),
      ...recentActivityStructured.plays.map(play =>
        mapActivityItem({
          id: `play-${play.track.id}-${play.timestamp.toString()}`,
          type: 'play',
          track: play.track,
          timestamp: play.timestamp,
          source: play.source,
        })
      ),
      ...recentActivityStructured.downloads.map(download =>
        mapActivityItem({
          id: `download-${download.track.id}-${download.timestamp.toString()}`,
          type: 'download',
          track: download.track,
          timestamp: download.timestamp,
        })
      ),
      ...recentActivityStructured.pageVisits.map(visit =>
        mapActivityItem({
          id: `page_visit-${visit.track.id}-${visit.timestamp.toString()}`,
          type: 'page_visit',
          track: visit.track,
          timestamp: visit.timestamp,
          slug: visit.slug,
        })
      ),
    ].slice(0, 20);

    // Calculate pending actions
    const pendingSubmissions = await prisma.playlistSubmission.count({
      where: { status: 'PENDING' },
    });

    const pendingActions = [
      {
        id: '1',
        type: 'submission_review',
        title: 'Submission Review',
        description: `${pendingSubmissions} tracks pending review`,
        priority:
          pendingSubmissions > 10
            ? 'high'
            : pendingSubmissions > 5
              ? 'medium'
              : 'low',
        count: pendingSubmissions,
      },
      {
        id: '2',
        type: 'content_review',
        title: 'Content Review',
        description: 'Review uploaded content',
        priority: 'medium',
        count: 0,
      },
      {
        id: '3',
        type: 'user_management',
        title: 'User Management',
        description: 'Manage user accounts',
        priority: 'low',
        count: 0,
      },
    ];

    const totalPageViews = quickLinks._sum.totalVisits ?? 0;

    const systemMetrics = {
      totalUsers,
      totalArtists,
      totalTracks,
      totalPlays: playEvents,
      totalDownloads: downloadEvents,
      totalPageViews,
      totalRevenue: 0, // TODO: Implement revenue tracking
      platformHealth,
    };

    return NextResponse.json({
      success: true,
      data: {
        systemMetrics,
        recentActivity: {
          plays: recentActivityStructured.plays,
          likes: recentActivityStructured.likes,
          downloads: recentActivityStructured.downloads,
          pageVisits: recentActivityStructured.pageVisits,
        },
        recentActivityFeed,
        pendingActions,
        totalPlaylists,
        totalSubmissions,
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard stats' },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

function mapActivityItem(activity: {
  id: string;
  type: 'play' | 'like' | 'download' | 'page_visit';
  track: { id: string; title: string; artist: string };
  timestamp: string | Date;
  source?: string;
  slug?: string;
}) {
  const timestampString =
    typeof activity.timestamp === 'string'
      ? activity.timestamp
      : activity.timestamp.toISOString();

  switch (activity.type) {
    case 'play':
      return {
        id: activity.id,
        type: 'play',
        message: `Track played: "${activity.track.title}" by ${activity.track.artist}`,
        timestamp: formatTimeAgo(new Date(timestampString)),
        icon: 'MusicalNoteIcon',
        color: 'text-blue-600',
      };
    case 'download':
      return {
        id: activity.id,
        type: 'download',
        message: `Track downloaded: "${activity.track.title}" by ${activity.track.artist}`,
        timestamp: formatTimeAgo(new Date(timestampString)),
        icon: 'ArrowDownTrayIcon',
        color: 'text-indigo-600',
      };
    case 'page_visit':
      return {
        id: activity.id,
        type: 'page_visit',
        message: `Quick link viewed for track "${activity.track.title}"`,
        timestamp: formatTimeAgo(new Date(timestampString)),
        icon: 'EyeIcon',
        color: 'text-pink-600',
      };
    case 'like':
      return {
        id: activity.id,
        type: 'like',
        message: `Track liked: "${activity.track.title}" by ${activity.track.artist}`,
        timestamp: formatTimeAgo(new Date(timestampString)),
        icon: 'HeartIcon',
        color: 'text-red-600',
      };
    default:
      return {
        id: activity.id,
        type: activity.type,
        message: activity.track.title,
        timestamp: formatTimeAgo(new Date(timestampString)),
        icon: 'ClockIcon',
        color: 'text-gray-500',
      };
  }
}
