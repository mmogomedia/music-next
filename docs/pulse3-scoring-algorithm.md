# PULSE³ Eligibility Score — Developer Implementation Documentation

## Overview

PULSE³ calculates two main scores for artists:

1. **Eligibility Score** (0-100) - Determines if an artist qualifies for active monitoring (Top 100)
2. **Momentum Score** (0-100) - Calculated only for Top 100 artists, determines chart position (1-100)

## Eligibility Score Calculation

The Eligibility Score determines whether an artist is ready to be actively monitored by PULSE³. Only the top 100 artists by eligibility score get actively monitored.

### Overall Formula

Each component produces a 0–100 subscore, then gets multiplied by its weight:

```
Eligibility Score = (
  Follower Score × 25% +
  Engagement Quality × 30% +
  Consistency Score × 20% +
  Trend Score × 15% +
  Platform Diversity × 10%
)
```

Final eligibility score is clamped to 0–100.

---

## Component Breakdown

### 1. Follower Score (30% weight)

**Purpose:** Prevents very large accounts from dominating and gives small accounts a fair starting point.

**Input (Platform-Specific):**

- TikTok: `follower_count` from profile stats
- Spotify: `monthly_listeners` (when implemented)
- YouTube: `subscriber_count` (when implemented)

**Current Implementation:** TikTok only

**Calculation:**

- Uses a logarithmic scale relative to a reference max of 100,000 followers = 100 points
- Formula:
  ```
  raw = log10(follower_count + 1) / log10(100000)
  subscore = clamp(raw * 100, 0, 100)
  ```

**Examples:**

- 100 followers ≈ 20 points
- 1,000 followers ≈ 40 points
- 10,000 followers ≈ 60 points
- 100,000 followers = 100 points
- 1,000,000+ followers = 100 points (capped)

---

### 2. Engagement Quality Score (40% weight) — **Most Important**

**Purpose:** Measures how engaged your audience is with your content using actual performance data.

**Required Inputs (Platform-Specific):**

- **TikTok:** From `video.list` - For each video (use last 20 videos):
  - `view_count`
  - `like_count`
  - `comment_count`
  - `share_count`
  - `create_time`

**Two-part formula:**

```
Engagement Quality =
  (Engagement Rate Component × 60%) +
  (Average Performance Component × 40%)
```

#### A. Engagement Rate Component (60%)

For each video:

```
engagement = (likes + comments + shares)
denominator = max(view_count, follower_count, 100)
engagement_rate = engagement / denominator
```

Then:

- Average `engagement_rate` across all videos
- Normalize into 0–100 using tiered interpretation:
  - ≤ 1% → 10–30
  - 1%–4% → 30–60
  - 4%–10% → 60–85
  - ≥ 10% → 85–100

#### B. Average Performance Component (40%)

For each video:

```
performance_ratio = view_count / max(follower_count, 100)
```

Average that across all videos.

Normalize into 0–100:

- < 0.5× followers → 20–40
- 0.5×–1× → 40–60
- 1×–3× → 60–80
- 3×+ → 80–100

**Final Engagement Quality Score:**

```
engagement_quality =
  engagement_rate_score * 0.60 +
  performance_score * 0.40
```

Clamp to 0–100.

---

### 3. Consistency Score (20% weight)

**Purpose:** Rewards reliable posting without making spam uploading overpowered.

**Required Input:**

- `create_time` for all recent videos (from `video.list`)

**Calculation Steps:**

1. Count videos posted in the last 30 days: `videos_30d`
2. Calculate: `videos_per_day = videos_30d / 30`
3. Map `videos_per_day` into these bands:

| Posting Rate                  | Score Range     |
| ----------------------------- | --------------- |
| < 0.1/day (≤3 per month)      | 0–30            |
| 0.1–0.5/day (3–15 per month)  | 30–60           |
| 0.5–1.5/day (15–45 per month) | 60–90           |
| > 1.5/day                     | 90–100 (capped) |

---

### 4. Platform Diversity Score (10% weight)

**Note:** Trend Score has been removed from Eligibility calculation. Trend is now calculated as part of the Momentum Score, which is only computed for Top 100 artists.

**Purpose:** Gives cross-platform creators a small advantage without excluding TikTok-only artists.

**Inputs:**

- From connected accounts in your system:
  - TikTok (required)
  - Spotify (optional)
  - YouTube (optional)

**Rule:**

- 1 platform => 50
- 2 platforms => 75
- 3+ => 100

---

## Final Score Calculation

```
eligibility =
  follower_score * 0.30 +
  engagement_quality * 0.40 +
  consistency_score * 0.20 +
  platform_diversity_score * 0.10

eligibility = clamp(eligibility, 0, 100)
```

**Note:** Trend Score is no longer part of Eligibility. Trend metrics are now calculated as part of the Momentum Score, which is only computed for artists in the Top 100.

---

## Developer Notes (Important)

### Data Storage Rules

Store:

- TikTok profile snapshot (from `user.info.basic` and `user.info.stats`)
- Recent videos list (up to 20 videos from `video.list`)
- Snapshot timestamps (for future Momentum calculations, not required for Eligibility)

### Required Endpoints

- `user.info.basic` - Basic profile info
- `user.info.stats` - Follower, following, likes, video counts
- `video.list` - List of user's videos with engagement metrics

### When to Recalc Eligibility

- On initial connection
- On user clicking "Refresh" / "Recalculate"
- Optionally: nightly snapshots for top monitored artists only

**Note:** Eligibility is now a snapshot-based readiness score. It does not require historical data. Historical snapshots are still stored for future Momentum Score calculations, but are not used in Eligibility.

---

## Top 100 Selection

After calculating eligibility scores for all artists:

1. All scores are ranked from highest to lowest
2. Top 100 artists by eligibility score are selected
3. These artists get `isActivelyMonitored = true`
4. Only monitored artists get momentum scores calculated

---

## Momentum Score Calculation

The Momentum Score is calculated **only for artists in the Top 100**. It determines their position (1-100) on the public Top 100 chart.

### Formula

```
Momentum Score = (
  Growth Velocity × 35% +
  Engagement Acceleration × 30% +
  Viral Potential × 25% +
  Cross-Platform Momentum × 10%
)
```

### Component Breakdown

#### 1. Growth Velocity (35% weight) — **Most Important**

**Purpose:** Measures how quickly you're gaining followers

**Calculation:**

- Daily Growth Rate: `(totalGrowthRate / daysBetween)`
- Formula: `dailyGrowthRate × 5000` (capped at 100)
- Examples:
  - 0% daily growth = 0 points
  - 1% daily growth = 50 points
  - 5% daily growth = 80 points
  - 10%+ daily growth = 100 points

#### 2. Engagement Acceleration (30% weight)

**Purpose:** Measures increasing engagement rates over time

**Calculation:**

- Compares recent engagement rate vs older engagement rate
- Acceleration = `(recentRate - olderRate) / timeSpan`
- Normalized into 0-100 score

#### 3. Viral Potential (25% weight)

**Purpose:** Measures potential for content to go viral

**Calculation:**

- Based on recent video performance spikes
- Analyzes view-to-follower ratios
- Identifies content with exceptional reach

#### 4. Cross-Platform Momentum (10% weight)

**Purpose:** Measures growth across multiple platforms

**Calculation:**

- Only applies if multiple platforms are connected
- Compares growth rates across TikTok, Spotify, YouTube
- Rewards consistent growth across platforms

### Position Calculation

Position (1-100) is determined by ranking all momentum scores:

- Position 1 = Highest momentum score
- Position 100 = Lowest momentum score (but still in Top 100)

---

## Score Interpretation

### Eligibility Score Ranges:

- **90-100:** Exceptional profile, definitely in Top 100
- **80-89:** Strong profile, likely in Top 100
- **70-79:** Good profile, may be in Top 100
- **60-69:** Decent profile, borderline for Top 100
- **50-59:** Developing profile, needs improvement
- **Below 50:** Early stage, significant growth needed

### Momentum Score Ranges:

- **90-100:** Exceptional momentum, top chart positions (1-10)
- **80-89:** Strong momentum, high chart positions (11-30)
- **70-79:** Good momentum, mid chart positions (31-60)
- **60-69:** Decent momentum, lower chart positions (61-90)
- **Below 60:** Lower momentum, bottom chart positions (91-100)

---

## Improving Your Scores

### To Improve Eligibility Score:

1. **Grow Followers** (25% weight)
   - Post consistently
   - Use trending sounds/hashtags
   - Engage with your audience

2. **Increase Engagement Quality** (30% weight) — **Most Impact**
   - Create content that encourages likes/comments/shares
   - Respond to comments
   - Post at optimal times
   - Use engaging captions
   - Focus on videos that perform well relative to your follower count

3. **Post Consistently** (20% weight)
   - Aim for 0.5-1.5 videos per day (15-45 per month)
   - Maintain a regular posting schedule

4. **Show Growth** (15% weight)
   - Focus on steady follower growth
   - Analyze what content performs best
   - Build momentum over time

5. **Connect More Platforms** (10% weight)
   - Connect Spotify (coming soon)
   - Connect YouTube (coming soon)

### To Improve Momentum Score (if in Top 100):

1. **Accelerate Growth** (35% weight)
   - Create viral content
   - Leverage trending topics
   - Engage with trending sounds

2. **Increase Engagement** (30% weight)
   - Create content that drives interaction
   - Respond to comments quickly
   - Build community

3. **Create Viral Content** (25% weight)
   - Experiment with different formats
   - Analyze what works
   - Replicate successful patterns

4. **Grow Across Platforms** (10% weight)
   - Maintain presence on multiple platforms
   - Cross-promote content

---

## Implementation Details

### Data Requirements

For Eligibility Score calculation:

- Current follower count (from `user.info.stats`)
- Video list with engagement metrics (from `video.list`)
- Historical platform data snapshots (for trend)
- Connected platform information (for diversity)

### Error Handling

- If video list is unavailable, engagement score defaults to 0
- If baseline < 100 followers, trend score defaults to 50 (neutral)
- If no historical data, consistency and trend use neutral/default values
- All scores are clamped to 0-100 range

### Performance Considerations

- Video list processing limited to last 50 videos
- Historical data limited to last 30 snapshots
- Calculations cached where possible
- Batch processing for multiple artists
