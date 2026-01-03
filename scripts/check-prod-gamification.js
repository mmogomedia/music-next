#!/usr/bin/env node
/* eslint-env node */
/* global Set */

/**
 * Check Production Gamification Rules
 *
 * Queries the production database to check if track completion rules are set up
 *
 * Usage:
 *   DATABASE_URL_PROD="postgresql://..." node scripts/check-prod-gamification.js
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
    '  DATABASE_URL_PROD="your-production-url" node scripts/check-prod-gamification.js'
  );
  console.log('\nOr set it in your shell:');
  console.log('  export DATABASE_URL_PROD="your-production-url"');
  console.log('  node scripts/check-prod-gamification.js');
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

async function checkGamificationRules() {
  try {
    console.log(
      '🔍 Checking production database for track completion rules...\n'
    );

    // Check if table exists by querying rules
    const rules = await prismaProd.trackCompletionRule.findMany({
      orderBy: [{ order: 'asc' }, { field: 'asc' }],
    });

    if (rules.length === 0) {
      console.log('❌ No track completion rules found in production database.');
      console.log('\n💡 To set up rules, run:');
      console.log(
        '   DATABASE_URL_PROD="your-url" npx tsx prisma/seed-completion-rules.ts'
      );
      process.exit(1);
    }

    console.log(`✅ Found ${rules.length} track completion rules:\n`);

    // Calculate total weight
    const activeRules = rules.filter(r => r.isActive);
    const totalWeight = activeRules.reduce((sum, r) => sum + r.weight, 0);

    // Group by category
    const byCategory = {
      required: [],
      high: [],
      medium: [],
      low: [],
    };

    rules.forEach(rule => {
      if (byCategory[rule.category]) {
        byCategory[rule.category].push(rule);
      }
    });

    // Display rules by category
    Object.entries(byCategory).forEach(([category, categoryRules]) => {
      if (categoryRules.length > 0) {
        console.log(
          `\n📊 ${category.toUpperCase()} Priority (${categoryRules.length} rules):`
        );
        categoryRules.forEach(rule => {
          const status = rule.isActive ? '✅' : '❌';
          const required = rule.isRequired ? ' [REQUIRED]' : '';
          console.log(
            `  ${status} ${rule.field.padEnd(25)} | ${String(rule.weight).padStart(3)}% | ${rule.label}${required}`
          );
        });
      }
    });

    // Display summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('\n📈 Summary:');
    console.log(`   Total Rules: ${rules.length}`);
    console.log(`   Active Rules: ${activeRules.length}`);
    console.log(`   Total Weight: ${totalWeight}%`);

    if (totalWeight === 100) {
      console.log('   ✅ Weight total is correct (100%)');
    } else if (totalWeight < 100) {
      console.log(
        `   ⚠️  Weight total is ${100 - totalWeight}% below target (should be 100%)`
      );
    } else {
      console.log(
        `   ⚠️  Weight total is ${totalWeight - 100}% over target (should be 100%)`
      );
    }

    // Check for required fields
    const requiredFields = rules.filter(r => r.isRequired);
    console.log(`   Required Fields: ${requiredFields.length}`);
    if (requiredFields.length > 0) {
      console.log(
        `   Required Fields: ${requiredFields.map(r => r.field).join(', ')}`
      );
    }

    // Group summary
    const groups = [...new Set(rules.map(r => r.group || 'Other'))];
    console.log(`   Groups: ${groups.length} (${groups.join(', ')})`);

    console.log(`\n${'='.repeat(60)}`);

    if (totalWeight !== 100) {
      console.log(
        '\n⚠️  Warning: Total weight should equal 100% for proper completion calculation.'
      );
      process.exit(1);
    } else {
      console.log('\n✅ Gamification rules are properly configured!');
      process.exit(0);
    }
  } catch (error) {
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      console.error(
        '\n❌ Error: track_completion_rules table does not exist in production database.'
      );
      console.log(
        '\n💡 This means migrations have not been run on production.'
      );
      console.log('   Run migrations first:');
      console.log('   DATABASE_URL_PROD="your-url" npx prisma migrate deploy');
    } else {
      console.error('\n❌ Error checking gamification rules:', error.message);
      console.error(error);
    }
    process.exit(1);
  } finally {
    await prismaProd.$disconnect();
  }
}

checkGamificationRules();
