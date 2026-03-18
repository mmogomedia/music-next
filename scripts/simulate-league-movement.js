/* eslint-disable no-console */
/**
 * Simulate league movement by creating NEW eligibility score rows for demo artists,
 * with slight random changes to score + component scores.
 *
 * This is meant to create visible rank deltas between league runs.
 *
 * Usage:
 *   dotenv -e .env.local -- node scripts/simulate-league-movement.js
 *
 * Optional env vars:
 *   DEMO_PREFIX=DEMO:
 *   STEP_MIN=-4
 *   STEP_MAX=6
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

async function main() {
  const prefix = process.env.DEMO_PREFIX || 'DEMO ';
  const stepMin = Number(process.env.STEP_MIN ?? -4);
  const stepMax = Number(process.env.STEP_MAX ?? 6);

  console.log('[League Sim] Finding demo artist profiles...');

  const demoArtists = await prisma.artistProfile.findMany({
    where: {
      artistName: { startsWith: prefix },
    },
    select: { id: true, artistName: true },
  });

  if (demoArtists.length === 0) {
    console.log(
      '[League Sim] No demo artists found. Run seed-league-demo.js first.'
    );
    return;
  }

  console.log(
    `[League Sim] Simulating score updates for ${demoArtists.length} demo artists...`
  );

  for (const artist of demoArtists) {
    const latest = await prisma.pulseEligibilityScore.findFirst({
      where: { artistProfileId: artist.id },
      orderBy: { calculatedAt: 'desc' },
      select: {
        score: true,
        followerScore: true,
        engagementScore: true,
        consistencyScore: true,
        platformDiversityScore: true,
      },
    });

    if (!latest) continue;

    // Apply random movement with a slight bias toward engagement changes
    const follower = clamp(
      (latest.followerScore ?? 0) + rand(stepMin, stepMax),
      0,
      100
    );
    const engagement = clamp(
      (latest.engagementScore ?? 0) + rand(stepMin - 1, stepMax + 2),
      0,
      100
    );
    const consistency = clamp(
      (latest.consistencyScore ?? 0) + rand(stepMin, stepMax),
      0,
      100
    );
    const platform = clamp(
      (latest.platformDiversityScore ?? 50) + rand(-1, 1),
      0,
      100
    );

    const newScore = clamp(
      follower * 0.3 + engagement * 0.4 + consistency * 0.2 + platform * 0.1,
      0,
      100
    );

    await prisma.pulseEligibilityScore.create({
      data: {
        artistProfileId: artist.id,
        score: Math.round(newScore * 100) / 100,
        followerScore: follower,
        engagementScore: engagement,
        consistencyScore: consistency,
        platformDiversityScore: platform,
        rank: null,
      },
    });
  }

  console.log(
    '[League Sim] Done. Now trigger a league run to see rank deltas.'
  );
  console.log(
    '[League Sim] Tip: call POST /api/pulse/league/run with your CRON_SECRET, then refresh /league.'
  );
}

main()
  .catch(err => {
    console.error('[League Sim] Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
