import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/artist-profile/analytics - Get profile analytics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artistProfile = await prisma.artistProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        tracks: {
          select: {
            id: true,
            title: true,
            playCount: true,
            likeCount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: 'Artist profile not found' },
        { status: 404 }
      );
    }

    // Calculate analytics
    const totalTracks = artistProfile.tracks.length;
    const totalPlays = artistProfile.tracks.reduce(
      (sum, track) => sum + track.playCount,
      0
    );
    const totalLikes = artistProfile.tracks.reduce(
      (sum, track) => sum + track.likeCount,
      0
    );

    // Recent tracks (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTracks = artistProfile.tracks.filter(
      track => track.createdAt >= thirtyDaysAgo
    );

    // Top performing tracks
    const topTracks = artistProfile.tracks
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5);

    // Monthly play count (last 12 months)
    const monthlyPlays = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // This is a simplified calculation - in a real app, you'd query play events
      const monthPlays = artistProfile.tracks.reduce((sum, track) => {
        if (track.createdAt >= monthStart && track.createdAt <= monthEnd) {
          return sum + track.playCount;
        }
        return sum;
      }, 0);

      monthlyPlays.push({
        month: date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        plays: monthPlays,
      });
    }

    const analytics = {
      profile: {
        totalPlays: artistProfile.totalPlays,
        totalLikes: artistProfile.totalLikes,
        totalFollowers: artistProfile.totalFollowers,
        profileViews: artistProfile.profileViews,
      },
      tracks: {
        totalTracks,
        totalPlays,
        totalLikes,
        recentTracks: recentTracks.length,
        topTracks,
      },
      monthlyPlays,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
