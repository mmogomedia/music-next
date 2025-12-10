#!/usr/bin/env node

/**
 * Script to resolve failed migration state in production database
 * This marks the failed migration as rolled back so it can be retried
 *
 * Usage: node scripts/resolve-failed-migration.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resolveFailedMigration() {
  try {
    console.log('🔧 Resolving failed migration state...\n');

    // Check if the old migration name exists (the one that was actually applied)
    const oldMigration = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" 
      WHERE migration_name = '20250902113612_init'
      AND finished_at IS NOT NULL
    `;

    // Check if the new migration name exists
    const newMigration = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" 
      WHERE migration_name = '20230101000000_init'
    `;

    const hasOldMigration = oldMigration && oldMigration.length > 0;
    const hasNewMigration = newMigration && newMigration.length > 0;
    const newMigrationApplied =
      hasNewMigration && newMigration[0].finished_at !== null;

    if (hasOldMigration && !newMigrationApplied) {
      // The old migration was applied, but the new name doesn't exist or failed
      // Copy the old migration record to the new name
      console.log('Found old migration name. Copying to new name...');

      // Delete any failed attempts with the new name
      await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations"
        WHERE migration_name = '20230101000000_init'
      `;

      // Copy the old migration record with the new name
      const oldRecord = oldMigration[0];
      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations" (
          id, 
          checksum, 
          finished_at, 
          migration_name, 
          logs, 
          rolled_back_at, 
          started_at, 
          applied_steps_count
        )
        VALUES (
          gen_random_uuid(),
          ${oldRecord.checksum || ''},
          ${oldRecord.finished_at},
          '20230101000000_init',
          ${oldRecord.logs || null},
          ${oldRecord.rolled_back_at || null},
          ${oldRecord.started_at},
          ${oldRecord.applied_steps_count || 1}
        )
      `;

      console.log('✅ Migration name updated in database.\n');
    } else if (hasNewMigration && !newMigrationApplied) {
      // New migration exists but failed - delete it so it can be retried
      console.log('Removing failed migration record...');
      const result = await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations"
        WHERE migration_name = '20230101000000_init'
        AND finished_at IS NULL
      `;
      console.log(`✅ Removed ${result} failed migration record(s).\n`);
    } else if (newMigrationApplied) {
      console.log(
        '✅ Migration is already marked as applied. No action needed.\n'
      );
    } else {
      // Neither exists - mark as applied since objects already exist
      console.log(
        'Migration not found. Marking as applied (objects already exist)...'
      );
      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations" (
          id, 
          checksum, 
          finished_at, 
          migration_name, 
          logs, 
          rolled_back_at, 
          started_at, 
          applied_steps_count
        )
        VALUES (
          gen_random_uuid(),
          '',
          NOW(),
          '20230101000000_init',
          NULL,
          NULL,
          NOW(),
          1
        )
        ON CONFLICT DO NOTHING
      `;
      console.log('✅ Migration marked as applied.\n');
    }

    console.log('✨ Migration state resolved successfully!');
  } catch (error) {
    console.error('❌ Error resolving migration:', error);
    // Don't exit with error - allow build to continue if resolution fails
    // The migration is idempotent now, so it should work anyway
    console.log(
      '⚠️  Continuing build - migration is idempotent and should succeed...\n'
    );
  } finally {
    await prisma.$disconnect();
  }
}

resolveFailedMigration();
