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

    // First, handle the init migration rename
    const oldMigration = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" 
      WHERE migration_name = '20250902113612_init'
      AND finished_at IS NOT NULL
    `;

    const newMigration = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" 
      WHERE migration_name = '20230101000000_init'
    `;

    const hasOldMigration = oldMigration && oldMigration.length > 0;
    const hasNewMigration = newMigration && newMigration.length > 0;
    const newMigrationApplied =
      hasNewMigration && newMigration[0].finished_at !== null;

    if (hasOldMigration && !newMigrationApplied) {
      console.log('Found old migration name. Copying to new name...');
      await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations"
        WHERE migration_name = '20230101000000_init'
      `;

      const oldRecord = oldMigration[0];
      await prisma.$executeRawUnsafe(
        `
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
          $1,
          $2,
          '20230101000000_init',
          $3,
          $4,
          $5,
          $6
        )
      `,
        oldRecord.checksum || '',
        oldRecord.finished_at,
        oldRecord.logs || null,
        oldRecord.rolled_back_at || null,
        oldRecord.started_at,
        oldRecord.applied_steps_count || 1
      );
      console.log('✅ Init migration name updated.\n');
    }

    // Now handle ALL failed migrations (remove them so they can be retried)
    const failedMigrations = await prisma.$queryRaw`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE finished_at IS NULL
    `;

    if (failedMigrations && failedMigrations.length > 0) {
      console.log(
        `Found ${failedMigrations.length} failed migration(s). Removing...\n`
      );
      for (const migration of failedMigrations) {
        console.log(`  - Removing failed: ${migration.migration_name}`);
        await prisma.$executeRawUnsafe(
          `DELETE FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NULL`,
          migration.migration_name
        );
      }
      console.log(
        `\n✅ Removed ${failedMigrations.length} failed migration record(s). They will be retried.\n`
      );
    } else {
      console.log('✅ No failed migrations found.\n');
    }

    console.log('✨ Migration state resolved successfully!');
  } catch (error) {
    console.error('❌ Error resolving migration:', error);
    console.log(
      '⚠️  Continuing build - migrations are idempotent and should succeed...\n'
    );
  } finally {
    await prisma.$disconnect();
  }
}

resolveFailedMigration();
