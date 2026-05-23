/**
 * Vercel Configuration
 *
 * Defines cron jobs:
 * - PULSE³ eligibility recalculation: Daily at midnight (00:00 UTC)
 * - PULSE³ league run: Daily at 1 AM (01:00 UTC)
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
  ],
} as const;

export default config;
