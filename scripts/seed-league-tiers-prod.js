#!/usr/bin/env node
/* eslint-env node */

/**
 * Seed League Tiers in Production Database
 *
 * This script seeds TIER1 and TIER2 league tiers directly into the production database.
 *
 * Usage:
 *   DATABASE_URL_PROD="postgresql://..." node scripts/seed-league-tiers-prod.js
 *
 * Or set environment variable:
 *   export DATABASE_URL_PROD="postgresql://..."
 *   node scripts/seed-league-tiers-prod.js
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
    '  DATABASE_URL_PROD="your-production-url" node scripts/seed-league-tiers-prod.js'
  );
  console.log('\nOr set it in your shell:');
  console.log('  export DATABASE_URL_PROD="your-production-url"');
  console.log('  node scripts/seed-league-tiers-prod.js');
  process.exit(1);
}

// Create Prisma client for production database
const prismaProd = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL_PROD,
    },
  },
});

const defaultTiers = [
  {
    code: 'TIER1',
    name: 'Top 20',
    targetSize: 20,
    minScore: 70,
    maxScore: null,
    refreshIntervalHours: 24,
    isActive: true,
    sortOrder: 1,
  },
  {
    code: 'TIER2',
    name: 'Watchlist',
    targetSize: 100,
    minScore: 50,
    maxScore: 70,
    refreshIntervalHours: 12,
    isActive: true,
    sortOrder: 2,
  },
];

async function seedLeagueTiers() {
  try {
    console.log('\n🚀 Seeding League Tiers in Production Database\n');
    const maskedUrl = DATABASE_URL_PROD.replace(/:([^:@]+)@/, ':***@');
    console.log(`Database: ${maskedUrl}\n`);

    // Test connection
    console.log('🔌 Testing database connection...');
    await prismaProd.$connect();
    console.log('✅ Connected to production database\n');

    const results = [];

    for (const tierData of defaultTiers) {
      const existing = await prismaProd.leagueTier.findUnique({
        where: { code: tierData.code },
      });

      if (existing) {
        const updated = await prismaProd.leagueTier.update({
          where: { code: tierData.code },
          data: tierData,
        });
        results.push({
          code: tierData.code,
          action: 'updated',
          tier: updated,
        });
        console.log(`✅ Updated ${tierData.code} (${tierData.name})`);
      } else {
        const created = await prismaProd.leagueTier.create({
          data: tierData,
        });
        results.push({
          code: tierData.code,
          action: 'created',
          tier: created,
        });
        console.log(`✅ Created ${tierData.code} (${tierData.name})`);
      }
    }

    console.log('\n\n✨ Seeding Complete!\n');
    console.log(`📊 Summary:`);
    results.forEach(({ code, action }) => {
      console.log(`   ${code}: ${action}`);
    });

    console.log('\n✅ League tiers have been seeded in production database!');
    console.log('\n💡 Next steps:');
    console.log('   1. Trigger the league run: /api/pulse/league/run');
    console.log('   2. Check the debug endpoint: /api/pulse/debug');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prismaProd.$disconnect();
  }
}

seedLeagueTiers();
