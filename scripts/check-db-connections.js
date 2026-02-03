#!/usr/bin/env node

/**
 * Check Database Connection URLs
 *
 * This script checks and displays database connection information
 * from various environment files without exposing sensitive data.
 *
 * Usage:
 *   node scripts/check-db-connections.js
 */

const fs = require('fs');
const path = require('path');

// Mask sensitive parts of database URL
function maskUrl(url) {
  if (!url) return 'Not set';

  // Mask password in connection string
  return url.replace(/:([^:@]+)@/, ':***@');
}

// Extract connection info from URL
function parseConnectionInfo(url) {
  if (!url) return null;

  try {
    const match = url.match(
      /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
    );
    if (match) {
      return {
        user: match[1],
        password: '***',
        host: match[3],
        port: match[4],
        database: match[5],
      };
    }

    // Try Vercel format
    const vercelMatch = url.match(
      /postgresql:\/\/([^:]+):([^@]+)@([^/]+)\/(.+)\?/
    );
    if (vercelMatch) {
      return {
        user: vercelMatch[1],
        password: '***',
        host: vercelMatch[3],
        port: 'default',
        database: vercelMatch[4],
      };
    }
  } catch (error) {
    // Ignore
  }

  return null;
}

// Read and parse .env file
function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^DATABASE_URL=(.+)$/m);
    if (match && match[1]) {
      let value = match[1].trim();
      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return value;
    }
  } catch (error) {
    return null;
  }

  return null;
}

console.log('\n🔍 Checking Database Connection URLs\n');
console.log('═'.repeat(70));

// Check .env.local (local development)
const localPath = path.join(process.cwd(), '.env.local');
const localUrl = readEnvFile(localPath);

console.log('\n📁 Local Development (.env.local)');
if (localUrl) {
  console.log('   ✅ DATABASE_URL found');
  console.log('   🔗 URL:', maskUrl(localUrl));
  const info = parseConnectionInfo(localUrl);
  if (info) {
    console.log('   📊 Details:');
    console.log('      Host:', info.host);
    console.log('      Port:', info.port);
    console.log('      Database:', info.database);
    console.log('      User:', info.user);
  }
} else {
  console.log('   ❌ DATABASE_URL not found');
}

// Check .env.production
const prodPath = path.join(process.cwd(), '.env.production');
const prodUrl = readEnvFile(prodPath);

console.log('\n📁 Production (.env.production)');
if (prodUrl) {
  console.log('   ✅ DATABASE_URL found');
  console.log('   🔗 URL:', maskUrl(prodUrl));
  const info = parseConnectionInfo(prodUrl);
  if (info) {
    console.log('   📊 Details:');
    console.log('      Host:', info.host);
    console.log('      Port:', info.port);
    console.log('      Database:', info.database);
    console.log('      User:', info.user);
  }
} else {
  console.log('   ❌ DATABASE_URL not found');
}

// Check .env.vercel.production
const vercelProdPath = path.join(process.cwd(), '.env.vercel.production');
const vercelProdUrl = readEnvFile(vercelProdPath);

console.log('\n📁 Vercel Production (.env.vercel.production)');
if (vercelProdUrl) {
  console.log('   ✅ DATABASE_URL found');
  console.log('   🔗 URL:', maskUrl(vercelProdUrl));
  const info = parseConnectionInfo(vercelProdUrl);
  if (info) {
    console.log('   📊 Details:');
    console.log('      Host:', info.host);
    console.log('      Port:', info.port);
    console.log('      Database:', info.database);
    console.log('      User:', info.user);
  }
} else {
  console.log('   ❌ DATABASE_URL not found');
}

// Check current environment variable
console.log('\n🌐 Current Shell Environment');
if (process.env.DATABASE_URL) {
  console.log('   ✅ DATABASE_URL is set');
  console.log('   🔗 URL:', maskUrl(process.env.DATABASE_URL));
} else {
  console.log('   ❌ DATABASE_URL not set in current shell');
}

// Summary
console.log(`\n${'═'.repeat(70)}`);
console.log('\n📋 Summary:');
console.log('   Local:', localUrl ? '✅ Configured' : '❌ Missing');
console.log('   Production:', prodUrl ? '✅ Configured' : '❌ Missing');
console.log(
  '   Vercel Production:',
  vercelProdUrl ? '✅ Configured' : '❌ Missing'
);
console.log('   Shell:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');

console.log('\n💡 Tips:');
if (!localUrl) {
  console.log('   - Add DATABASE_URL to .env.local for local development');
}
if (!vercelProdUrl) {
  console.log(
    '   - Run "vercel env pull .env.vercel.production" to get production env vars'
  );
}
console.log('   - Use "yarn enable-pgvector:local" for local database');
console.log('   - Use "yarn enable-pgvector:prod" for production database');
console.log('');
