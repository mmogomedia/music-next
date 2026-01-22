import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PulseLeagueService } from '@/lib/services/pulse-league-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pulse/league
 * Public endpoint that returns current league state for all tiers
 * No authentication required
 */
export async function GET() {
  try {
    // Get all active tiers
    const activeTiers = await PulseLeagueService.getActiveTiers();

    const tiersData = [];

    for (const tier of activeTiers) {
      // Get latest + previous run (for comparisons)
      const recentRuns = await prisma.leagueRun.findMany({
        where: { tierId: tier.id },
        orderBy: { runAt: 'desc' },
        take: 2,
        select: { id: true, runAt: true },
      });
      const latestRun = recentRuns[0] ?? null;
      const previousRun = recentRuns[1] ?? null;
      if (!latestRun) {
        // Tier exists but has no runs yet
        tiersData.push({
          code: tier.code,
          name: tier.name,
          run_at: null,
          previous_run_at: null,
          entries: [],
        });
        continue;
      }

      const entries = await prisma.leagueEntry.findMany({
        where: { leagueRunId: latestRun.id },
        orderBy: { rank: 'asc' },
        include: {
          artistProfile: {
            select: {
              id: true,
              artistName: true,
              slug: true,
              profileImage: true,
            },
          },
        },
      });

      const artistProfileIds = entries.map(e => e.artistProfileId);
      // Previous run entry snapshot (rank/score)
      const previousEntries = previousRun?.id
        ? await prisma.leagueEntry.findMany({
            where: { leagueRunId: previousRun.id },
            select: {
              artistProfileId: true,
              rank: true,
              score: true,
            },
          })
        : [];

      const previousEntryByArtist = new Map(
        previousEntries.map(e => [e.artistProfileId, e])
      );

      // Fetch eligibility scores *as of run timestamps* (for score/subscore comparisons)
      // Also fetch latest scores as fallback if run-time scores don't have subscores
      const eligibilityAtRuns = await Promise.all(
        artistProfileIds.map(async artistId => {
          const [currentAtRun, previousAtRun, latestScore] = await Promise.all([
            prisma.pulseEligibilityScore.findFirst({
              where: {
                artistProfileId: artistId,
                calculatedAt: { lte: latestRun.runAt },
              },
              orderBy: { calculatedAt: 'desc' },
              select: {
                score: true,
                followerScore: true,
                engagementScore: true,
                consistencyScore: true,
                platformDiversityScore: true,
                calculatedAt: true,
              },
            }),
            previousRun
              ? prisma.pulseEligibilityScore.findFirst({
                  where: {
                    artistProfileId: artistId,
                    calculatedAt: { lte: previousRun.runAt },
                  },
                  orderBy: { calculatedAt: 'desc' },
                  select: {
                    score: true,
                    followerScore: true,
                    engagementScore: true,
                    consistencyScore: true,
                    platformDiversityScore: true,
                    calculatedAt: true,
                  },
                })
              : Promise.resolve(null),
            // Fallback: get latest score with subscores if run-time score doesn't have them
            prisma.pulseEligibilityScore.findFirst({
              where: {
                artistProfileId: artistId,
              },
              orderBy: { calculatedAt: 'desc' },
              select: {
                score: true,
                followerScore: true,
                engagementScore: true,
                consistencyScore: true,
                platformDiversityScore: true,
                calculatedAt: true,
              },
            }),
          ]);

          // Use run-time score, but fallback to latest if subscores are missing
          const current = currentAtRun
            ? {
                ...currentAtRun,
                followerScore:
                  currentAtRun.followerScore ??
                  latestScore?.followerScore ??
                  null,
                engagementScore:
                  currentAtRun.engagementScore ??
                  latestScore?.engagementScore ??
                  null,
                consistencyScore:
                  currentAtRun.consistencyScore ??
                  latestScore?.consistencyScore ??
                  null,
                platformDiversityScore:
                  currentAtRun.platformDiversityScore ??
                  latestScore?.platformDiversityScore ??
                  null,
              }
            : latestScore;

          const prev = previousAtRun ?? null;

          const curScore = current?.score ?? null;
          const prevScore = prev?.score ?? null;

          const curFollower = current?.followerScore ?? null;
          const prevFollower = prev?.followerScore ?? null;

          const curEngagement = current?.engagementScore ?? null;
          const prevEngagement = prev?.engagementScore ?? null;

          const curConsistency = current?.consistencyScore ?? null;
          const prevConsistency = prev?.consistencyScore ?? null;

          const curPresence = current?.platformDiversityScore ?? null;
          const prevPresence = prev?.platformDiversityScore ?? null;

          const delta = (a: number | null, b: number | null) => {
            if (a == null || b == null) return null;
            const d = a - b;
            return d === 0 ? null : d;
          };

          return [
            artistId,
            {
              // Current run snapshot scores (as-of run timestamp)
              run_score: curScore,
              run_followerScore: curFollower,
              run_engagementScore: curEngagement,
              run_consistencyScore: curConsistency,
              run_platformDiversityScore: curPresence,
              run_calculatedAt: current?.calculatedAt?.toISOString?.() ?? null,

              // Previous run snapshot scores (as-of previous run timestamp)
              previous_run_score: prevScore,
              previous_run_followerScore: prevFollower,
              previous_run_engagementScore: prevEngagement,
              previous_run_consistencyScore: prevConsistency,
              previous_run_platformDiversityScore: prevPresence,
              previous_run_calculatedAt:
                prev?.calculatedAt?.toISOString?.() ?? null,

              // Deltas (current run - previous run)
              scoreDelta: delta(curScore, prevScore),
              followerScoreDelta: delta(curFollower, prevFollower),
              engagementScoreDelta: delta(curEngagement, prevEngagement),
              consistencyScoreDelta: delta(curConsistency, prevConsistency),
              platformDiversityScoreDelta: delta(curPresence, prevPresence),
            },
          ] as const;
        })
      );

      const scoresByArtist = new Map(eligibilityAtRuns);

      tiersData.push({
        code: tier.code,
        name: tier.name,
        run_at: latestRun.runAt.toISOString(),
        previous_run_at: previousRun ? previousRun.runAt.toISOString() : null,
        entries: entries.map(entry => ({
          ...scoresByArtist.get(entry.artistProfileId),
          artist_id: entry.artistProfileId,
          artist_name: entry.artistProfile.artistName,
          artist_slug: entry.artistProfile.slug,
          artist_image: entry.artistProfile.profileImage,
          rank: entry.rank,
          score: entry.score,
          band_state: entry.bandState,
          is_at_risk: entry.isAtRisk,
          previous_rank: entry.previousRank,
          rank_delta: entry.rankDelta,
          status_change: entry.statusChange,
          highlight: entry.highlight,
          previous_run_rank:
            previousEntryByArtist.get(entry.artistProfileId)?.rank ?? null,
          previous_run_entry_score:
            previousEntryByArtist.get(entry.artistProfileId)?.score ?? null,
        })),
      });
    }

    return NextResponse.json({
      tiers: tiersData,
    });
  } catch (error) {
    console.error('[League API] Error fetching league data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league data' },
      { status: 500 }
    );
  }
}
