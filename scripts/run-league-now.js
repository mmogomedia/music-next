/* eslint-disable no-console */
/* global Map, Set */
/**
 * Run the league immediately (creates LeagueRun + LeagueEntry snapshots).
 * Respects tier ordering and prevents overlap between tiers.
 *
 * Usage:
 *   dotenv -e .env.local -- node scripts/run-league-now.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function bandStateFor(score, minScore, maxScore) {
  if (score < minScore) return 'BELOW_RANGE';
  if (maxScore !== null && score > maxScore) return 'ABOVE_RANGE';
  return 'SECURE';
}

async function getLatestEligibilityScores() {
  const groups = await prisma.pulseEligibilityScore.groupBy({
    by: ['artistProfileId'],
    _max: { calculatedAt: true },
  });

  const out = [];
  for (const g of groups) {
    if (!g._max.calculatedAt) continue;
    const row = await prisma.pulseEligibilityScore.findFirst({
      where: {
        artistProfileId: g.artistProfileId,
        calculatedAt: g._max.calculatedAt,
      },
      select: {
        artistProfileId: true,
        score: true,
        followerScore: true,
        engagementScore: true,
        consistencyScore: true,
      },
    });
    if (!row) continue;
    out.push({
      artistProfileId: row.artistProfileId,
      score: row.score,
      followerScore: row.followerScore ?? 0,
      engagementScore: row.engagementScore ?? 0,
      consistencyScore: row.consistencyScore ?? 0,
    });
  }
  return out;
}

async function getPreviousEntriesByArtist(tierId) {
  const prevRun = await prisma.leagueRun.findFirst({
    where: { tierId },
    orderBy: { runAt: 'desc' },
  });
  if (!prevRun) return new Map();

  const prevEntries = await prisma.leagueEntry.findMany({
    where: { leagueRunId: prevRun.id },
    select: { artistProfileId: true, rank: true },
  });
  const map = new Map();
  for (const e of prevEntries) map.set(e.artistProfileId, e.rank);
  return map;
}

async function runTier(tier, runType, excludeIds) {
  const excluded = new Set(excludeIds);
  const allScores = await getLatestEligibilityScores();
  const candidates = allScores.filter(s => !excluded.has(s.artistProfileId));

  candidates.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.engagementScore !== b.engagementScore)
      return b.engagementScore - a.engagementScore;
    if (a.consistencyScore !== b.consistencyScore)
      return b.consistencyScore - a.consistencyScore;
    if (a.followerScore !== b.followerScore)
      return b.followerScore - a.followerScore;
    return a.artistProfileId.localeCompare(b.artistProfileId);
  });

  const top = candidates.slice(0, tier.targetSize);
  const prevRankMap = await getPreviousEntriesByArtist(tier.id);

  const entries = top.map((s, idx) => {
    const rank = idx + 1;
    const previousRank = prevRankMap.get(s.artistProfileId) ?? null;
    const rankDelta = previousRank !== null ? previousRank - rank : null;
    const statusChange =
      previousRank === null
        ? 'NEW'
        : rank < previousRank
          ? 'UP'
          : rank > previousRank
            ? 'DOWN'
            : 'UNCHANGED';
    const bandState = bandStateFor(s.score, tier.minScore, tier.maxScore);
    return {
      artistProfileId: s.artistProfileId,
      rank,
      score: s.score,
      bandState,
      isAtRisk: bandState !== 'SECURE',
      previousRank,
      rankDelta,
      statusChange,
      highlight: rank <= 3,
    };
  });

  const result = await prisma.$transaction(async tx => {
    const run = await tx.leagueRun.create({
      data: { tierId: tier.id, runType, runAt: new Date() },
    });
    await tx.leagueEntry.createMany({
      data: entries.map(e => ({ ...e, leagueRunId: run.id })),
    });
    return {
      runId: run.id,
      entriesCreated: entries.length,
      pickedIds: top.map(t => t.artistProfileId),
    };
  });

  return result;
}

async function main() {
  const tiers = await prisma.leagueTier.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  if (!tiers.length) {
    console.log('[League Run Now] No active tiers found.');
    return;
  }

  const excludeIds = [];
  const results = [];

  for (const tier of tiers) {
    const res = await runTier(tier, 'MANUAL', excludeIds);
    excludeIds.push(...res.pickedIds);
    results.push({
      tier: tier.code,
      name: tier.name,
      runId: res.runId,
      entriesCreated: res.entriesCreated,
    });
  }

  console.log('[League Run Now] Completed:', results);
}

main()
  .catch(err => {
    console.error('[League Run Now] Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
