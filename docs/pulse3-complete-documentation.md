# PULSE³ Complete System Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Eligibility Score Calculation](#eligibility-score-calculation)
4. [League System](#league-system)
5. [Score Calculation Mechanics](#score-calculation-mechanics)
6. [When Scores Are Calculated](#when-scores-are-calculated)
7. [Data Flow](#data-flow)
8. [API Endpoints](#api-endpoints)
9. [Database Schema](#database-schema)
10. [Configuration](#configuration)

---

## Overview

PULSE³ is a comprehensive artist momentum tracking system that:

- Calculates **Eligibility Scores** (0-100) based on audience signals from connected platforms
- Ranks artists into **League Tiers** (e.g., "Top 20", "Watchlist") based on eligibility scores
- Tracks **Movement** (Rising, Falling, Holding) and **Rank Changes** between league runs
- Provides a **public league** for artists to see their ranking and momentum

### Key Concepts

- **Eligibility Score**: A composite score (0-100) that determines an artist's qualification for league tiers
- **League Tier**: A configurable category (e.g., "Top 20", "Watchlist") with defined size, score ranges, and refresh intervals
- **League Run**: An immutable snapshot of tier rankings at a specific point in time
- **League Entry**: An individual artist's ranking within a specific league run, including score, rank, and movement status
- **Band State**: Categorization of an artist's score relative to tier thresholds (`SECURE`, `BELOW_RANGE`, `ABOVE_RANGE`)
- **Status Change**: Movement status compared to previous run (`NEW`, `UP`, `DOWN`, `UNCHANGED`, `PROMOTED`, `DEMOTED`, `EXITED`)

---

## System Architecture

### Components

1. **PulseScoringService** (`src/lib/services/pulse-scoring-service.ts`)
   - Calculates eligibility scores
   - Handles platform-specific calculations (TikTok, future: Spotify, YouTube)
   - Saves scores to database

2. **PulseLeagueService** (`src/lib/services/pulse-league-service.ts`)
   - Manages league tiers and runs
   - Calculates rankings and movement
   - Handles promotions/demotions

3. **Cron Jobs**
   - `cron/recalculate-pulse-eligibility.js`: Recalculates eligibility scores for all artists
   - Vercel Cron: Triggers league runs via `/api/pulse/league/run`

4. **API Endpoints**
   - `/api/pulse/calculate`: Manual score calculation
   - `/api/pulse/league/run`: League run trigger (protected)
   - `/api/pulse/league`: Public league data

---

## Eligibility Score Calculation

### Overall Formula

```
Eligibility Score = (
  Follower Score × 30% +
  Engagement Quality × 40% +
  Consistency Score × 20% +
  Platform Diversity × 10%
)
```

**Final score is clamped to 0-100 and rounded to 2 decimal places.**

### Component Breakdown

#### 1. Follower Score (30% weight)

**Purpose**: Prevents very large accounts from dominating and gives small accounts a fair starting point.

**Calculation**:

- Uses logarithmic scale relative to 100,000 followers = 100 points
- Formula: `log10(follower_count + 1) / log10(100000) * 100`
- Clamped to 0-100

**Examples**:

- 0 followers = 0 points
- 100 followers ≈ 20 points
- 1,000 followers ≈ 40 points
- 10,000 followers ≈ 60 points
- 100,000 followers = 100 points (capped)
- 1,000,000+ followers = 100 points (capped)

**Implementation**: `PulseScoringService.calculateFollowerScore()`

---

#### 2. Engagement Quality Score (40% weight) — **Most Important**

**Purpose**: Measures how engaged your audience is with your content using actual performance data.

**Two-Part Formula**:

- **60% Engagement Rate Component**: Average engagement rate per video
- **40% Average Performance Component**: View count relative to follower count

**Engagement Rate Component (60%)**:

1. For each video (last 20-50 videos):
   - `engagement = likes + comments + shares`
   - `denominator = max(views, followers, 100)`
   - `engagement_rate = engagement / denominator`
2. Average all engagement rates
3. Normalize to 0-100 using tiered interpretation:
   - ≤ 1% → 10-30 points
   - 1%-4% → 30-60 points
   - 4%-10% → 60-85 points
   - ≥ 10% → 85-100 points

**Average Performance Component (40%)**:

1. For each video:
   - `performance_ratio = views / max(followers, 100)`
2. Average all performance ratios
3. Normalize to 0-100:
   - < 0.5× followers → 20-40 points
   - 0.5×-1× → 40-60 points
   - 1×-3× → 60-80 points
   - 3×+ → 80-100 points

**Final Engagement Quality**:

```
engagement_quality = (engagement_rate_score × 0.6) + (performance_score × 0.4)
```

**Implementation**: `PulseScoringService.calculateEngagementQualityScore()`

---

#### 3. Consistency Score (20% weight)

**Purpose**: Measures posting frequency and activity consistency.

**Calculation**:

1. If no videos: return 10 points ("you don't post")
2. If can't read videos: return 40 points ("we can't read your posts properly")
3. Otherwise:
   - Sort videos by `createTime` DESC (newest first)
   - Calculate `span_days = (newest - oldest) / 86400`
   - Stabilize window:
     - If `span_days < 7`: set to 7 days
     - If `span_days > 60`: set to 60 days
   - Calculate `posts_per_day = video_count / span_days`
   - Map to score:
     - < 0.1 posts/day → 10-30 points
     - 0.1-0.5 posts/day → 30-60 points
     - 0.5-1.5 posts/day → 60-90 points
     - > 1.5 posts/day → 90-100 points

**Implementation**: `PulseScoringService.calculateConsistencyScore()`

---

#### 4. Platform Diversity Score (10% weight)

**Purpose**: Rewards artists who connect multiple platforms.

**Calculation**:

- Count connected platforms (TikTok, Spotify, YouTube)
- Simple rule:
  - 1 platform = 50 points
  - 2 platforms = 75 points
  - 3+ platforms = 100 points

**Note**: Currently only TikTok is implemented. Spotify and YouTube will be added in future updates.

**Implementation**: `PulseScoringService.calculatePlatformDiversityScore()`

---

## League System

### Tier Configuration

Each tier is configured with:

- **Code**: Unique identifier (e.g., "TIER1", "TIER2")
- **Name**: Display name (e.g., "Top 20", "Watchlist")
- **Target Size**: Number of artists in tier (e.g., 20, 60)
- **Min Score**: Minimum eligibility score required
- **Max Score**: Maximum eligibility score (null = no max)
- **Refresh Interval Hours**: How often to recalculate (e.g., 24 = daily)
- **Sort Order**: Display order
- **Is Active**: Whether tier is currently active

### League Run Process

1. **Get Latest Eligibility Scores**: Fetch most recent score per artist
2. **Sort Artists**:
   - Primary: Score DESC
   - Secondary: Engagement Score DESC
   - Tertiary: Consistency Score DESC
   - Quaternary: Follower Score DESC
   - Quinary: Artist Profile ID ASC (for stability)
3. **Select Top N**: Take top `targetSize` artists
4. **Calculate Band State**: Compare score to `minScore`/`maxScore`
5. **Compare to Previous Run**: Calculate status change and rank delta
6. **Create League Run**: Atomic transaction creates run + entries

### Ranking Algorithm

**Sorting Order** (for tie-breaking):

1. **Score** (DESC) - Primary sort
2. **Engagement Score** (DESC) - Secondary sort
3. **Consistency Score** (DESC) - Tertiary sort
4. **Follower Score** (DESC) - Quaternary sort
5. **Artist Profile ID** (ASC) - Quinary sort (ensures stable ordering)

### Band State Calculation

```typescript
if (score < minScore) return 'BELOW_RANGE';
if (maxScore !== null && score > maxScore) return 'ABOVE_RANGE';
return 'SECURE';
```

- **SECURE**: Score is within tier's acceptable range
- **BELOW_RANGE**: Score is below minimum (artist is "At Risk")
- **ABOVE_RANGE**: Score exceeds maximum (may be promoted to higher tier)

### Status Change Calculation

Compares current rank to previous run:

- **NEW**: Artist wasn't in previous run
- **UP**: Rank improved (current < previous)
- **DOWN**: Rank declined (current > previous)
- **UNCHANGED**: Rank stayed the same
- **PROMOTED**: Moved from lower tier (future enhancement)
- **DEMOTED**: Moved from higher tier (future enhancement)
- **EXITED**: Was in previous run but not in current (future enhancement)

### Rank Delta

```
rank_delta = previous_rank - current_rank
```

- **Positive**: Moved up (e.g., +2 = moved up 2 places)
- **Negative**: Moved down (e.g., -3 = moved down 3 places)
- **Null**: No previous rank (new entry)

---

## Score Calculation Mechanics

### Platform Contributions

Currently, only **TikTok** is implemented. The system is designed to support multiple platforms:

1. **TikTok** (weight: 1.0)
   - Follower count from user info
   - Video data from `video.list` API (last 20 videos)
   - Engagement metrics (likes, comments, shares, views)

2. **Spotify** (future, weight: 0.8)
   - Monthly listeners
   - Track performance
   - Playlist placements

3. **YouTube** (future, weight: 0.7)
   - Subscriber count
   - Video views and engagement
   - Channel performance

### Weighted Average

When multiple platforms are connected, component scores are combined using weighted averages:

```
combined_component = Σ(platform_component × platform_weight) / Σ(platform_weight)
```

### Data Sources

**TikTok Data**:

- Stored in `PulsePlatformData` table
- Fetched via TikTok API:
  - User info (follower count, video count, etc.)
  - Video list (last 20 videos with engagement metrics)
- Snapshot stored with `fetchedAt` timestamp

**Score Calculation**:

- Uses most recent `PulsePlatformData` snapshot
- Extracts videos from snapshot's `data.videos` array
- Calculates components from video metrics

---

## When Scores Are Calculated

### Eligibility Score Calculation

**Triggers**:

1. **Manual Calculation** (via API):
   - Endpoint: `POST /api/pulse/calculate`
   - Triggered by: User clicking "Calculate Score" in dashboard
   - Process:
     - Fetches latest TikTok data
     - Calculates eligibility score
     - Saves to database
     - Updates monitoring status

2. **Scheduled Recalculation** (via Cron):
   - Script: `cron/recalculate-pulse-eligibility.js`
   - Frequency: Daily (configurable)
   - Process:
     - Finds all artists with TikTok connections
     - For each artist:
       - Refreshes TikTok snapshot
       - Calculates eligibility score
       - Saves to database
     - Rebuilds Top 100 monitoring list

**Note**: Eligibility scores are **not automatically recalculated** when TikTok data changes. They must be explicitly triggered.

### League Run Calculation

**Triggers**:

1. **Scheduled Runs** (via Vercel Cron):
   - Endpoint: `POST /api/pulse/league/run`
   - Schedule: Every 10 minutes (configurable in `vercel.json`)
   - Process:
     - Checks each tier's `refreshIntervalHours`
     - Runs tier if `hoursSinceLastRun >= refreshIntervalHours`
     - Creates new league run with current eligibility scores
     - Calculates movement and status changes

2. **Manual Runs**:
   - Script: `scripts/run-league-now.js`
   - Command: `yarn league:run`
   - Process: Same as scheduled runs, but runs immediately for all tiers

**Important**: League runs use the **latest eligibility scores** at the time of the run. They don't recalculate eligibility scores—they use existing scores.

### Timing Considerations

- **Eligibility scores** are calculated independently and stored with timestamps
- **League runs** are snapshots that reference eligibility scores at a specific point in time
- **Movement calculations** compare current run to previous run
- **Score deltas** compare eligibility scores at run time vs. previous run time

---

## Data Flow

### Eligibility Score Calculation Flow

```
1. User connects TikTok
   ↓
2. TikTok data fetched and stored in PulsePlatformData
   ↓
3. User triggers calculation OR cron runs
   ↓
4. PulseScoringService.calculateEligibilityScore()
   ├─ Get TikTok platform data
   ├─ Calculate Follower Score
   ├─ Calculate Engagement Quality Score
   ├─ Calculate Consistency Score
   ├─ Calculate Platform Diversity Score
   └─ Combine with weights (30%, 40%, 20%, 10%)
   ↓
5. Save to PulseEligibilityScore table
   ├─ score (0-100)
   ├─ followerScore
   ├─ engagementScore
   ├─ consistencyScore
   ├─ platformDiversityScore
   ├─ rank (calculated after all scores saved)
   └─ calculatedAt (timestamp)
```

### League Run Flow

```
1. Cron triggers /api/pulse/league/run
   ↓
2. For each active tier:
   ├─ Check if refresh is needed (refreshIntervalHours)
   ├─ If yes:
   │  ├─ Get latest eligibility scores per artist
   │  ├─ Sort by score DESC (with tie-breakers)
   │  ├─ Select top targetSize artists
   │  ├─ Get previous run entries
   │  ├─ Calculate band state, status change, rank delta
   │  └─ Create LeagueRun + LeagueEntry records
   └─ If no: Skip tier
   ↓
3. Process promotions/demotions (if daily run)
   ↓
4. Return results
```

### Score Comparison Flow

When displaying league data:

```
1. Get latest league run for tier
   ↓
2. Get previous league run for tier
   ↓
3. For each entry in latest run:
   ├─ Get eligibility score at run time
   ├─ Get eligibility score at previous run time
   ├─ Calculate deltas:
   │  ├─ scoreDelta = current - previous
   │  ├─ followerScoreDelta
   │  ├─ engagementScoreDelta
   │  ├─ consistencyScoreDelta
   │  └─ platformDiversityScoreDelta
   └─ Return with deltas
```

---

## API Endpoints

### POST /api/pulse/calculate

**Purpose**: Calculate eligibility score for current user's artist profile

**Authentication**: Required (session)

**Request Body**: None

**Response**:

```json
{
  "success": true,
  "eligibilityScore": 75.5,
  "eligibilityRank": 42,
  "eligibilityComponents": {
    "followerScore": 65.2,
    "engagementScore": 80.1,
    "consistencyScore": 70.5,
    "platformDiversityScore": 50.0
  },
  "momentumScore": null,
  "momentumComponents": null,
  "position": null,
  "isActivelyMonitored": true
}
```

**Process**:

1. Fetches latest TikTok data
2. Calculates eligibility score
3. Saves to database
4. Updates monitoring status

---

### POST /api/pulse/league/run

**Purpose**: Trigger league run for all active tiers

**Authentication**: CRON_SECRET (header `x-cron-secret` or query param `secret`)

**Request Body**: None

**Response**:

```json
{
  "success": true,
  "message": "Processed 2 tier(s)",
  "tiersProcessed": 2,
  "entriesCreated": 81,
  "results": [
    {
      "tierCode": "TIER1",
      "tierName": "Top 20",
      "runId": "cmk...",
      "entriesCreated": 20
    },
    {
      "tierCode": "TIER2",
      "tierName": "Watchlist",
      "runId": "cmk...",
      "entriesCreated": 61
    }
  ]
}
```

**Process**:

1. Verifies CRON_SECRET
2. Gets all active tiers
3. For each tier that needs refresh:
   - Runs league calculation
   - Creates run + entries
4. Processes promotions/demotions
5. Returns results

---

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
      "run_at": "2024-01-20T12:00:00Z",
      "previous_run_at": "2024-01-19T12:00:00Z",
      "entries": [
        {
          "artist_id": "...",
          "artist_name": "Artist Name",
          "artist_slug": "artist-slug",
          "artist_image": "image/...",
          "rank": 1,
          "score": 85.5,
          "band_state": "SECURE",
          "is_at_risk": false,
          "status_change": "UP",
          "previous_rank": 3,
          "rank_delta": 2,
          "scoreDelta": 2.5,
          "followerScore": 70.0,
          "followerScoreDelta": 1.0,
          "engagementScore": 90.0,
          "engagementScoreDelta": 2.0,
          "consistencyScore": 80.0,
          "consistencyScoreDelta": 0.5,
          "platformDiversityScore": 50.0,
          "platformDiversityScoreDelta": 0.0,
          "run_score": 85.5,
          "run_followerScore": 70.0,
          "run_engagementScore": 90.0,
          "run_consistencyScore": 80.0,
          "run_platformDiversityScore": 50.0,
          "previous_run_score": 83.0,
          "previous_run_followerScore": 69.0,
          "previous_run_engagementScore": 88.0,
          "previous_run_consistencyScore": 79.5,
          "previous_run_platformDiversityScore": 50.0,
          "previous_run_rank": 3
        }
      ]
    }
  ]
}
```

**Process**:

1. Gets all active tiers
2. For each tier:
   - Gets latest run
   - Gets previous run
   - Gets entries from latest run
   - For each entry:
     - Gets eligibility score at run time
     - Gets eligibility score at previous run time
     - Calculates deltas
   - Returns with comparison data

---

## Database Schema

### PulseEligibilityScore

Stores eligibility scores with component breakdowns:

```prisma
model PulseEligibilityScore {
  id                     String   @id @default(cuid())
  artistProfileId        String
  score                  Float    // 0-100
  followerScore          Float?   // 0-100 component
  engagementScore        Float?   // 0-100 component
  consistencyScore       Float?   // 0-100 component
  platformDiversityScore Float?   // 0-100 component
  rank                   Int?     // Rank among all artists
  calculatedAt           DateTime @default(now())
  updatedAt              DateTime @updatedAt
}
```

**Indexes**:

- `score` (for ranking)
- `rank` (for ranking)
- `artistProfileId` (for artist lookups)
- `calculatedAt` (for time-based queries)

**Unique Constraint**: `(artistProfileId, calculatedAt)` - allows multiple scores per artist over time

---

### PulsePlatformData

Stores platform-specific data snapshots:

```prisma
model PulsePlatformData {
  id              String   @id @default(cuid())
  artistProfileId String
  platform        String   // 'tiktok' | 'spotify' | 'youtube'
  data            Json     // Platform-specific data (videos, stats, etc.)
  fetchedAt       DateTime @default(now())
}
```

**Usage**: Stores TikTok video data, follower counts, etc. Used as input for score calculations.

---

### LeagueTier

Configures league tiers:

```prisma
model LeagueTier {
  id                  String   @id @default(cuid())
  code                String   @unique
  name                String
  targetSize          Int
  minScore            Float
  maxScore            Float?
  refreshIntervalHours Int
  sortOrder           Int
  isActive            Boolean  @default(true)
}
```

---

### LeagueRun

Immutable snapshot of a tier ranking at a point in time:

```prisma
model LeagueRun {
  id       String        @id @default(cuid())
  tierId   String
  runType  LeagueRunType // 'SCHEDULED' | 'MANUAL'
  runAt    DateTime      @default(now())
  entries  LeagueEntry[]
}
```

---

### LeagueEntry

Individual artist ranking within a league run:

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
}
```

---

## Configuration

### Environment Variables

- `CRON_SECRET`: Secret token for protecting league run endpoint

### Vercel Cron Configuration

`vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/pulse/league/run",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

**Schedule**: Every 10 minutes (checks if tiers need refresh based on `refreshIntervalHours`)

### Tier Configuration

Tiers are configured in the database via admin interface or seed script:

```javascript
// Example tier configuration
{
  code: "TIER1",
  name: "Top 20",
  targetSize: 20,
  minScore: 0,
  maxScore: null,
  refreshIntervalHours: 24,
  sortOrder: 1,
  isActive: true
}
```

---

## Future Enhancements

### Momentum Score

Currently not implemented. Will calculate:

- Growth Velocity
- Engagement Acceleration
- Viral Potential
- Cross-Platform Momentum

### Multi-Platform Support

- Spotify integration
- YouTube integration
- Weighted platform contributions

### Cross-Tier Promotions/Demotions

Currently, promotions/demotions are tracked within tiers. Future enhancement will track artists moving between tiers.

---

## Testing

See test files:

- `src/lib/services/__tests__/pulse-scoring-service.test.ts`
- `src/lib/services/__tests__/pulse-league-service.test.ts`
