#!/usr/bin/env node
/* eslint-env node */

/**
 * Check League Status in Production Database
 *
 * This script checks the current state of league runs and entries in production.
 *
 * Usage:
 *   DATABASE_URL_PROD="postgresql://..." node scripts/check-league-status-prod.js
 */

/* eslint-disable no-console */

const { PrismaClient } = require('@prisma/client');

const DATABASE_URL_PROD = process.env.DATABASE_URL_PROD;

if (!DATABASE_URL_PROD) {
  console.error(
    '\n❌ Error: DATABASE_URL_PROD environment variable is not set.'
  );
  console.log('\nTo get your production DATABASE_URL:');
  console.log(
    '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables'
  );
  console.log('2. Find DATABASE_URL for Production environment');
  console.log('3. Copy the value');
  console.log('\nThen run:');
  console.log(
    '  DATABASE_URL_PROD="your-production-url" node scripts/check-league-status-prod.js'
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL_PROD,
    },
  },
});

async function main() {
  console.log('\n🔍 Checking League Status in Production Database\n');
  console.log(`Database: ${DATABASE_URL_PROD.replace(/:([^:]*@)/, ':***@')}\n`);

  try {
    console.log('🔌 Connecting to production database...');
    await prisma.$connect();
    console.log('✅ Connected\n');

    // 1. Get all tiers
    console.log('📊 Fetching league tiers...');
    const tiers = await prisma.leagueTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    console.log(`Found ${tiers.length} active tier(s)\n`);

    // 2. For each tier, get latest run and entries
    for (const tier of tiers) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Tier: ${tier.name} (${tier.code})`);
      console.log(`  Target Size: ${tier.targetSize}`);
      console.log(`  Score Range: ${tier.minScore} - ${tier.maxScore ?? '∞'}`);
      console.log(`  Refresh Interval: ${tier.refreshIntervalHours} hours`);
      console.log(`${'='.repeat(60)}`);

      // Get latest run
      const latestRun = await prisma.leagueRun.findFirst({
        where: { tierId: tier.id },
        orderBy: { runAt: 'desc' },
        include: {
          _count: {
            select: { entries: true },
          },
        },
      });

      if (!latestRun) {
        console.log('  ❌ No runs found for this tier');
        continue;
      }

      const now = new Date();
      const hoursSinceLastRun =
        (now.getTime() - latestRun.runAt.getTime()) / (1000 * 60 * 60);
      const shouldRefresh = hoursSinceLastRun >= tier.refreshIntervalHours;

      console.log(`\n  Latest Run:`);
      console.log(`    ID: ${latestRun.id}`);
      console.log(`    Run At: ${latestRun.runAt.toISOString()}`);
      console.log(`    Run Type: ${latestRun.runType}`);
      console.log(`    Entries: ${latestRun._count.entries}`);
      console.log(`    Hours Since: ${hoursSinceLastRun.toFixed(2)}`);
      console.log(
        `    Should Refresh: ${shouldRefresh ? '✅ YES' : '❌ NO'} (needs ${tier.refreshIntervalHours}h, has ${hoursSinceLastRun.toFixed(2)}h)`
      );

      // Get top 5 entries
      const topEntries = await prisma.leagueEntry.findMany({
        where: { leagueRunId: latestRun.id },
        orderBy: { rank: 'asc' },
        take: 5,
        include: {
          artistProfile: {
            select: {
              artistName: true,
            },
          },
        },
      });

      if (topEntries.length > 0) {
        console.log(`\n  Top 5 Entries:`);
        topEntries.forEach(entry => {
          console.log(
            `    ${entry.rank}. ${entry.artistProfile.artistName} - Score: ${entry.score.toFixed(2)} (${entry.statusChange})`
          );
        });
      }
    }

    // 3. Get latest overall run log
    console.log(`\n${'='.repeat(60)}`);
    console.log('Latest Overall Run Log');
    console.log(`${'='.repeat(60)}`);

    const latestLog = await prisma.pulseLeagueRunLog.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    if (latestLog) {
      console.log(`  ID: ${latestLog.id}`);
      console.log(`  Started: ${latestLog.startedAt.toISOString()}`);
      console.log(
        `  Completed: ${latestLog.completedAt?.toISOString() ?? 'N/A'}`
      );
      console.log(`  Status: ${latestLog.status}`);
      console.log(`  Tiers Processed: ${latestLog.tiersProcessed}`);
      console.log(`  Tiers Skipped: ${latestLog.tiersSkipped}`);
      console.log(`  Tiers Errored: ${latestLog.tiersErrored}`);
      console.log(`  Entries Created: ${latestLog.entriesCreated}`);
      console.log(`  Duration: ${latestLog.totalDurationMs}ms`);
      if (latestLog.errorMessage) {
        console.log(`  Error: ${latestLog.errorMessage}`);
      }
    } else {
      console.log('  ❌ No run logs found');
    }

    console.log('\n✅ Check complete!\n');
  } catch (error) {
    console.error('\n❌ Error checking league status:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
