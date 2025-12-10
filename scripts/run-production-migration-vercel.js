#!/usr/bin/env node

/**
 * Script to run Prisma migrations on production database
 * Uses DATABASE_URL from environment or prompts for it
 *
 * Usage:
 *   DATABASE_URL='your-production-url' node scripts/run-production-migration-vercel.js
 *   OR
 *   node scripts/run-production-migration-vercel.js (will prompt for URL)
 */

const { execSync } = require('child_process');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set.');
  console.log('\nTo get your production DATABASE_URL:');
  console.log(
    '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables'
  );
  console.log('2. Find DATABASE_URL for Production environment');
  console.log('3. Copy the value');
  console.log('\nThen run:');
  console.log(
    '  DATABASE_URL="your-production-database-url" node scripts/run-production-migration-vercel.js'
  );
  console.log('\nOr set it in your shell:');
  console.log('  export DATABASE_URL="your-production-database-url"');
  console.log('  node scripts/run-production-migration-vercel.js');
  process.exit(1);
}

// Mask the password in the URL for display
const maskedUrl = DATABASE_URL.replace(/:([^:@]+)@/, ':***@');
console.log('🔧 Running Prisma migrations on production database...');
console.log(`Database: ${maskedUrl}\n`);

try {
  // Set DATABASE_URL and run migrate deploy
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL,
    },
  });
  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}
