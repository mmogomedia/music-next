/**
 * Vercel Configuration
 *
 * Defines cron jobs:
 * - PULSE³ eligibility recalculation: Daily at midnight (00:00 UTC)
 * - PULSE³ league run: Daily at 1 AM (01:00 UTC)
 * - MCP scheduled-article publish: Daily at 00:30 UTC (Hobby plan = daily crons only)
 */
const config = {
  crons: [
    {
      path: '/api/pulse/eligibility/recalculate',
      schedule: '0 0 * * *',
    },
    {
      path: '/api/pulse/league/run',
      schedule: '0 1 * * *',
    },
    {
      path: '/api/cron/publish-scheduled',
      schedule: '30 0 * * *',
    },
  ],
} as const;

export default config;
