#!/usr/bin/env node
/**
 * Production-only `prisma migrate deploy`.
 *
 * Runs inside `yarn build`. Applies pending migrations ONLY on Vercel
 * production builds. Preview and local builds skip it — preview Neon
 * branches are ephemeral/can be unreachable, and migrations should
 * always reach prod via the main branch's deploy anyway.
 *
 * Mirrors Picasite's `scripts/migrate-deploy.ts` pattern.
 *
 * THE GUARD MUST NOT TEST `env &&`. `VERCEL_ENV` is UNSET on every local
 * `yarn build`, so `env && env !== 'production'` is falsy there, the skip never
 * fires, and the script runs `prisma migrate deploy` against whatever
 * DATABASE_URL is in the developer's .env.local — in practice the live Neon
 * database. The docblock above has always claimed "local builds skip it" and
 * the log line even printed `VERCEL_ENV=unset (local)` on its way to migrating
 * production. Anything other than the literal string "production" must skip.
 */
import { execSync } from 'node:child_process';

const env = process.env.VERCEL_ENV;

if (env !== 'production') {
  const where = env ? `Vercel ${env} build` : 'local build (VERCEL_ENV unset)';
  console.log(`[migrate-deploy] skipping on ${where} — production-only.`);
  process.exit(0);
}

console.log(
  '[migrate-deploy] applying pending migrations (VERCEL_ENV=production)...'
);
execSync('prisma migrate deploy', { stdio: 'inherit' });
