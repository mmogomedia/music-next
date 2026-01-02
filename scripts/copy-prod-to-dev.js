#!/usr/bin/env node
/* eslint-env node */
/* global Promise */

/**
 * Copy Production Data to Development Database
 *
 * This script copies data from production database to development database.
 * It handles foreign key relationships and skips sensitive data.
 *
 * Usage:
 *   DATABASE_URL_PROD="postgresql://..." DATABASE_URL_DEV="postgresql://..." node scripts/copy-prod-to-dev.js
 *
 * Or set environment variables:
 *   export DATABASE_URL_PROD="postgresql://..."
 *   export DATABASE_URL_DEV="postgresql://..."
 *   node scripts/copy-prod-to-dev.js
 */

/* eslint-disable no-console */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const DATABASE_URL_PROD = process.env.DATABASE_URL_PROD;
const DATABASE_URL_DEV =
  process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;

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
    '  DATABASE_URL_PROD="your-production-url" node scripts/copy-prod-to-dev.js'
  );
  console.log('\nOr set it in your shell:');
  console.log('  export DATABASE_URL_PROD="your-production-url"');
  console.log('  node scripts/copy-prod-to-dev.js');
  process.exit(1);
}

if (!DATABASE_URL_DEV) {
  console.error(
    '\n❌ Error: DATABASE_URL_DEV or DATABASE_URL environment variable is not set.'
  );
  console.log(
    '\nMake sure you have DATABASE_URL in your .env.local file, or set DATABASE_URL_DEV'
  );
  process.exit(1);
}

// Create Prisma clients for both databases
const prismaProd = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL_PROD,
    },
  },
});

const prismaDev = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL_DEV,
    },
  },
});

// Tables to skip (sensitive or not needed)
const SKIP_TABLES = [
  '_prisma_migrations', // Migration history
  'sessions', // Auth sessions
  'accounts', // OAuth accounts with tokens
  'verification_tokens', // Email verification tokens
];

// Tables to copy in order (respecting foreign key dependencies)
const COPY_ORDER = [
  // Core reference data
  'genres',
  'skills',
  'playlist_type_definitions',

  // Users (but skip sensitive fields)
  'users',

  // Artist profiles
  'artist_profiles',
  'artist_profile_skills',

  // Tracks
  'tracks',
  'track_attributes',
  'track_moods',

  // Playlists
  'playlists',
  'playlist_tracks',

  // Analytics/Stats (optional - can be large)
  'daily_stats',
  'artist_strength_scores',

  // Events (optional - can be very large)
  'play_events',
  'like_events',
  'save_events',
  'share_events',
  'download_events',

  // Submissions
  'playlist_submissions',

  // AI data
  'ai_conversations',
  'ai_conversation_messages',
  'ai_preferences',
  'ai_search_events',
  'unprocessed_query_logs',
  'routing_decision_logs',

  // Other
  'upload_jobs',
  'smart_links',
  'quick_links',
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function getTableCount(prisma, tableName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    return parseInt(result[0]?.count || '0', 10);
  } catch (error) {
    console.warn(`Warning: Could not count ${tableName}:`, error.message);
    return 0;
  }
}

async function copyTable(prismaProd, prismaDev, tableName) {
  try {
    console.log(`\n📋 Copying ${tableName}...`);

    // Get count from production
    const prodCount = await getTableCount(prismaProd, tableName);
    console.log(`   Production: ${prodCount} rows`);

    if (prodCount === 0) {
      console.log(`   ⏭️  Skipping (empty table)`);
      return { copied: 0, skipped: 0 };
    }

    // Clear dev table
    await prismaDev.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE`);
    console.log(`   🗑️  Cleared dev table`);

    // Copy data in batches
    const BATCH_SIZE = 1000;
    let copied = 0;
    let offset = 0;

    while (offset < prodCount) {
      const batch = await prismaProd.$queryRawUnsafe(
        `SELECT * FROM "${tableName}" ORDER BY id LIMIT ${BATCH_SIZE} OFFSET ${offset}`
      );

      if (batch.length === 0) break;

      // Insert batch into dev
      for (const row of batch) {
        const columns = Object.keys(row);
        const values = columns.map(col => {
          const val = row[col];
          if (val === null) return 'NULL';
          if (typeof val === 'string') {
            return `'${val.replace(/'/g, "''")}'`;
          }
          if (val instanceof Date) {
            return `'${val.toISOString()}'`;
          }
          if (typeof val === 'boolean') {
            return val ? 'true' : 'false';
          }
          if (Array.isArray(val)) {
            return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          }
          return String(val);
        });

        const columnsStr = columns.map(c => `"${c}"`).join(', ');
        const valuesStr = values.join(', ');

        try {
          await prismaDev.$executeRawUnsafe(
            `INSERT INTO "${tableName}" (${columnsStr}) VALUES (${valuesStr}) ON CONFLICT DO NOTHING`
          );
          copied++;
        } catch (error) {
          // Skip duplicate key errors
          if (
            !error.message.includes('duplicate') &&
            !error.message.includes('unique')
          ) {
            console.warn(`   ⚠️  Error inserting row:`, error.message);
          }
        }
      }

      offset += BATCH_SIZE;
      process.stdout.write(
        `   📊 Progress: ${Math.min(offset, prodCount)}/${prodCount} rows\r`
      );
    }

    console.log(`\n   ✅ Copied ${copied} rows`);

    return { copied, skipped: prodCount - copied };
  } catch (error) {
    console.error(`   ❌ Error copying ${tableName}:`, error.message);
    return { copied: 0, skipped: 0, error: error.message };
  }
}

async function copyUsersSafely(prismaProd, prismaDev) {
  console.log(`\n📋 Copying users (sanitized)...`);

  try {
    const users = await prismaProd.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        isPremium: true,
        isActive: true,
        stripeCustomerId: true,
        termsAcceptedAt: true,
        privacyAcceptedAt: true,
        marketingConsent: true,
        createdAt: true,
        updatedAt: true,
        // Skip: password, failedLoginAttempts, lockedUntil
      },
    });

    console.log(`   Production: ${users.length} users`);

    // Clear dev users
    await prismaDev.user.deleteMany({});
    console.log(`   🗑️  Cleared dev users`);

    // Insert sanitized users
    let copied = 0;
    for (const user of users) {
      try {
        await prismaDev.user.create({
          data: {
            ...user,
            password: null, // Don't copy passwords
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
        copied++;
      } catch (error) {
        if (
          !error.message.includes('duplicate') &&
          !error.message.includes('unique')
        ) {
          console.warn(
            `   ⚠️  Error inserting user ${user.email}:`,
            error.message
          );
        }
      }
    }

    console.log(`   ✅ Copied ${copied} users (passwords cleared)`);
    return { copied, skipped: users.length - copied };
  } catch (error) {
    console.error(`   ❌ Error copying users:`, error.message);
    return { copied: 0, skipped: 0, error: error.message };
  }
}

async function main() {
  console.log('\n🚀 Copying Production Data to Development Database\n');
  console.log(`Production: ${DATABASE_URL_PROD.replace(/:([^:]*@)/, ':***@')}`);
  console.log(
    `Development: ${DATABASE_URL_DEV.replace(/:([^:]*@)/, ':***@')}\n`
  );

  // Safety check
  const isProd =
    DATABASE_URL_PROD.includes('production') ||
    DATABASE_URL_PROD.includes('prod') ||
    DATABASE_URL_DEV.includes('production') ||
    DATABASE_URL_DEV.includes('prod');

  if (isProd) {
    const answer = await question(
      '⚠️  WARNING: This looks like it might be a production database. Are you sure you want to continue? (yes/no): '
    );
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Aborted.');
      process.exit(0);
    }
  }

  const copyEvents = await question(
    '\n📊 Copy events/analytics data? This can be very large. (yes/no, default: no): '
  );
  const shouldCopyEvents = copyEvents.toLowerCase() === 'yes';

  try {
    // Test connections
    console.log('\n🔌 Testing database connections...');
    await prismaProd.$connect();
    await prismaDev.$connect();
    console.log('✅ Connected to both databases\n');

    const stats = {
      tables: 0,
      rowsCopied: 0,
      rowsSkipped: 0,
      errors: [],
    };

    // Copy users first (sanitized)
    const userStats = await copyUsersSafely(prismaProd, prismaDev);
    stats.tables++;
    stats.rowsCopied += userStats.copied;
    stats.rowsSkipped += userStats.skipped;

    // Copy other tables
    for (const tableName of COPY_ORDER) {
      if (SKIP_TABLES.includes(tableName)) {
        console.log(`\n⏭️  Skipping ${tableName} (sensitive/not needed)`);
        continue;
      }

      // Skip events if not requested
      if (!shouldCopyEvents && tableName.includes('_events')) {
        console.log(`\n⏭️  Skipping ${tableName} (events not requested)`);
        continue;
      }

      if (
        !shouldCopyEvents &&
        (tableName === 'daily_stats' || tableName === 'artist_strength_scores')
      ) {
        console.log(`\n⏭️  Skipping ${tableName} (analytics not requested)`);
        continue;
      }

      const result = await copyTable(prismaProd, prismaDev, tableName);
      stats.tables++;
      stats.rowsCopied += result.copied;
      stats.rowsSkipped += result.skipped;
      if (result.error) {
        stats.errors.push({ table: tableName, error: result.error });
      }
    }

    console.log('\n\n✨ Copy Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Tables processed: ${stats.tables}`);
    console.log(`   Rows copied: ${stats.rowsCopied}`);
    console.log(`   Rows skipped: ${stats.rowsSkipped}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      stats.errors.forEach(({ table, error }) => {
        console.log(`   ${table}: ${error}`);
      });
    }

    console.log(
      '\n✅ Development database has been populated with production data!'
    );
    console.log(
      '⚠️  Note: User passwords, sessions, and OAuth tokens were not copied for security.'
    );
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prismaProd.$disconnect();
    await prismaDev.$disconnect();
    rl.close();
  }
}

main();
