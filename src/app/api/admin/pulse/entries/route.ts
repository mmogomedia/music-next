import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pulse/entries
 * Get league entries (optionally filtered by tier)
 * Requires ADMIN role
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tierCode = req.nextUrl.searchParams.get('tier');

    // Get latest runs for each tier
    const tiers = await prisma.leagueTier.findMany({
      where: tierCode ? { code: tierCode } : { isActive: true },
      select: { id: true, code: true, name: true },
    });

    const tierIds = tiers.map(t => t.id);
    const latestRuns = await prisma.leagueRun.findMany({
      where: { tierId: { in: tierIds } },
      orderBy: { runAt: 'desc' },
      distinct: ['tierId'],
      select: { id: true, tierId: true },
    });

    const runIds = latestRuns.map(r => r.id);
    const entries = await prisma.leagueEntry.findMany({
      where: { leagueRunId: { in: runIds } },
      include: {
        artistProfile: {
          select: { artistName: true, profileImage: true },
        },
        leagueRun: {
          include: {
            tier: {
              select: { code: true, name: true },
            },
          },
        },
      },
      orderBy: [{ leagueRun: { tier: { sortOrder: 'asc' } } }, { rank: 'asc' }],
    });

    const formattedEntries = entries.map(entry => ({
      id: entry.id,
      artistProfileId: entry.artistProfileId,
      artistName: entry.artistProfile.artistName,
      profileImage: entry.artistProfile.profileImage,
      rank: entry.rank,
      score: entry.score,
      bandState: entry.bandState,
      statusChange: entry.statusChange,
      tierCode: entry.leagueRun.tier.code,
      tierName: entry.leagueRun.tier.name,
    }));

    return NextResponse.json({ entries: formattedEntries });
  } catch (error: any) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch entries',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
