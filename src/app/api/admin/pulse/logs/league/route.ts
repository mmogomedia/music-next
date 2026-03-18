import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pulse/logs/league
 * Get league run logs with detailed tier information
 * Requires ADMIN role
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    const logs = await prisma.pulseLeagueRunLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        status: true,
        tiersProcessed: true,
        tiersSkipped: true,
        tiersErrored: true,
        entriesCreated: true,
        totalDurationMs: true,
        errorMessage: true,
        promotionsProcessed: true,
      },
    });

    // Get latest run info for each tier to show "last run" details
    const activeTiers = await prisma.leagueTier.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Get latest run for each tier
    const tierLastRuns = await Promise.all(
      activeTiers.map(async tier => {
        const latestRun = await prisma.leagueRun.findFirst({
          where: { tierId: tier.id },
          orderBy: { runAt: 'desc' },
          select: {
            id: true,
            runAt: true,
            runType: true,
            _count: {
              select: { entries: true },
            },
          },
        });

        return {
          tierCode: tier.code,
          tierName: tier.name,
          lastRun: latestRun
            ? {
                runAt: latestRun.runAt,
                runType: latestRun.runType,
                entriesCount: latestRun._count.entries,
              }
            : null,
        };
      })
    );

    // Enrich logs with additional calculated fields
    const enrichedLogs = logs.map(log => {
      const avgTimePerTier =
        log.tiersProcessed > 0 && log.totalDurationMs
          ? Math.round(log.totalDurationMs / log.tiersProcessed)
          : null;
      const successRate =
        log.tiersProcessed + log.tiersSkipped + log.tiersErrored > 0
          ? Math.round(
              (log.tiersProcessed /
                (log.tiersProcessed + log.tiersSkipped + log.tiersErrored)) *
                100
            )
          : null;

      return {
        ...log,
        avgTimePerTier,
        successRate,
        tierLastRuns, // Include tier last run info for all logs
      };
    });

    return NextResponse.json({
      logs: enrichedLogs,
      tierLastRuns, // Also return separately for easy access
    });
  } catch (error: any) {
    console.error('Error fetching league logs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch league logs',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
