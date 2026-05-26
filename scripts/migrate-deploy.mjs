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
 */
import { execSync } from 'node:child_process';

const env = process.env.VERCEL_ENV;
if (env && env !== 'production') {
  console.log(
    `[migrate-deploy] skipping on Vercel ${env} build — production-only.`
  );
  process.exit(0);
}

console.log(
  `[migrate-deploy] applying pending migrations (VERCEL_ENV=${env ?? 'unset (local)'})...`
);
execSync('prisma migrate deploy', { stdio: 'inherit' });
