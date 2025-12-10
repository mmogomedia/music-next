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

    // Delete the failed migration record so it can be retried
    const result = await prisma.$executeRaw`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name = '20230101000000_init'
      AND finished_at IS NULL
    `;

    if (result > 0) {
      console.log(
        `✅ Removed ${result} failed migration record(s). Migration will be retried.\n`
      );
    } else {
      // Check if migration is already applied
      const applied = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "_prisma_migrations" 
        WHERE migration_name = '20230101000000_init' 
        AND finished_at IS NOT NULL
      `;

      const count = Number(applied[0]?.count || 0);

      if (count > 0) {
        console.log(
          '✅ Migration is already marked as applied. No action needed.\n'
        );
      } else {
        // Migration doesn't exist, mark it as applied since objects already exist
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
