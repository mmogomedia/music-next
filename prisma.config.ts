import 'dotenv/config';

import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 configuration.
 *
 * Prisma 7 no longer accepts `url` / `directUrl` inside the `datasource` block
 * in schema.prisma. Connection URLs for the CLI (migrate, introspect, studio)
 * live here instead; the *runtime* connection is supplied by the driver adapter
 * in `src/lib/db.ts`.
 *
 * `DIRECT_DATABASE_URL` is the unpooled endpoint. Migrations must not run
 * through the pgbouncer pooler, which is exactly the split the old
 * `url` / `directUrl` pair encoded.
 *
 * DO NOT use the `env()` helper from `prisma/config` here. It resolves EAGERLY
 * when the config file loads — and every Prisma command loads it, including
 * `prisma generate`, which needs no database at all. Prisma 5's schema-level
 * `env()` was lazy and only resolved when migrate actually connected, so this
 * is a behaviour change, not a like-for-like port.
 *
 * The practical consequence: `postinstall` runs `prisma generate`, so with
 * `env()` a plain `yarn install` FAILS anywhere the variable is unset —
 * CI, a fresh clone, a Docker build, a contributor without a .env:
 *
 *     PrismaConfigEnvError: Cannot resolve environment variable: DIRECT_DATABASE_URL
 *
 * Reading `process.env` and only declaring the datasource when the URL is
 * actually present keeps `generate` working everywhere, while migrate/studio
 * still fail loudly (Prisma's own "no datasource URL" error) if it is missing.
 */
const directUrl = process.env.DIRECT_DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  ...(directUrl ? { datasource: { url: directUrl } } : {}),
});
