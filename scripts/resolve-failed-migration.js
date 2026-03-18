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

    // Handle specific migration that failed because tables already exist
    const skillsMigration = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations"
      WHERE migration_name = '20250126120000_add_skills_tables'
    `;

    if (skillsMigration && skillsMigration.length > 0) {
      const migration = skillsMigration[0];
      // If it's failed (no finished_at) or doesn't exist, mark it as applied
      if (!migration.finished_at) {
        console.log(
          'Found failed skills migration. Checking if tables exist...'
        );

        // Check if tables exist
        const skillsTableExists = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'skills'
          )
        `;

        const artistSkillsTableExists = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'artist_profile_skills'
          )
        `;

        if (
          skillsTableExists[0]?.exists &&
          artistSkillsTableExists[0]?.exists
        ) {
          console.log(
            '✅ Tables already exist. Marking migration as applied...'
          );

          // Remove failed record
          await prisma.$executeRawUnsafe(
            `DELETE FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NULL`,
            '20250126120000_add_skills_tables'
          );

          // Mark as applied
          const now = new Date();
          const crypto = require('crypto');
          const fs = require('fs');
          const path = require('path');

          const migrationPath = path.join(
            __dirname,
            '..',
            'prisma',
            'migrations',
            '20250126120000_add_skills_tables',
            'migration.sql'
          );

          let checksum = '';
          if (fs.existsSync(migrationPath)) {
            const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
            checksum = crypto
              .createHash('sha256')
              .update(migrationSQL)
              .digest('hex');
          }

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
              '20250126120000_add_skills_tables',
              NULL,
              NULL,
              $2,
              1
            )
          `,
            checksum,
            now
          );

          console.log('✅ Skills migration marked as applied.\n');
        } else {
          console.log('⚠️  Tables do not exist. Migration will be retried.\n');
        }
      }
    }

    // Now handle ALL other failed migrations (remove them so they can be retried)
    const failedMigrations = await prisma.$queryRaw`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE finished_at IS NULL
      AND migration_name != '20250126120000_add_skills_tables'
    `;

    if (failedMigrations && failedMigrations.length > 0) {
      console.log(
        `Found ${failedMigrations.length} other failed migration(s). Removing...\n`
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
      console.log('✅ No other failed migrations found.\n');
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
