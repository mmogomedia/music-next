# PULSE³ Eligibility Scoring System

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Eligibility Score Calculation](#eligibility-score-calculation)
4. [Score Calculation Mechanics](#score-calculation-mechanics)
5. [When Scores Are Calculated](#when-scores-are-calculated)
6. [Data Flow](#data-flow)
7. [API Endpoints](#api-endpoints)
8. [Database Schema](#database-schema)
9. [Configuration](#configuration)
10. [Related Documentation](#related-documentation)

---

## Overview

PULSE³ calculates **Eligibility Scores** (0-100) for artists based on audience signals from connected platforms. These scores determine an artist's qualification for league tiers and ranking.

### Key Concepts

- **Eligibility Score**: A composite score (0-100) that determines an artist's qualification for league tiers
- **Component Scores**: Individual scores for Follower, Engagement, Consistency, and Platform Diversity
- **Platform Data**: Snapshot data from connected platforms (TikTok, future: Spotify, YouTube)
- **Score Calculation**: Process of combining component scores with weighted formula

**For league system documentation, see: [`docs/pulse3-league-system.md`](./pulse3-league-system.md)**

---

## System Architecture

### Components

1. **PulseScoringService** (`src/lib/services/pulse-scoring-service.ts`)
   - Calculates eligibility scores
   - Handles platform-specific calculations (TikTok, future: Spotify, YouTube)
   - Saves scores to database

2. **TikTokService** (`src/lib/services/tiktok-service.ts`)
   - Fetches TikTok platform data
   - Handles OAuth and API interactions

3. **Cron Jobs**
   - Vercel Cron: Triggers eligibility recalculation via `/api/pulse/eligibility/recalculate` (daily at midnight UTC)

4. **API Endpoints**
   - `/api/pulse/calculate`: Manual score calculation
   - `/api/pulse/eligibility/recalculate`: Scheduled recalculation (protected)

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
   - Endpoint: `POST /api/pulse/eligibility/recalculate`
   - Frequency: Daily at midnight UTC
   - Process:
     - Finds all artists with TikTok connections in target tiers (TIER1/TIER2)
     - For each artist:
       - Refreshes TikTok snapshot
       - Calculates eligibility score
       - Saves to database
     - Rebuilds Top 100 monitoring list

**Note**: Eligibility scores are **not automatically recalculated** when TikTok data changes. They must be explicitly triggered.

### Timing Considerations

- **Eligibility scores** are calculated independently and stored with timestamps
- **League runs** use the latest eligibility scores at the time of the run
- **Score deltas** compare eligibility scores at different points in time

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
  "isActivelyMonitored": true
}
```

**Process**:

1. Fetches latest TikTok data
2. Calculates eligibility score
3. Saves to database
4. Updates monitoring status

---

### POST /api/pulse/eligibility/recalculate

**Purpose**: Recalculate eligibility scores for all artists in target tiers (TIER1/TIER2)

**Authentication**: CRON_SECRET or ADMIN role

**Headers**:

- `Authorization: Bearer <CRON_SECRET>` (preferred)
- `x-cron-secret: <CRON_SECRET>` (fallback)
- Query param: `?secret=<CRON_SECRET>` (fallback)

**Request Body**: None

**Response**:

```json
{
  "success": true,
  "artistsProcessed": 120,
  "successCount": 115,
  "errorCount": 5,
  "top100Updated": 100,
  "logId": "cmk..."
}
```

**Process**:

1. Verifies CRON_SECRET or admin session
2. Gets active tiers (TIER1, TIER2)
3. Finds artists with TikTok connections in target tiers
4. For each artist:
   - Refreshes TikTok snapshot
   - Calculates eligibility score
   - Saves to database
5. Rebuilds Top 100 monitoring list
6. Returns summary

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

## Configuration

### Environment Variables

- `CRON_SECRET`: Secret token for protecting recalculation endpoint
- `TIKTOK_CLIENT_KEY`: TikTok OAuth client key
- `TIKTOK_CLIENT_SECRET`: TikTok OAuth client secret
- `TIKTOK_REDIRECT_URI`: TikTok OAuth redirect URI

### Vercel Cron Configuration

**File**: `vercel.ts` (TypeScript configuration)

```typescript
{
  crons: [
    {
      path: '/api/pulse/eligibility/recalculate',
      schedule: '0 0 * * *', // Daily at midnight UTC
    },
  ],
}
```

**Schedule**:

- **Eligibility Recalculation**: Daily at midnight UTC

---

## Related Documentation

For more detailed information on specific topics:

- **League System**: [`docs/pulse3-league-system.md`](./pulse3-league-system.md) - Comprehensive league system documentation
- **Testing Guide**: [`docs/pulse3-testing-guide.md`](./pulse3-testing-guide.md) - How to run and write tests
- **Quick Reference**: [`docs/pulse3-summary.md`](./pulse3-summary.md) - Quick reference guide

---

**Last Updated**: January 2026
**Version**: 1.0
