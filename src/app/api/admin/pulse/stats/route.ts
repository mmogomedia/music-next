import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pulse/stats
 * Get PULSE³ overview statistics
 * Requires ADMIN role
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total artists with eligibility scores
    const totalArtistsWithScores = await prisma.pulseEligibilityScore.groupBy({
      by: ['artistProfileId'],
    });

    // Get active tiers count
    const activeTiers = await prisma.leagueTier.count({
      where: { isActive: true },
    });

    // Get total league entries (from latest runs)
    const latestRuns = await prisma.leagueRun.findMany({
      select: { id: true },
      orderBy: { runAt: 'desc' },
      distinct: ['tierId'],
    });

    const totalLeagueEntries = await prisma.leagueEntry.count({
      where: {
        leagueRunId: {
          in: latestRuns.map(r => r.id),
        },
      },
    });

    // Get last eligibility recalculation
    const lastEligibilityRecalc =
      await prisma.pulseEligibilityRecalcLog.findFirst({
        orderBy: { startedAt: 'desc' },
        where: { status: 'completed' },
        select: { completedAt: true },
      });

    // Get last league run
    const lastLeagueRun = await prisma.pulseLeagueRunLog.findFirst({
      orderBy: { startedAt: 'desc' },
      where: { status: 'completed' },
      select: { completedAt: true },
    });

    // Get top 100 monitored count
    const top100Monitored = await prisma.pulseMonitoringStatus.count({
      where: { isActivelyMonitored: true },
    });

    // Get TikTok connections count
    const tiktokConnections = await prisma.account.count({
      where: {
        provider: 'tiktok',
        access_token: { not: null },
      },
    });

    return NextResponse.json({
      totalArtistsWithScores: totalArtistsWithScores.length,
      activeTiers,
      totalLeagueEntries,
      lastEligibilityRecalc:
        lastEligibilityRecalc?.completedAt?.toISOString() ?? null,
      lastLeagueRun: lastLeagueRun?.completedAt?.toISOString() ?? null,
      top100Monitored,
      tiktokConnections,
    });
  } catch (error: any) {
    console.error('Error fetching PULSE³ stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch PULSE³ statistics',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
