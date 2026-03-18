import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PulseLeagueService } from '@/lib/services/pulse-league-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pulse/monitoring
 * Get top 100 monitored artists
 * Requires ADMIN role
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get monitored artists
    const monitored = await prisma.pulseMonitoringStatus.findMany({
      where: { isActivelyMonitored: true },
      include: {
        artistProfile: {
          select: { artistName: true, profileImage: true },
        },
      },
    });

    // Get latest scores
    const latestScores = await PulseLeagueService.getLatestEligibilityScores();
    const scoreMap = new Map(
      latestScores.map(s => [s.artistProfileId, s.score])
    );

    // Get score calculation dates
    const scoreDates = await prisma.pulseEligibilityScore.findMany({
      where: {
        artistProfileId: { in: monitored.map(m => m.artistProfileId) },
      },
      select: {
        artistProfileId: true,
        calculatedAt: true,
      },
      orderBy: { calculatedAt: 'desc' },
      distinct: ['artistProfileId'],
    });

    const dateMap = new Map(
      scoreDates.map(s => [s.artistProfileId, s.calculatedAt.toISOString()])
    );

    // Combine and sort
    const artists = monitored
      .map(m => ({
        artistProfileId: m.artistProfileId,
        artistName: m.artistProfile.artistName,
        profileImage: m.artistProfile.profileImage,
        score: scoreMap.get(m.artistProfileId) ?? 0,
        isActivelyMonitored: m.isActivelyMonitored,
        lastScoreUpdate:
          dateMap.get(m.artistProfileId) ?? new Date().toISOString(),
      }))
      .sort((a, b) => b.score - a.score)
      .map((artist, index) => ({
        ...artist,
        rank: index + 1,
      }))
      .slice(0, 100);

    return NextResponse.json({ artists });
  } catch (error: any) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch monitoring data',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
