# PULSE³ Testing Guide

## Running Tests

```bash
# Run all PULSE tests
yarn test pulse

# Run specific test file
yarn test pulse-scoring-service
yarn test pulse-league-service

# Run with coverage
yarn test:coverage pulse
```

## Test Files

### 1. `pulse-scoring-service.test.ts`

Tests for eligibility score calculations:

- **Follower Score Calculation**
  - Zero followers → 0 points
  - 100 followers → ~40 points
  - 100,000 followers → 100 points (capped)
  - Logarithmic scale verification

- **Engagement Quality Score Calculation**
  - High engagement rate (10%+) → 80-100 points
  - Low engagement rate (<1%) → 10-30 points
  - Handles videos with no views gracefully

- **Consistency Score Calculation**
  - Frequent posting (2+ posts/day) → 90-100 points
  - Infrequent posting (<0.1 posts/day) → 10-30 points
  - No videos → 10 points

- **Platform Diversity Score Calculation**
  - 1 platform → 50 points
  - 2 platforms → 75 points
  - 3+ platforms → 100 points

- **Overall Score Calculation**
  - Correct weight application (30%, 40%, 20%, 10%)
  - Score clamping to 0-100
  - Rounding to 2 decimal places

### 2. `pulse-league-service.test.ts`

Tests for league management:

- **Tier Management**
  - Get active tiers
  - Check refresh intervals
  - Tier configuration

- **League Run Process**
  - Create league run with top N artists
  - Exclude artists from excluded list
  - Sort by score with tie-breakers

- **Band State Calculation**
  - BELOW_RANGE when score < minScore
  - ABOVE_RANGE when score > maxScore
  - SECURE when score within range

- **Status Change Calculation**
  - NEW for artists not in previous run
  - UP when rank improved
  - DOWN when rank declined
  - UNCHANGED when rank stayed same

### 3. `route.test.ts` (API Endpoints)

Tests for API endpoints:

- **POST /api/pulse/calculate**
  - Authentication required
  - Artist profile validation
  - Score calculation and saving
  - Error handling

## Test Data Setup

### Mock Data Patterns

```typescript
// Mock artist profile
const mockArtistProfile = {
  id: 'artist-1',
  userId: 'user-1',
  user: { id: 'user-1' },
};

// Mock TikTok connection
const mockTikTokConnection = {
  userInfo: {
    followerCount: 10000,
    videoCount: 50,
  },
  tokens: {
    accessToken: 'token',
    scope: ['video.list'],
    openId: 'openid',
  },
};

// Mock videos
const mockVideos = [
  {
    createTime: Date.now() / 1000 - 86400,
    viewCount: 5000,
    likeCount: 500,
    commentCount: 50,
    shareCount: 25,
  },
];
```

## Testing Calculation Formulas

### Follower Score

```typescript
// Formula: log10(follower_count + 1) / log10(100000) * 100

// Test cases:
// 0 followers → 0
// 100 followers → ~40
// 1,000 followers → ~60
// 10,000 followers → ~80
// 100,000 followers → 100
```

### Engagement Quality Score

```typescript
// Engagement Rate Component (60%):
// engagement_rate = (likes + comments + shares) / max(views, followers, 100)
// Normalized: ≤1%→10-30, 1-4%→30-60, 4-10%→60-85, ≥10%→85-100

// Performance Component (40%):
// performance_ratio = views / max(followers, 100)
// Normalized: <0.5×→20-40, 0.5-1×→40-60, 1-3×→60-80, 3×+→80-100

// Final: (engagement_rate_score × 0.6) + (performance_score × 0.4)
```

### Consistency Score

```typescript
// posts_per_day = video_count / span_days
// Normalized: <0.1→10-30, 0.1-0.5→30-60, 0.5-1.5→60-90, >1.5→90-100
```

## Integration Testing

For integration tests, you may want to:

1. Set up a test database
2. Create test artist profiles
3. Create test TikTok connections
4. Run actual calculations
5. Verify results match expected formulas

## Manual Testing

### Test Eligibility Score Calculation

1. Connect TikTok account
2. Call `POST /api/pulse/calculate`
3. Verify score components match expected values
4. Check database for saved score

### Test League Run

1. Ensure eligibility scores exist
2. Run `yarn league:run`
3. Verify league entries created
4. Check movement indicators
5. Verify score deltas

### Test Score Updates

1. Run simulation: `yarn league:simulate`
2. Run league: `yarn league:run`
3. Verify movement indicators show changes
4. Check score deltas in API response
