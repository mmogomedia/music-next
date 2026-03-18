#!/usr/bin/env node
/* eslint-env node */

/**
 * Seed Production Gamification Rules
 *
 * Seeds the production database with track completion rules
 *
 * Usage:
 *   DATABASE_URL_PROD="postgresql://..." node scripts/seed-prod-gamification.js
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
    '  DATABASE_URL_PROD="your-production-url" node scripts/seed-prod-gamification.js'
  );
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

const defaultRules = [
  // Required (20%)
  {
    field: 'title',
    label: 'Title',
    category: 'required',
    weight: 10,
    description: 'Track title',
    group: 'Basic Info',
    isRequired: true,
    isActive: true,
    order: 0,
  },
  {
    field: 'primaryArtistIds',
    label: 'Primary Artists',
    category: 'required',
    weight: 10,
    description: 'Main performing artists',
    group: 'Basic Info',
    isRequired: true,
    isActive: true,
    order: 1,
  },

  // High (40%)
  {
    field: 'lyrics',
    label: 'Lyrics',
    category: 'high',
    weight: 25,
    description: 'Song lyrics',
    group: 'Story & Content',
    isRequired: false,
    isActive: true,
    order: 10,
  },
  {
    field: 'description',
    label: 'Description',
    category: 'high',
    weight: 10,
    description: 'Track description',
    group: 'Story & Content',
    isRequired: false,
    isActive: true,
    order: 11,
  },
  {
    field: 'albumArtwork',
    label: 'Album Artwork',
    category: 'high',
    weight: 5,
    description: 'Cover image',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 2,
  },

  // Medium (35%)
  {
    field: 'album',
    label: 'Album',
    category: 'medium',
    weight: 5,
    description: 'Album name',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 3,
  },
  {
    field: 'genreId',
    label: 'Genre',
    category: 'medium',
    weight: 5,
    description: 'Music genre',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 4,
  },
  {
    field: 'language',
    label: 'Language',
    category: 'medium',
    weight: 5,
    description: 'Primary language of the track',
    group: 'Story & Content',
    isRequired: false,
    isActive: true,
    order: 12,
  },
  {
    field: 'featuredArtistIds',
    label: 'Featured Artists',
    category: 'medium',
    weight: 5,
    description: 'Featured or guest artists',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 5,
  },
  {
    field: 'composer',
    label: 'Composer',
    category: 'medium',
    weight: 3,
    description: 'Song composer',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 6,
  },
  {
    field: 'year',
    label: 'Year',
    category: 'medium',
    weight: 3,
    description: 'Release year',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 7,
  },
  {
    field: 'releaseDate',
    label: 'Release Date',
    category: 'medium',
    weight: 3,
    description: 'Specific release date',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 8,
  },
  {
    field: 'bpm',
    label: 'BPM',
    category: 'medium',
    weight: 3,
    description: 'Beats per minute',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 9,
  },
  {
    field: 'isrc',
    label: 'ISRC',
    category: 'medium',
    weight: 3,
    description: 'International Standard Recording Code',
    group: 'Basic Info',
    isRequired: false,
    isActive: true,
    order: 10,
  },

  // Low (5%)
  {
    field: 'copyrightInfo',
    label: 'Copyright Info',
    category: 'low',
    weight: 2,
    description: 'Copyright information',
    group: 'Legal',
    isRequired: false,
    isActive: true,
    order: 20,
  },
  {
    field: 'licenseType',
    label: 'License Type',
    category: 'low',
    weight: 1,
    description: 'License type (only counts if not default)',
    group: 'Legal',
    isRequired: false,
    isActive: true,
    order: 21,
  },
  {
    field: 'distributionRights',
    label: 'Distribution Rights',
    category: 'low',
    weight: 2,
    description: 'Distribution rights and restrictions',
    group: 'Legal',
    isRequired: false,
    isActive: true,
    order: 22,
  },
];

async function seedRules() {
  try {
    console.log(
      '🌱 Seeding track completion rules to production database...\n'
    );

    let created = 0;
    let updated = 0;

    for (const rule of defaultRules) {
      const existing = await prismaProd.trackCompletionRule.findUnique({
        where: { field: rule.field },
      });

      if (existing) {
        await prismaProd.trackCompletionRule.update({
          where: { field: rule.field },
          data: rule,
        });
        console.log(`↻ Updated: ${rule.field}`);
        updated++;
      } else {
        await prismaProd.trackCompletionRule.create({
          data: rule,
        });
        console.log(`✓ Created: ${rule.field}`);
        created++;
      }
    }

    // Calculate total weight
    const allRules = await prismaProd.trackCompletionRule.findMany({
      where: { isActive: true },
    });
    const totalWeight = allRules.reduce((sum, r) => sum + r.weight, 0);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`\n✅ Seeding complete!`);
    console.log(`   Created: ${created} rules`);
    console.log(`   Updated: ${updated} rules`);
    console.log(`   Total Active Rules: ${allRules.length}`);
    console.log(`   Total Weight: ${totalWeight}%`);

    if (totalWeight === 100) {
      console.log('   ✅ Weight total is correct (100%)');
    } else {
      console.log(
        `   ⚠️  Weight total is ${totalWeight === 100 ? 'correct' : 'incorrect'} (should be 100%)`
      );
    }
    console.log(`\n${'='.repeat(60)}`);
  } catch (error) {
    console.error('\n❌ Error seeding rules:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prismaProd.$disconnect();
  }
}

seedRules();
