/**
 * PrismaClient factory for ESM / TypeScript scripts.
 *
 * ESM twin of `prisma.cjs` — see that file for the full rationale. In short:
 * Prisma 7 requires a driver adapter (a bare `new PrismaClient()` throws), and
 * it removed the `datasources: { db: { url } }` option that several scripts
 * used to aim themselves at a specific database.
 *
 * Usage:
 *   import { createPrismaClient } from './lib/prisma.mjs';
 *   const prisma = createPrismaClient();
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * @param {string} [connectionString] Target database. Defaults to DATABASE_URL.
 * @param {object} [options] Extra PrismaClient options (e.g. `log`).
 * @returns {PrismaClient}
 */
export function createPrismaClient(connectionString, options = {}) {
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
