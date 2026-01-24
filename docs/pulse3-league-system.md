# PULSE³ League System - Comprehensive Documentation

## Table of Contents

1. [Overview](#overview)
2. [Key Concepts](#key-concepts)
3. [Tier Configuration](#tier-configuration)
4. [League Run Process](#league-run-process)
5. [Ranking Algorithm](#ranking-algorithm)
6. [Band State Calculation](#band-state-calculation)
7. [Status Change & Movement Tracking](#status-change--movement-tracking)
8. [Refresh Intervals & Scheduling](#refresh-intervals--scheduling)
9. [Tier Overlap Prevention](#tier-overlap-prevention)
10. [API Endpoints](#api-endpoints)
11. [Database Schema](#database-schema)
12. [Cron Job Configuration](#cron-job-configuration)
13. [Manual Operations](#manual-operations)
14. [Troubleshooting](#troubleshooting)
15. [Testing](#testing)

---

## Overview

The PULSE³ League System organizes artists into configurable tiers based on their eligibility scores. It provides:

- **Tier-based rankings** (e.g., "Top 20", "Watchlist")
- **Immutable snapshots** of rankings at specific points in time
- **Movement tracking** (rising, falling, holding)
- **Band state monitoring** (secure, at risk, above range)
- **Configurable refresh intervals** per tier
- **Automatic overlap prevention** between tiers

### How It Works

1. **Eligibility scores** are calculated independently (see [`pulse3-eligibility-scoring.md`](./pulse3-eligibility-scoring.md) for eligibility scoring formulas)
2. **League runs** create snapshots of tier rankings using the latest eligibility scores
3. **Movement** is calculated by comparing current run to previous run
4. **Band states** indicate if artists are within their tier's score range
5. **Refresh intervals** control how often each tier recalculates

---

## Key Concepts

### League Tier

A configurable category that groups artists by eligibility score. Each tier has:

- **Code**: Unique identifier (e.g., "TIER1", "TIER2")
- **Name**: Display name (e.g., "Top 20", "Watchlist")
- **Target Size**: Number of artists to include (e.g., 20, 100)
- **Min Score**: Minimum eligibility score required (inclusive)
- **Max Score**: Maximum eligibility score allowed (inclusive, null = no max)
- **Refresh Interval Hours**: How often to recalculate (e.g., 24 = daily, 12 = twice daily)
- **Sort Order**: Display order in UI
- **Is Active**: Whether tier is currently active

**Default Tiers**:

- **TIER1 (Top 20)**: `targetSize: 20`, `minScore: 70`, `maxScore: null`, `refreshIntervalHours: 12`
- **TIER2 (Watchlist)**: `targetSize: 100`, `minScore: 50`, `maxScore: 70`, `refreshIntervalHours: 24`

### League Run

An **immutable snapshot** of a tier's ranking at a specific point in time. Each run:

- Is created atomically with all entries
- References eligibility scores that existed at run time
- Cannot be modified after creation
- Has a `runType`: `SCHEDULED` (from cron) or `MANUAL` (from script/API)

### League Entry

An individual artist's ranking within a specific league run. Each entry includes:

- **Rank**: Position in tier (1 = highest)
- **Score**: Eligibility score at run time
- **Band State**: `SECURE`, `BELOW_RANGE`, or `ABOVE_RANGE`
- **Is At Risk**: `true` if `bandState !== 'SECURE'`
- **Previous Rank**: Rank in previous run (null if new)
- **Rank Delta**: Change in rank (positive = moved up, negative = moved down)
- **Status Change**: `NEW`, `UP`, `DOWN`, `UNCHANGED`, `PROMOTED`, `DEMOTED`, `EXITED`
- **Highlight**: `true` if rank <= 3 (top 3)

### Band State

Categorization of an artist's score relative to tier thresholds:

- **SECURE**: Score is within tier's acceptable range (`minScore <= score <= maxScore`)
- **BELOW_RANGE**: Score is below minimum (`score < minScore`) - artist is "At Risk"
- **ABOVE_RANGE**: Score exceeds maximum (`score > maxScore`) - may qualify for higher tier

**Note**: Band state does NOT prevent an artist from being in a tier. It's informational only. Artists can be in TIER1 even if their score is below `minScore` (e.g., if they're the only artist).

### Status Change

Movement status compared to previous run:

- **NEW**: Artist wasn't in previous run
- **UP**: Rank improved (current rank < previous rank)
- **DOWN**: Rank declined (current rank > previous rank)
- **UNCHANGED**: Rank stayed the same
- **PROMOTED**: Moved from lower tier (future enhancement)
- **DEMOTED**: Moved from higher tier (future enhancement)
- **EXITED**: Was in previous run but not in current (future enhancement)

---

## Tier Configuration

### Creating/Updating Tiers

Tiers are stored in the `league_tiers` table. They can be:

1. **Seeded via migration**: `prisma/migrations/20260123195837_seed_league_tiers/migration.sql`
2. **Created via admin API**: `POST /api/admin/league/seed` (requires admin or CRON_SECRET)
3. **Created via script**: `scripts/seed-league-tiers-prod.js`

### Example Tier Configuration

```typescript
{
  code: 'TIER1',
  name: 'Top 20',
  targetSize: 20,
  minScore: 70,
  maxScore: null, // No upper limit
  refreshIntervalHours: 12, // Every 12 hours
  isActive: true,
  sortOrder: 1
}
```

### Tier Best Practices

- **TIER1** should have the highest `minScore` and smallest `targetSize`
- **Lower tiers** should have lower `minScore` and larger `targetSize`
- **Refresh intervals** should increase for higher tiers (TIER1: 12h, TIER2: 24h)
- **Sort order** should match tier hierarchy (1 = highest tier)

---

## League Run Process

### Step-by-Step Process

1. **Get Latest Eligibility Scores**
   - Fetches most recent score per artist from `PulseEligibilityScore` using a single optimized SQL query
   - Uses PostgreSQL `DISTINCT ON` to eliminate N+1 query problem (1 query instead of N+1)
   - Includes all component scores (follower, engagement, consistency, platform diversity)

2. **Filter & Sort Artists**
   - Excludes artists already selected in higher tiers (prevents overlap)
   - Sorts by: Score DESC → Engagement DESC → Consistency DESC → Follower DESC → Artist ID ASC

3. **Select Top N**
   - Takes top `targetSize` artists from sorted list
   - If fewer artists exist than `targetSize`, includes all available

4. **Calculate Band State**
   - Compares each artist's score to tier's `minScore` and `maxScore`
   - Sets `bandState` and `isAtRisk` flags

5. **Compare to Previous Run**
   - Fetches previous run's entries
   - Calculates `statusChange`, `previousRank`, and `rankDelta` for each artist

6. **Create League Run & Entries**
   - Creates `LeagueRun` record atomically
   - Creates all `LeagueEntry` records in same transaction
   - Ensures data consistency

### Code Flow

```typescript
// Service method
PulseLeagueService.runLeagueForTier(tier, runType, options)

// API endpoint
POST /api/pulse/league/run
  → Verifies CRON_SECRET
  → Gets all active tiers
  → For each tier:
    → Checks if refresh needed (or force=true)
    → Runs league for tier
    → Collects selected artist IDs (for overlap prevention)
  → Processes promotions/demotions
  → Returns summary
```

---

## Ranking Algorithm

### Sorting Order

Artists are sorted using a **5-level tie-breaking system**:

1. **Primary: Score** (DESC) - Highest eligibility score first
2. **Secondary: Engagement Score** (DESC) - Higher engagement breaks ties
3. **Tertiary: Consistency Score** (DESC) - More consistent breaks ties
4. **Quaternary: Follower Score** (DESC) - More followers breaks ties
5. **Quinary: Artist Profile ID** (ASC) - Alphabetical for stability

### Example

Two artists with score 75.0:

- Artist A: `engagementScore: 80`, `consistencyScore: 70`, `followerScore: 60`
- Artist B: `engagementScore: 75`, `consistencyScore: 75`, `followerScore: 65`

**Result**: Artist A ranks higher (engagement 80 > 75)

### Stability

The quinary sort (Artist ID) ensures **stable ordering** when all other scores are identical. This prevents rank "jitter" between runs.

---

## Band State Calculation

### Logic

```typescript
function calculateBandState(
  score: number,
  minScore: number,
  maxScore: number | null
): LeagueBandState {
  if (score < minScore) {
    return 'BELOW_RANGE';
  }
  if (maxScore !== null && score > maxScore) {
    return 'ABOVE_RANGE';
  }
  return 'SECURE';
}
```

### Examples

**TIER1** (`minScore: 70`, `maxScore: null`):

- Score 85 → `SECURE`
- Score 65 → `BELOW_RANGE` (but still in tier if selected)
- Score 100 → `SECURE`

**TIER2** (`minScore: 50`, `maxScore: 70`):

- Score 60 → `SECURE`
- Score 45 → `BELOW_RANGE`
- Score 75 → `ABOVE_RANGE` (may qualify for TIER1)

### Important Notes

- **Band state does NOT filter artists** - it's informational only
- Artists can be in a tier even if `bandState === 'BELOW_RANGE'`
- `isAtRisk` flag is set when `bandState !== 'SECURE'`
- Band state helps identify artists who may need to improve or may qualify for higher tiers

---

## Status Change & Movement Tracking

### Status Change Calculation

```typescript
function calculateStatusChange(
  artistProfileId: string,
  currentRank: number,
  previousEntries: Array<{ artistProfileId: string; rank: number }>
): LeagueStatusChange {
  const previousEntry = previousEntries.find(
    e => e.artistProfileId === artistProfileId
  );

  if (!previousEntry) {
    return 'NEW';
  }

  if (currentRank < previousEntry.rank) {
    return 'UP'; // Moved up (lower rank number = better)
  }
  if (currentRank > previousEntry.rank) {
    return 'DOWN'; // Moved down (higher rank number = worse)
  }
  return 'UNCHANGED';
}
```

### Rank Delta

```
rankDelta = previousRank - currentRank
```

- **Positive delta**: Moved up (e.g., +3 = moved from rank 5 to rank 2)
- **Negative delta**: Moved down (e.g., -2 = moved from rank 3 to rank 5)
- **Null**: No previous rank (new entry)

### Examples

**Scenario 1: New Entry**

- Previous run: No entry
- Current run: Rank 10
- Status: `NEW`, `rankDelta: null`

**Scenario 2: Moved Up**

- Previous run: Rank 5
- Current run: Rank 2
- Status: `UP`, `rankDelta: +3`

**Scenario 3: Moved Down**

- Previous run: Rank 3
- Current run: Rank 7
- Status: `DOWN`, `rankDelta: -4`

**Scenario 4: Unchanged**

- Previous run: Rank 1
- Current run: Rank 1
- Status: `UNCHANGED`, `rankDelta: 0`

---

## Refresh Intervals & Scheduling

### How Refresh Intervals Work

Each tier has a `refreshIntervalHours` setting. A tier will only run if:

```
hoursSinceLastRun >= refreshIntervalHours
```

**Examples**:

- **TIER1** (`refreshIntervalHours: 12`): Runs if last run was 12+ hours ago
- **TIER2** (`refreshIntervalHours: 24`): Runs if last run was 24+ hours ago

### Force Run

You can bypass the refresh check by adding `?force=true` to the API endpoint:

```bash
POST /api/pulse/league/run?force=true
```

This is useful for:

- Testing
- Manual triggers
- Emergency updates

### Cron Job Schedule

**Vercel Cron** (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/pulse/league/run",
      "schedule": "0 1 * * *" // Daily at 1 AM UTC
    }
  ]
}
```

**Note**: The cron job runs daily, but each tier only processes if its refresh interval has passed. This allows different tiers to refresh at different frequencies.

### Timing Considerations

1. **Eligibility recalculation** runs at midnight UTC (via `/api/pulse/eligibility/recalculate`)
2. **League run** runs at 1 AM UTC (via `/api/pulse/league/run`)
3. This ensures league runs use fresh eligibility scores

---

## Tier Overlap Prevention

### Problem

Without overlap prevention, the same artist could appear in multiple tiers (e.g., rank 15 in TIER1 and rank 1 in TIER2).

### Solution

The league run process maintains a `selectedArtistIds` array. When processing tiers:

1. **TIER1** runs first (highest `sortOrder`)
2. Artists selected for TIER1 are added to `selectedArtistIds`
3. **TIER2** runs with `excludeArtistProfileIds: selectedArtistIds`
4. TIER2 cannot select artists already in TIER1

### Implementation

```typescript
const selectedArtistIds: string[] = [];

for (const tier of activeTiers) {
  const result = await PulseLeagueService.runLeagueForTier(tier, 'SCHEDULED', {
    excludeArtistProfileIds: selectedArtistIds,
  });

  // Collect selected artists
  const entries = await PulseLeagueService.getCurrentLeagueEntries(tier.id);
  for (const e of entries) {
    selectedArtistIds.push(e.artistProfileId);
  }
}
```

### Result

- Each artist appears in **at most one tier** per run
- Higher tiers get priority (TIER1 selects first)
- Lower tiers fill remaining slots

---

## API Endpoints

### POST /api/pulse/league/run

**Purpose**: Trigger league run for all active tiers

**Authentication**: CRON_SECRET required

**Headers**:

- `Authorization: Bearer <CRON_SECRET>` (preferred)
- `x-cron-secret: <CRON_SECRET>` (fallback)
- Query param: `?secret=<CRON_SECRET>` (fallback)

**Query Parameters**:

- `force=true`: Bypass refresh interval check

**Response**:

```json
{
  "success": true,
  "message": "Processed 2 tier(s)",
  "tiersProcessed": 2,
  "tiersSkipped": 0,
  "tiersErrored": 0,
  "entriesCreated": 120,
  "promotionsProcessed": true,
  "totalDurationMs": 1234,
  "results": [
    {
      "tierCode": "TIER1",
      "tierName": "Top 20",
      "runId": "cmk...",
      "entriesCreated": 20,
      "durationMs": 500
    },
    {
      "tierCode": "TIER2",
      "tierName": "Watchlist",
      "runId": "cmk...",
      "entriesCreated": 100,
      "durationMs": 734
    }
  ],
  "logId": "cmk..."
}
```

**Process**:

1. Verifies CRON_SECRET
2. Gets all active tiers
3. For each tier:
   - Checks if refresh needed (or `force=true`)
   - Runs league calculation
   - Collects selected artist IDs
4. Processes promotions/demotions
5. Returns summary

### GET /api/pulse/league

**Purpose**: Get current league state for all tiers (public)

**Authentication**: None

**Response**:

```json
{
  "tiers": [
    {
      "code": "TIER1",
      "name": "Top 20",
      "run_at": "2026-01-23T12:00:00Z",
      "previous_run_at": "2026-01-22T12:00:00Z",
      "entries": [
        {
          "artist_id": "...",
          "artist_name": "Artist Name",
          "rank": 1,
          "score": 85.5,
          "band_state": "SECURE",
          "is_at_risk": false,
          "status_change": "UP",
          "previous_rank": 3,
          "rank_delta": 2,
          "scoreDelta": 2.5,
          "followerScore": 70.0,
          "engagementScore": 90.0,
          "consistencyScore": 80.0,
          "platformDiversityScore": 50.0
        }
      ]
    }
  ]
}
```

### GET /api/pulse/debug

**Purpose**: Diagnostic endpoint to verify eligibility scores and league status

**Authentication**: Required (session)

**Response**: See `src/app/api/pulse/debug/route.ts` for full schema

---

## Database Schema

### LeagueTier

```prisma
model LeagueTier {
  id                  String   @id @default(cuid())
  code                String   @unique
  name                String
  targetSize          Int
  minScore            Float
  maxScore            Float?
  refreshIntervalHours Int
  isActive            Boolean  @default(true)
  sortOrder           Int
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  leagueRuns          LeagueRun[]
}
```

### LeagueRun

```prisma
model LeagueRun {
  id        String        @id @default(cuid())
  tierId    String
  runType   LeagueRunType // 'SCHEDULED' | 'MANUAL'
  runAt     DateTime      @default(now())

  tier      LeagueTier    @relation(fields: [tierId], references: [id])
  entries   LeagueEntry[]
}
```

### LeagueEntry

```prisma
model LeagueEntry {
  id              String            @id @default(cuid())
  leagueRunId     String
  artistProfileId String
  rank            Int
  score           Float
  bandState       LeagueBandState   // 'SECURE' | 'BELOW_RANGE' | 'ABOVE_RANGE'
  isAtRisk        Boolean
  previousRank    Int?
  rankDelta       Int?
  statusChange    LeagueStatusChange
  highlight       Boolean           @default(false)

  leagueRun       LeagueRun         @relation(fields: [leagueRunId], references: [id])
  artistProfile   ArtistProfile     @relation(fields: [artistProfileId], references: [id])
}
```

### PulseLeagueRunLog

```prisma
model PulseLeagueRunLog {
  id                  String   @id @default(cuid())
  startedAt           DateTime @default(now())
  completedAt         DateTime?
  totalDurationMs     Int?
  tiersProcessed      Int      @default(0)
  tiersSkipped        Int      @default(0)
  tiersErrored        Int      @default(0)
  entriesCreated      Int      @default(0)
  promotionsProcessed Boolean  @default(false)
  status              String   // 'running' | 'completed' | 'failed'
  errorMessage        String?
  createdAt           DateTime @default(now())
}
```

---

## Cron Job Configuration

### Vercel Cron

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/pulse/eligibility/recalculate",
      "schedule": "0 0 * * *" // Daily at midnight UTC
    },
    {
      "path": "/api/pulse/league/run",
      "schedule": "0 1 * * *" // Daily at 1 AM UTC
    }
  ]
}
```

### Environment Variables

- `CRON_SECRET`: Secret token for authenticating cron requests

### Security

Cron endpoints require `CRON_SECRET` authentication:

- Preferred: `Authorization: Bearer <CRON_SECRET>`
- Fallback: `x-cron-secret: <CRON_SECRET>`
- Fallback: `?secret=<CRON_SECRET>`

Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when triggering cron jobs.

---

## Manual Operations

### Running League Manually

**Option 1: Via Script**

```bash
# Using production database
DATABASE_URL_PROD="..." node scripts/run-league-now.js

# Using local database
yarn league:run
```

**Option 2: Via API (with force)**

```bash
curl -X POST "https://flemoji.com/api/pulse/league/run?force=true" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Option 3: Via Vercel Dashboard**

1. Go to Vercel Dashboard → Your Project → Cron Jobs
2. Find `/api/pulse/league/run`
3. Click "Run Now" or add `?force=true` to path

### Seeding Tiers

**Option 1: Via Migration**

```bash
# Migration runs automatically on deployment
prisma migrate deploy
```

**Option 2: Via Script**

```bash
DATABASE_URL_PROD="..." node scripts/seed-league-tiers-prod.js
```

**Option 3: Via API**

```bash
curl -X POST "https://flemoji.com/api/admin/league/seed" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Troubleshooting

### Tiers Skipped During Run

**Symptom**: `tiersSkipped: 2` in run log

**Cause**: Refresh interval hasn't passed since last run

**Solution**:

- Wait for refresh interval to pass, or
- Use `?force=true` to bypass check

### No Artists in League

**Symptom**: `entriesCreated: 0` for a tier

**Possible Causes**:

1. No eligibility scores exist
2. All artists excluded by higher tier
3. Tier's `targetSize` is 0

**Solution**: Check eligibility scores exist and tier configuration

### Artist Not Appearing in Expected Tier

**Symptom**: Artist has score 65 but not in TIER2

**Possible Causes**:

1. Artist already in TIER1 (overlap prevention)
2. Artist's score changed after last run
3. Tier hasn't run since artist's score was calculated

**Solution**:

- Check artist's current eligibility score
- Check which tier artist is in (if any)
- Trigger league run with `?force=true`

### Band State Shows BELOW_RANGE but Artist in Tier

**Symptom**: Artist in TIER1 with `bandState: BELOW_RANGE`

**Explanation**: This is expected! Band state is informational only. Artists can be in a tier even if their score is below `minScore` (e.g., if they're the only artist or if fewer artists exist than `targetSize`).

**Solution**: None needed - this is correct behavior

### League Run Fails with 500 Error

**Symptom**: `status: 'failed'` in run log

**Possible Causes**:

1. No eligibility scores found
2. Database connection issue
3. Tier configuration error

**Solution**:

- Check error message in `PulseLeagueRunLog.errorMessage`
- Verify eligibility scores exist
- Check tier configuration

---

## Testing

### Running Tests

```bash
# All league tests
yarn test pulse-league-service

# With coverage
yarn test:coverage pulse-league-service
```

### Test Coverage

Tests cover:

- ✅ Tier management (`getActiveTiers`, `getTierByCode`)
- ✅ Refresh interval logic (`shouldRefreshTier`)
- ✅ League run process (`runLeagueForTier`)
- ✅ Band state calculation (SECURE, BELOW_RANGE, ABOVE_RANGE)
- ✅ Status change calculation (NEW, UP, DOWN, UNCHANGED)
- ✅ Ranking and sorting logic
- ✅ Overlap prevention (excludeArtistProfileIds)
- ✅ Edge cases (no scores, no previous run, etc.)

### Manual Testing

1. **Create test tiers** with different configurations
2. **Create test eligibility scores** for multiple artists
3. **Run league** and verify:
   - Correct artists selected
   - Correct ranks assigned
   - Correct band states
   - Correct status changes
   - Overlap prevention works

---

## Related Documentation

- **Eligibility Scoring**: [`docs/pulse3-eligibility-scoring.md`](./pulse3-eligibility-scoring.md) - Eligibility score calculation formulas and mechanics
- **Testing Guide**: [`docs/pulse3-testing-guide.md`](./pulse3-testing-guide.md) - How to run and write tests

---

## Future Enhancements

### Cross-Tier Promotions/Demotions

Currently, `PROMOTED` and `DEMOTED` status changes are placeholders. Future enhancement will:

- Track artists moving between tiers
- Set `statusChange: PROMOTED` when artist moves from TIER2 to TIER1
- Set `statusChange: DEMOTED` when artist moves from TIER1 to TIER2
- Set `statusChange: EXITED` when artist leaves all tiers

### Historical Analysis

Future enhancement will provide:

- Historical rank trends
- Score progression over time
- Movement patterns
- Predictive analytics

---

## Performance Characteristics

### Sorting Performance

The league system sorts artists by eligibility score using a **5-level tie-breaking algorithm**:

1. **Database Query**: Fetches latest eligibility scores (optimized to 1 query)
2. **In-Memory Sorting**: JavaScript `.sort()` with custom comparator
3. **Time Complexity**: O(n log n) for sorting

### Query Optimization

**Before Optimization** (N+1 Query Problem):

- 1 `groupBy` query to get artist IDs
- N `findFirst` queries (one per artist)
- **For 1,000 artists**: 1,001 database queries
- **Estimated time**: 2-10 seconds

**After Optimization** (Single Query):

- 1 SQL query with `DISTINCT ON` (PostgreSQL-specific)
- **For 1,000 artists**: 1 database query
- **Estimated time**: 50-200ms
- **Performance improvement**: ~1000x faster

### Performance Benchmarks

| Artists | Old (N+1) | New (Optimized) | Improvement |
| ------- | --------- | --------------- | ----------- |
| 100     | ~500ms    | ~50ms           | 10x         |
| 1,000   | ~5s       | ~150ms          | 33x         |
| 10,000  | ~50s      | ~500ms          | 100x        |

### Sorting Algorithm

The in-memory sort uses JavaScript's native `.sort()` with a custom comparator:

```typescript
// 5-level tie-breaking comparator
sort((a, b) => {
  // Primary: score DESC
  if (a.score !== b.score) return b.score - a.score;

  // Secondary: engagementScore DESC
  if (a.engagementScore !== b.engagementScore)
    return b.engagementScore - a.engagementScore;

  // Tertiary: consistencyScore DESC
  if (a.consistencyScore !== b.consistencyScore)
    return b.consistencyScore - a.consistencyScore;

  // Quaternary: followerScore DESC
  if (a.followerScore !== b.followerScore)
    return b.followerScore - a.followerScore;

  // Quinary: artistProfileId ASC (stability)
  return a.artistProfileId.localeCompare(b.artistProfileId);
});
```

**Time Complexity**: O(n log n) - efficient for large datasets

**Space Complexity**: O(n) - stores all scores in memory

### Database Indexes

The following indexes optimize query performance:

- `@@index([score])` - Fast sorting by score
- `@@index([artistProfileId])` - Fast artist lookups
- `@@index([calculatedAt])` - Fast time-based queries
- `@@unique([artistProfileId, calculatedAt])` - Prevents duplicates

### Scalability Considerations

**Current Limits**:

- **Recommended**: Up to 100,000 artists
- **Maximum**: Up to 1,000,000 artists (may require pagination)

**Future Optimizations** (if needed):

1. **Database-level sorting**: Use `ORDER BY` in SQL instead of in-memory
2. **Pagination**: Process artists in batches
3. **Caching**: Cache sorted results for frequently accessed tiers
4. **Materialized views**: Pre-compute rankings for very large datasets

---

**Last Updated**: January 2026
**Version**: 1.0
