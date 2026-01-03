#!/usr/bin/env node
/* eslint-env node */

/**
 * Test Gamification System
 *
 * Tests that completion calculation, saving, and retrieval work correctly
 */

/* eslint-disable no-console */

const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const prisma = new PrismaClient();

// Test data - a track with various completion levels
const testTracks = [
  {
    name: 'Minimal Track',
    data: {
      title: 'Test Track',
      primaryArtistIds: ['test-artist-1'],
      description: null,
      lyrics: null,
      albumArtwork: null,
    },
    expectedMin: 20, // At least title + primaryArtistIds (20%)
    expectedMax: 25, // Could be slightly more if other fields are set
  },
  {
    name: 'Complete Track',
    data: {
      title: 'Complete Test Track',
      primaryArtistIds: ['test-artist-1', 'test-artist-2'],
      featuredArtistIds: ['test-artist-3'],
      description: 'A complete track description',
      lyrics: 'These are the lyrics to the song',
      album: 'Test Album',
      genreId: 'test-genre-1',
      albumArtwork: 'https://example.com/artwork.jpg',
      year: 2024,
      releaseDate: '2024-01-01',
      bpm: 120,
      language: 'en',
      copyrightInfo: 'Copyright 2024',
      licenseType: 'Creative Commons BY',
      distributionRights: 'Worldwide',
    },
    expectedMin: 90, // Should be very high
  },
];

async function testGamification() {
  console.log('🧪 Testing Gamification System\n');
  console.log('='.repeat(60));

  try {
    // 1. Check if rules exist
    console.log('\n1️⃣ Checking completion rules...');
    const rules = await prisma.trackCompletionRule.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { field: 'asc' }],
    });

    if (rules.length === 0) {
      console.error('❌ No active completion rules found!');
      console.log('   Run: npx tsx prisma/seed-completion-rules.ts');
      process.exit(1);
    }

    const totalWeight = rules.reduce((sum, r) => sum + r.weight, 0);
    console.log(`   ✅ Found ${rules.length} active rules`);
    console.log(`   ✅ Total weight: ${totalWeight}%`);

    if (totalWeight !== 100) {
      console.error(
        `   ⚠️  Warning: Total weight should be 100%, got ${totalWeight}%`
      );
    }

    // 2. Test calculation logic
    console.log('\n2️⃣ Testing completion calculation...');

    // Simulate the calculation logic
    const isFieldCompleted = (field, value) => {
      if (value === null || value === undefined) return false;

      switch (field) {
        case 'title':
        case 'description':
        case 'lyrics':
        case 'copyrightInfo':
        case 'distributionRights':
        case 'composer':
        case 'album':
        case 'isrc':
        case 'language':
          return (
            typeof value === 'string' &&
            value.trim().length > 0 &&
            value !== 'auto'
          );

        case 'primaryArtistIds':
        case 'featuredArtistIds':
          return Array.isArray(value) && value.length > 0;

        case 'genreId':
          return typeof value === 'string' && value.length > 0;

        case 'albumArtwork':
          return typeof value === 'string' && value.length > 0;

        case 'year':
          return (
            typeof value === 'number' &&
            value > 1900 &&
            value <= new Date().getFullYear() + 1
          );

        case 'releaseDate':
          if (value instanceof Date) return true;
          if (typeof value === 'string') {
            const date = new Date(value);
            return !isNaN(date.getTime());
          }
          return false;

        case 'bpm':
          return typeof value === 'number' && value > 0 && value <= 300;

        case 'licenseType':
          return (
            typeof value === 'string' &&
            value.length > 0 &&
            value !== 'All Rights Reserved'
          );

        default:
          return false;
      }
    };

    for (const testTrack of testTracks) {
      let totalCompleted = 0;
      let totalWeight = 0;

      for (const rule of rules) {
        const value = testTrack.data[rule.field];
        const completed = isFieldCompleted(rule.field, value);
        totalWeight += rule.weight;
        if (completed) {
          totalCompleted += rule.weight;
        }
      }

      const percentage =
        totalWeight > 0 ? Math.round((totalCompleted / totalWeight) * 100) : 0;

      console.log(`\n   Testing: ${testTrack.name}`);
      console.log(`   Calculated: ${percentage}%`);

      if (testTrack.expectedMin && percentage < testTrack.expectedMin) {
        console.error(
          `   ❌ Expected at least ${testTrack.expectedMin}%, got ${percentage}%`
        );
      } else if (testTrack.expectedMax && percentage > testTrack.expectedMax) {
        console.error(
          `   ❌ Expected at most ${testTrack.expectedMax}%, got ${percentage}%`
        );
      } else {
        console.log(`   ✅ Completion calculation correct`);
      }
    }

    // 3. Check actual tracks in database
    console.log('\n3️⃣ Checking saved tracks...');
    const tracks = await prisma.track.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        completionPercentage: true,
        primaryArtistIds: true,
        featuredArtistIds: true,
        album: true,
        genreId: true,
        composer: true,
        year: true,
        releaseDate: true,
        bpm: true,
        isrc: true,
        description: true,
        lyrics: true,
        language: true,
        albumArtwork: true,
        copyrightInfo: true,
        licenseType: true,
        distributionRights: true,
      },
    });

    console.log(`   Found ${tracks.length} recent tracks`);

    for (const track of tracks) {
      console.log(`\n   Track: "${track.title}"`);
      console.log(`   Saved completion: ${track.completionPercentage}%`);

      // Recalculate to verify
      let totalCompleted = 0;
      let totalWeight = 0;

      for (const rule of rules) {
        const value = track[rule.field];
        const completed = isFieldCompleted(rule.field, value);
        totalWeight += rule.weight;
        if (completed) {
          totalCompleted += rule.weight;
        }
      }

      const recalculated =
        totalWeight > 0 ? Math.round((totalCompleted / totalWeight) * 100) : 0;
      console.log(`   Recalculated: ${recalculated}%`);

      if (Math.abs(track.completionPercentage - recalculated) > 1) {
        console.error(`   ❌ MISMATCH! Saved value doesn't match calculation`);
        console.error(
          `      Difference: ${Math.abs(track.completionPercentage - recalculated)}%`
        );
      } else {
        console.log(`   ✅ Values match`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('\n✅ Gamification system audit complete!');
  } catch (error) {
    console.error('\n❌ Error during audit:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testGamification();
