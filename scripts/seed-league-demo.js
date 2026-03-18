/* eslint-disable no-console */
/**
 * Seed demo data for the PULSE³ League:
 * - Creates demo ArtistProfiles (no Users required)
 * - Creates PulseEligibilityScore rows with component scores
 *
 * Usage:
 *   dotenv -e .env.local -- node scripts/seed-league-demo.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildEligibilityComponents(targetScore) {
  // Roughly back-solve components around the target total score.
  // Weights: follower 30, engagement 40, consistency 20, platform 10.
  const platform = clamp(rand(50, 100), 0, 100);

  // Bias engagement a bit higher (strongest weight)
  let engagement = clamp(targetScore + rand(-8, 10), 0, 100);
  const follower = clamp(targetScore + rand(-12, 6), 0, 100);
  const consistency = clamp(targetScore + rand(-10, 8), 0, 100);

  // Adjust lightly so weighted total is close to target
  const total =
    follower * 0.3 + engagement * 0.4 + consistency * 0.2 + platform * 0.1;
  const delta = targetScore - total;
  engagement = clamp(engagement + delta * 1.2, 0, 100);

  const finalTotal =
    follower * 0.3 + engagement * 0.4 + consistency * 0.2 + platform * 0.1;

  return {
    followerScore: clamp(follower, 0, 100),
    engagementScore: clamp(engagement, 0, 100),
    consistencyScore: clamp(consistency, 0, 100),
    platformDiversityScore: clamp(platform, 0, 100),
    totalScore: clamp(finalTotal, 0, 100),
  };
}

async function main() {
  const premierCount = 20;
  const watchlistCount = 60;
  const total = premierCount + watchlistCount;

  console.log(
    '[League Demo] Seeding demo artist profiles + eligibility scores...'
  );

  // Ensure league tiers exist (and Top 20 is enforced)
  await prisma.leagueTier.upsert({
    where: { code: 'TIER1' },
    create: {
      code: 'TIER1',
      name: 'Top 20',
      targetSize: 20,
      minScore: 70,
      maxScore: null,
      refreshIntervalHours: 24,
      isActive: true,
      sortOrder: 1,
    },
    update: {
      name: 'Top 20',
      targetSize: 20,
    },
  });

  await prisma.leagueTier.upsert({
    where: { code: 'TIER2' },
    create: {
      code: 'TIER2',
      name: 'Watchlist',
      targetSize: 100,
      minScore: 50,
      maxScore: 70,
      refreshIntervalHours: 12,
      isActive: true,
      sortOrder: 2,
    },
    update: {},
  });

  // Create demo profiles
  const demoProfiles = [];

  for (let i = 1; i <= total; i++) {
    const isPremier = i <= premierCount;
    const artistName = isPremier
      ? `DEMO Premier Artist ${i}`
      : `DEMO Watchlist Artist ${i - premierCount}`;
    const slug = `demo-league-${slugify(artistName)}`;

    const profile = await prisma.artistProfile.upsert({
      where: { artistName },
      create: {
        artistName,
        slug,
        isPublic: true,
        isActive: true,
        // Optional: mark as demo via bio
        bio: 'DEMO: League artist used for visualising rankings and movement.',
      },
      update: {
        slug,
        bio: 'DEMO: League artist used for visualising rankings and movement.',
      },
      select: { id: true, artistName: true },
    });

    demoProfiles.push({ ...profile, isPremier });
  }

  // Create an eligibility score for each demo profile
  for (const p of demoProfiles) {
    const target = p.isPremier ? rand(72, 95) : rand(52, 69);
    const comps = buildEligibilityComponents(target);

    await prisma.pulseEligibilityScore.create({
      data: {
        artistProfileId: p.id,
        score: Math.round(comps.totalScore * 100) / 100,
        followerScore: comps.followerScore,
        engagementScore: comps.engagementScore,
        consistencyScore: comps.consistencyScore,
        platformDiversityScore: comps.platformDiversityScore,
        rank: null,
      },
    });
  }

  console.log(
    `[League Demo] Created/updated ${demoProfiles.length} demo artists.`
  );
  console.log('[League Demo] Done.');
}

main()
  .catch(err => {
    console.error('[League Demo] Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
