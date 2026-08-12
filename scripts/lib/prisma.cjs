/**
 * PrismaClient factory for CommonJS scripts.
 *
 * Prisma 7 removed the built-in query engine: every client must be handed a
 * driver adapter, so a bare `new PrismaClient()` now THROWS at construction.
 * `scripts/` sits outside tsconfig, outside the build and outside the test
 * suite, so nothing catches that — every gate stays green while the ops tooling
 * is broken.
 *
 * Prisma 7 also removed the `datasources: { db: { url } }` constructor option.
 * That one matters more than it looks: several scripts here point deliberately
 * at PRODUCTION (copy-prod-to-dev, seed-prod-gamification, seed-league-tiers-prod,
 * check-league-status-prod). If the override were silently dropped, they would
 * fall back to whatever DATABASE_URL happens to be set — a prod script quietly
 * writing to dev, or a prod→dev copy becoming dev→dev. Passing the URL
 * explicitly here is what keeps that impossible.
 *
 * Usage:
 *   const { createPrismaClient } = require('./lib/prisma.cjs');
 *   const prisma = createPrismaClient();                  // uses DATABASE_URL
 *   const prodDb = createPrismaClient(DATABASE_URL_PROD); // explicit target
 */
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

/**
 * @param {string} [connectionString] Target database. Defaults to DATABASE_URL.
 * @param {object} [options] Extra PrismaClient options (e.g. `log`).
 * @returns {import('@prisma/client').PrismaClient}
 */
function createPrismaClient(connectionString, options = {}) {
  const url = connectionString || process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      'createPrismaClient: no connection string. Pass one explicitly or set ' +
        'DATABASE_URL (scripts are usually run via `dotenv -e .env.local -- node ...`).'
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
    ...options,
  });
}

module.exports = { createPrismaClient };
