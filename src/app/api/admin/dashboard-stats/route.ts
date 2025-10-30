import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
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

    // Format recent activity
    const formattedRecentActivity = [
      ...recentUsers.map((user, index) => ({
        id: `user-${user.id}`,
        type: 'user_registration',
        message: `New user registered: ${user.name || user.email}`,
        timestamp: formatTimeAgo(user.createdAt),
        icon: 'UserGroupIcon',
        color: 'text-blue-600',
      })),
      ...recentTracks.map((track, index) => ({
        id: `track-${track.id}`,
        type: 'track_upload',
        message: `New track uploaded: "${track.title}" by ${track.artist}`,
        timestamp: formatTimeAgo(track.createdAt),
        icon: 'MusicalNoteIcon',
        color: 'text-green-600',
      })),
      ...recentSubmissions.map((submission, index) => ({
        id: `submission-${submission.id}`,
        type: 'playlist_submission',
        message: `Track "${submission.track.title}" submitted to ${submission.playlist.name}`,
        timestamp: formatTimeAgo(submission.submittedAt),
        icon: 'ClockIcon',
        color: 'text-purple-600',
      })),
    ].slice(0, 10);

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
        priority: pendingSubmissions > 10 ? 'high' : pendingSubmissions > 5 ? 'medium' : 'low',
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

    const systemMetrics = {
      totalUsers,
      totalArtists,
      totalTracks,
      totalPlays: playEvents,
      totalRevenue: 0, // TODO: Implement revenue tracking
      platformHealth,
    };

    return NextResponse.json({
      success: true,
      data: {
        systemMetrics,
        recentActivity: formattedRecentActivity,
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
