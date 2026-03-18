#!/usr/bin/env node

/**
 * Script to delete all momentum scores from the database
 * Momentum calculation is not yet implemented, so we're cleaning up any existing data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteMomentumScores() {
  try {
    console.log('🗑️  Deleting all momentum scores from database...\n');

    // Count existing records
    const count = await prisma.pulseMomentumScore.count();
    console.log(`Found ${count} momentum score record(s) to delete.`);

    if (count === 0) {
      console.log('✅ No momentum scores found. Database is already clean.');
      return;
    }

    // Delete all momentum scores
    const result = await prisma.pulseMomentumScore.deleteMany({});

    console.log(
      `\n✅ Successfully deleted ${result.count} momentum score record(s).`
    );
    console.log(
      '✨ Database cleaned up. Momentum calculation is not yet implemented.'
    );
  } catch (error) {
    console.error('\n❌ Error deleting momentum scores:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteMomentumScores();
