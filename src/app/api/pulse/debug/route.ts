import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PulseLeagueService } from '@/lib/services/pulse-league-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pulse/debug
 * Diagnostic endpoint to verify eligibility scores and league status
 * Requires authentication
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get artist profile for current user
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, artistName: true },
    });

    if (!artistProfile) {
      return NextResponse.json({
        error: 'No artist profile found',
        hasProfile: false,
      });
    }

    // 1. Check if eligibility score exists
    const latestScore = await prisma.pulseEligibilityScore.findFirst({
      where: { artistProfileId: artistProfile.id },
      orderBy: { calculatedAt: 'desc' },
      select: {
        score: true,
        calculatedAt: true,
        rank: true,
        followerScore: true,
        engagementScore: true,
        consistencyScore: true,
        platformDiversityScore: true,
      },
    });

    // 2. Check all eligibility scores in DB
    const allScoresCount = await prisma.pulseEligibilityScore.groupBy({
      by: ['artistProfileId'],
      _max: {
        calculatedAt: true,
      },
    });

    // 3. Get what getLatestEligibilityScores() would return
    // (This is what league run uses)
    const latestScoresForLeague = await prisma.pulseEligibilityScore.groupBy({
      by: ['artistProfileId'],
      _max: {
        calculatedAt: true,
      },
    });

    const leagueScores: Array<{
      artistProfileId: string;
      score: number;
      calculatedAt: Date;
    }> = [];

    for (const group of latestScoresForLeague) {
      if (!group._max.calculatedAt) continue;

      const scoreRecord = await prisma.pulseEligibilityScore.findFirst({
        where: {
          artistProfileId: group.artistProfileId,
          calculatedAt: group._max.calculatedAt,
        },
        select: {
          artistProfileId: true,
          score: true,
          calculatedAt: true,
        },
      });

      if (scoreRecord) {
        leagueScores.push({
          artistProfileId: scoreRecord.artistProfileId,
          score: scoreRecord.score,
          calculatedAt: scoreRecord.calculatedAt,
        });
      }
    }

    // Sort by score DESC (same as league run)
    leagueScores.sort((a, b) => b.score - a.score);

    // 4. Check league tiers
    const tiers = await PulseLeagueService.getActiveTiers();
    const tier1 = tiers.find(t => t.code === 'TIER1');
    const tier2 = tiers.find(t => t.code === 'TIER2');

    // 5. Check latest league runs
    const latestTier1Run = tier1
      ? await prisma.leagueRun.findFirst({
          where: { tierId: tier1.id },
          orderBy: { runAt: 'desc' },
          select: {
            id: true,
            runAt: true,
            runType: true,
          },
        })
      : null;

    const latestTier2Run = tier2
      ? await prisma.leagueRun.findFirst({
          where: { tierId: tier2.id },
          orderBy: { runAt: 'desc' },
          select: {
            id: true,
            runAt: true,
            runType: true,
          },
        })
      : null;

    // 6. Check if user is in league entries
    const tier1Entry =
      tier1 && latestTier1Run
        ? await prisma.leagueEntry.findFirst({
            where: {
              leagueRunId: latestTier1Run.id,
              artistProfileId: artistProfile.id,
            },
            select: {
              rank: true,
              score: true,
              bandState: true,
              statusChange: true,
            },
          })
        : null;

    const tier2Entry =
      tier2 && latestTier2Run
        ? await prisma.leagueEntry.findFirst({
            where: {
              leagueRunId: latestTier2Run.id,
              artistProfileId: artistProfile.id,
            },
            select: {
              rank: true,
              score: true,
              bandState: true,
              statusChange: true,
            },
          })
        : null;

    // 7. Calculate where user would rank
    const userRank = latestScore
      ? leagueScores.findIndex(s => s.artistProfileId === artistProfile.id) + 1
      : null;

    // 8. Check if user would be in TIER2 (top 100 with score 50-70)
    const wouldBeInTier2 =
      latestScore &&
      tier2 &&
      latestScore.score >= tier2.minScore &&
      (tier2.maxScore === null || latestScore.score <= tier2.maxScore) &&
      userRank !== null &&
      userRank <= tier2.targetSize;

    return NextResponse.json({
      artistProfile: {
        id: artistProfile.id,
        name: artistProfile.artistName,
      },
      eligibilityScore: latestScore
        ? {
            score: latestScore.score,
            calculatedAt: latestScore.calculatedAt,
            rank: latestScore.rank,
            components: {
              followerScore: latestScore.followerScore,
              engagementScore: latestScore.engagementScore,
              consistencyScore: latestScore.consistencyScore,
              platformDiversityScore: latestScore.platformDiversityScore,
            },
          }
        : null,
      leagueStatus: {
        totalArtistsWithScores: allScoresCount.length,
        userRankInAllScores: userRank,
        wouldBeInTier2,
        tier1: tier1
          ? {
              code: tier1.code,
              name: tier1.name,
              minScore: tier1.minScore,
              maxScore: tier1.maxScore,
              targetSize: tier1.targetSize,
              latestRun: latestTier1Run
                ? {
                    id: latestTier1Run.id,
                    runAt: latestTier1Run.runAt,
                    runType: latestTier1Run.runType,
                  }
                : null,
              userEntry: tier1Entry,
            }
          : null,
        tier2: tier2
          ? {
              code: tier2.code,
              name: tier2.name,
              minScore: tier2.minScore,
              maxScore: tier2.maxScore,
              targetSize: tier2.targetSize,
              latestRun: latestTier2Run
                ? {
                    id: latestTier2Run.id,
                    runAt: latestTier2Run.runAt,
                    runType: latestTier2Run.runType,
                  }
                : null,
              userEntry: tier2Entry,
            }
          : null,
      },
      topScores: leagueScores.slice(0, 10).map((s, idx) => ({
        rank: idx + 1,
        artistProfileId: s.artistProfileId,
        score: s.score,
        isCurrentUser: s.artistProfileId === artistProfile.id,
      })),
    });
  } catch (error: any) {
    console.error('Error in pulse debug endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch debug information',
        message: error?.message || String(error),
        stack:
          process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
