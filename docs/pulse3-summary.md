# PULSE³ System Summary

## Quick Reference

### Documentation Files

1. **`docs/pulse3-eligibility-scoring.md`** - Eligibility scoring system documentation
   - Eligibility score calculation formulas
   - Score calculation mechanics
   - API endpoints for scoring
   - Database schema for scores
   - Configuration

2. **`docs/pulse3-testing-guide.md`** - Testing guide
   - How to run tests
   - Test file descriptions
   - Test data patterns
   - Manual testing procedures

### Test Files

1. **`src/lib/services/__tests__/pulse-scoring-service.test.ts`**
   - Tests eligibility score calculations
   - Tests component scoring (Follower, Engagement, Consistency, Platform Diversity)
   - Tests overall score calculation with weights
   - Tests edge cases and error handling

2. **`src/lib/services/__tests__/pulse-league-service.test.ts`**
   - Tests league tier management
   - Tests league run process
   - Tests band state calculation
   - Tests status change calculation (NEW, UP, DOWN, UNCHANGED)
   - Tests ranking and sorting logic

## Key Formulas

### Eligibility Score

```
Eligibility Score = (
  Follower Score × 30% +
  Engagement Quality × 40% +
  Consistency Score × 20% +
  Platform Diversity × 10%
)
```

### Component Calculations

**Follower Score**: `log10(follower_count + 1) / log10(100000) * 100`

**Engagement Quality**:

- Engagement Rate (60%): `(likes + comments + shares) / max(views, followers, 100)`
- Performance (40%): `views / max(followers, 100)`

**Consistency Score**: `posts_per_day` mapped to 0-100 scale

**Platform Diversity**: 1 platform = 50, 2 = 75, 3+ = 100

## When Scores Are Calculated

1. **Eligibility Scores**:
   - Manual: `POST /api/pulse/calculate`
   - Scheduled: `cron/recalculate-pulse-eligibility.js` (daily)

2. **League Runs**:
   - Scheduled: Vercel Cron → `POST /api/pulse/league/run` (daily at 1 AM UTC, after eligibility recalculation)
   - Manual: `yarn league:run`

## Running Tests

```bash
# All PULSE tests
yarn test pulse

# Specific test files
yarn test pulse-scoring-service
yarn test pulse-league-service

# With coverage
yarn test:coverage pulse
```

## Key Services

- **`PulseScoringService`**: Eligibility score calculation
- **`PulseLeagueService`**: League tier management and runs
- **`TikTokService`**: TikTok API integration

## Database Models

- `PulseEligibilityScore`: Eligibility scores with components
- `PulsePlatformData`: Platform data snapshots
- `LeagueTier`: Tier configuration
- `LeagueRun`: Immutable run snapshots
- `LeagueEntry`: Individual artist rankings

## API Endpoints

- `POST /api/pulse/calculate` - Calculate eligibility score
- `POST /api/pulse/league/run` - Trigger league run (protected)
- `GET /api/pulse/league` - Get public league data
