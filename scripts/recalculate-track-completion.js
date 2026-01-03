#!/usr/bin/env node
/* eslint-env node */

/**
 * Recalculate Track Completion for All Tracks
 *
 * Fixes existing tracks that have incorrect completion percentages
 * Uses the new dynamic calculation based on database rules
 */

/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const prisma = new PrismaClient();

// Import the calculation logic (simplified version)
function isFieldCompleted(field, value) {
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
        typeof value === 'string' && value.trim().length > 0 && value !== 'auto'
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
}

async function recalculateAllTracks() {
  try {
    console.log('🔄 Recalculating track completion for all tracks...\n');

    // Get active rules
    const rules = await prisma.trackCompletionRule.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { field: 'asc' }],
    });

    if (rules.length === 0) {
      console.error('❌ No active completion rules found!');
      process.exit(1);
    }

    console.log(`📊 Using ${rules.length} active rules\n`);

    // Get all tracks
    const tracks = await prisma.track.findMany({
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

    console.log(`Found ${tracks.length} tracks to process\n`);

    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    for (const track of tracks) {
      try {
        // Calculate completion
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

        const newPercentage =
          totalWeight > 0
            ? Math.round((totalCompleted / totalWeight) * 100)
            : 0;
        const oldPercentage = track.completionPercentage || 0;

        if (newPercentage !== oldPercentage) {
          await prisma.track.update({
            where: { id: track.id },
            data: { completionPercentage: newPercentage },
          });
          console.log(
            `✅ "${track.title}": ${oldPercentage}% → ${newPercentage}%`
          );
          updated++;
        } else {
          unchanged++;
        }
      } catch (error) {
        console.error(`❌ Error processing "${track.title}":`, error.message);
        errors++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('\n📊 Summary:');
    console.log(`   Total tracks: ${tracks.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Unchanged: ${unchanged}`);
    console.log(`   Errors: ${errors}`);
    console.log('\n✅ Recalculation complete!');
  } catch (error) {
    console.error('\n❌ Error during recalculation:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

recalculateAllTracks();
