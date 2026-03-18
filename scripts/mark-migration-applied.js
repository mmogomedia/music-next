#!/usr/bin/env node

/**
 * Script to mark a migration as applied when tables already exist
 * This is safe - it only updates the migration tracking table, doesn't modify data
 *
 * Usage: node scripts/mark-migration-applied.js <migration_name>
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function markMigrationApplied(migrationName) {
  try {
    console.log(`🔧 Marking migration "${migrationName}" as applied...\n`);

    // Check if migration already marked as applied
    const existing = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations"
      WHERE migration_name = ${migrationName}
      AND finished_at IS NOT NULL
    `;

    if (existing && existing.length > 0) {
      console.log(
        `✅ Migration "${migrationName}" is already marked as applied.\n`
      );
      return;
    }

    // Calculate checksum from migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'prisma',
      'migrations',
      migrationName,
      'migration.sql'
    );

    let checksum = '';
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
      checksum = crypto.createHash('sha256').update(migrationSQL).digest('hex');
    }

    // Remove any failed record first
    await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NULL`,
      migrationName
    );

    // Mark as applied
    const now = new Date();
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
        $3,
        NULL,
        NULL,
        $2,
        1
      )
    `,
      checksum,
      now,
      migrationName
    );

    console.log(
      `✅ Migration "${migrationName}" marked as applied successfully!\n`
    );
    console.log(
      '💡 This is safe - no data was modified, only migration tracking was updated.\n'
    );
  } catch (error) {
    console.error('❌ Error marking migration as applied:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Error: Migration name is required');
  console.log(
    '\nUsage: node scripts/mark-migration-applied.js <migration_name>'
  );
  console.log(
    'Example: node scripts/mark-migration-applied.js 20250126120000_add_skills_tables'
  );
  process.exit(1);
}

markMigrationApplied(migrationName)
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
