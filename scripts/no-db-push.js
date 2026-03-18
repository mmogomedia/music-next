#!/usr/bin/env node

/**
 * This script intentionally blocks `prisma db push`.
 *
 * WHY: `prisma db push` applies schema changes directly to the database
 * without creating a migration file or recording anything in `_prisma_migrations`.
 * This causes the migration history to drift out of sync with the actual DB state,
 * leading to "type already exists" and similar errors on future deploys.
 *
 * USE INSTEAD:
 *   yarn db:migrate --name your_migration_name
 *
 * This runs `prisma migrate dev` which:
 *   1. Diffs your schema against the DB
 *   2. Generates a SQL migration file in prisma/migrations/
 *   3. Applies it to your local DB
 *   4. Records it in _prisma_migrations
 */

console.error(`
╔═══════════════════════════════════════════════════════════════╗
║                  ⛔  prisma db push is blocked                ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  db:push applies schema changes without creating a migration  ║
║  file, which corrupts the migration history and breaks        ║
║  production deploys.                                          ║
║                                                               ║
║  Use this instead:                                            ║
║                                                               ║
║    yarn db:migrate --name describe_your_change                ║
║                                                               ║
║  Example:                                                     ║
║    yarn db:migrate --name add_user_preferences_table          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

process.exit(1);
