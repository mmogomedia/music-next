/**
 * PrismaClient factory for TypeScript scripts.
 *
 * TS twin of `prisma.cjs` / `prisma.mjs` — see `prisma.cjs` for the full
 * rationale. In short: Prisma 7 requires a driver adapter (a bare
 * `new PrismaClient()` throws at construction), and it removed the
 * `datasources: { db: { url } }` option that several scripts used to aim
 * themselves at a specific database.
 *
 * This exists as a separate .ts file rather than reusing the .mjs one because
 * `scripts/**\/*.ts` IS type-checked by `yarn typecheck`. Importing the .mjs
 * helper leaves the returned client as `any`, which silently turns every
 * downstream callback parameter into an implicit any — `tsc` then fails with
 * TS7006 in scripts that were previously fully typed. Keeping a typed export
 * here preserves the inference those scripts already relied on.
 *
 * Usage:
 *   import { createPrismaClient } from './lib/prisma';
 *   const prisma = createPrismaClient();
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

type PrismaClientOptions = ConstructorParameters<typeof PrismaClient>[0];

export function createPrismaClient(
  connectionString?: string,
  options: Omit<NonNullable<PrismaClientOptions>, 'adapter'> = {}
): PrismaClient {
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
