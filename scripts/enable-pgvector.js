#!/usr/bin/env node

/**
 * Enable pgvector extension on Vercel Postgres database
 * Works with both local and production databases
 *
 * Usage:
 *   # Local (uses .env.local DATABASE_URL)
 *   yarn enable-pgvector:local
 *
 *   # Production (uses Vercel CLI or DATABASE_URL env var)
 *   yarn enable-pgvector:prod
 *
 *   # Or manually with DATABASE_URL
 *   DATABASE_URL="postgresql://..." node scripts/enable-pgvector.js
 */

const { PrismaClient } = require('@prisma/client');

// Get DATABASE_URL from environment or Vercel CLI
function getDatabaseUrl() {
  // If DATABASE_URL is explicitly set, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const fs = require('fs');
  const path = require('path');

  // Helper to parse .env file
  function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      const envContent = fs.readFileSync(filePath, 'utf-8');
      // Match DATABASE_URL=value (handles quoted and unquoted values)
      const match = envContent.match(/^DATABASE_URL=(.+)$/m);
      if (match && match[1]) {
        // Remove quotes if present
        let value = match[1].trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return value;
      }
    } catch (error) {
      // Ignore
    }
    return null;
  }

  // Try to load from .env.vercel (for production)
  const vercelEnvPath = path.join(process.cwd(), '.env.vercel');
  const vercelUrl = parseEnvFile(vercelEnvPath);
  if (vercelUrl) {
    return vercelUrl;
  }

  // Fallback to .env.local (for local)
  const localEnvPath = path.join(process.cwd(), '.env.local');
  const localUrl = parseEnvFile(localEnvPath);
  if (localUrl) {
    return localUrl;
  }

  return null;
}

async function enablePgvector(databaseUrl) {
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL not found.');
    console.log('\nOptions:');
    console.log('1. Set DATABASE_URL environment variable:');
    console.log(
      '   DATABASE_URL="postgresql://..." node scripts/enable-pgvector.js'
    );
    console.log('\n2. For local: Make sure .env.local has DATABASE_URL');
    console.log('\n3. For production: Use Vercel CLI:');
    console.log('   vercel env pull .env.vercel');
    console.log('   node scripts/enable-pgvector.js');
    process.exit(1);
  }

  // Mask password for display
  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':***@');
  console.log('\n🔧 Enabling pgvector extension...');
  console.log(`Database: ${maskedUrl}\n`);

  // Create Prisma client with the database URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    // Check if extension already exists
    const existingExtension = await prisma.$queryRaw`
      SELECT * FROM pg_extension WHERE extname = 'vector';
    `;

    if (Array.isArray(existingExtension) && existingExtension.length > 0) {
      console.log('✅ pgvector extension is already enabled!');
      console.log('\nExtension details:');
      console.log(
        JSON.stringify(
          existingExtension[0],
          (key, value) =>
            typeof value === 'bigint' ? value.toString() : value,
          2
        )
      );
    } else {
      // Enable the extension
      console.log('📦 Installing pgvector extension...');
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;

      // Verify installation
      const verification = await prisma.$queryRaw`
        SELECT * FROM pg_extension WHERE extname = 'vector';
      `;

      if (Array.isArray(verification) && verification.length > 0) {
        console.log('\n✅ pgvector extension enabled successfully!');
        console.log('\nExtension details:');
        console.log(
          JSON.stringify(
            verification[0],
            (key, value) =>
              typeof value === 'bigint' ? value.toString() : value,
            2
          )
        );
      } else {
        console.log('⚠️  Extension command succeeded but verification failed.');
        console.log(
          'This might be normal if the extension was already installed.'
        );
      }
    }

    // Show version info
    try {
      const version = await prisma.$queryRaw`
        SELECT extversion FROM pg_extension WHERE extname = 'vector';
      `;
      if (Array.isArray(version) && version.length > 0) {
        console.log(`\n📌 pgvector version: ${version[0].extversion}`);
      }
    } catch (error) {
      // Ignore version check errors
    }

    console.log(
      '\n✨ Done! You can now use vector columns in your Prisma schema.'
    );
    console.log('\nExample:');
    console.log('  embedding Unsupported("vector(1536)")');
  } catch (error) {
    console.error('\n❌ Failed to enable pgvector:', error.message);
    console.error('\nError details:', error);

    if (error.message.includes('permission denied')) {
      console.log(
        '\n💡 Tip: Make sure your database user has CREATE EXTENSION permission.'
      );
      console.log('   For Vercel Postgres, this should work automatically.');
    } else if (error.message.includes('extension "vector" does not exist')) {
      console.log(
        '\n💡 Tip: The pgvector extension might not be available on this PostgreSQL instance.'
      );
      console.log(
        '   Vercel Postgres should support it. Contact Vercel support if this persists.'
      );
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const databaseUrl = getDatabaseUrl();
enablePgvector(databaseUrl).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
