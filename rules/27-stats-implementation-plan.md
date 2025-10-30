# 27. Stats Implementation Plan

## Current Status Assessment

### ✅ What's Already Built
- [x] Core stats collection library (`src/lib/stats.ts`)
- [x] Event queuing system with batching
- [x] Database schema for all event types
- [x] API endpoints for event collection
- [x] React hooks for easy integration
- [x] Basic analytics dashboard component
- [x] Anonymous user tracking capability

### ❌ What's Missing
- [ ] Time interval aggregation (24h, 7d, 30d, 3m, 1y, all-time)
- [ ] Artist strength scoring algorithm
- [ ] Geographic analytics
- [ ] Performance optimization for large datasets
- [ ] Integration with existing music player
- [ ] Advanced dashboard features

## Implementation Phases

### Phase 1: Time Interval Aggregation (Week 1)

#### 1.1 Database Schema Updates
```sql
-- Add aggregated stats tables
CREATE TABLE DailyStats (
  id TEXT PRIMARY KEY,
  trackId TEXT,
  date DATE,
  totalPlays INTEGER,
  uniquePlays INTEGER,
  totalLikes INTEGER,
  totalShares INTEGER,
  totalDownloads INTEGER,
  avgDuration FLOAT,
  avgCompletionRate FLOAT,
  skipRate FLOAT,
  replayRate FLOAT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE WeeklyStats (
  id TEXT PRIMARY KEY,
  trackId TEXT,
  weekStart DATE,
  totalPlays INTEGER,
  uniquePlays INTEGER,
  -- ... similar fields
);

CREATE TABLE MonthlyStats (
  id TEXT PRIMARY KEY,
  trackId TEXT,
  monthStart DATE,
  totalPlays INTEGER,
  uniquePlays INTEGER,
  -- ... similar fields
);

CREATE TABLE YearlyStats (
  id TEXT PRIMARY KEY,
  trackId TEXT,
  year INTEGER,
  totalPlays INTEGER,
  uniquePlays INTEGER,
  -- ... similar fields
);
```

#### 1.2 Aggregation Jobs
```typescript
// src/lib/aggregation-jobs.ts
export class StatsAggregator {
  async aggregateDaily(date: Date) {
    // Aggregate all events for a specific date
  }
  
  async aggregateWeekly(weekStart: Date) {
    // Aggregate weekly stats from daily stats
  }
  
  async aggregateMonthly(monthStart: Date) {
    // Aggregate monthly stats from weekly stats
  }
  
  async aggregateYearly(year: number) {
    // Aggregate yearly stats from monthly stats
  }
}
```

#### 1.3 Cron Jobs Setup
```typescript
// src/app/api/cron/aggregate-daily/route.ts
export async function GET() {
  // Run daily aggregation
  // Triggered by Vercel Cron or external service
}
```

### Phase 2: Artist Strength Scoring (Week 2)

#### 2.1 Scoring Algorithm Implementation
```typescript
// src/lib/strength-scoring.ts
export class ArtistStrengthCalculator {
  async calculateEngagementScore(artistId: string, timeRange: string) {
    // Calculate engagement metrics
  }
  
  async calculateGrowthScore(artistId: string, timeRange: string) {
    // Calculate growth velocity and trends
  }
  
  async calculateQualityScore(artistId: string, timeRange: string) {
    // Calculate quality indicators
  }
  
  async calculatePotentialScore(artistId: string, timeRange: string) {
    // Calculate viral potential and market position
  }
  
  async calculateOverallScore(artistId: string, timeRange: string) {
    // Combine all scores with weights
  }
}
```

#### 2.2 Score Storage and Caching
```sql
CREATE TABLE ArtistStrengthScore (
  id TEXT PRIMARY KEY,
  artistId TEXT,
  timeRange TEXT, -- '24h', '7d', '30d', etc.
  engagementScore FLOAT,
  growthScore FLOAT,
  qualityScore FLOAT,
  potentialScore FLOAT,
  overallScore FLOAT,
  calculatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 3: Enhanced Analytics API (Week 3)

#### 3.1 Time-based Analytics Endpoints
```typescript
// src/app/api/stats/analytics/time-based/route.ts
export async function GET(request: NextRequest) {
  // Return aggregated stats for specific time ranges
  // Support: 24h, 7d, 30d, 3m, 1y, all-time
}
```

#### 3.2 Artist Strength API
```typescript
// src/app/api/stats/artist/[id]/strength/route.ts
export async function GET(request: NextRequest, { params }) {
  // Return strength score for specific artist
  // Include breakdown by component
  // Support multiple time ranges
}
```

#### 3.3 Geographic Analytics
```typescript
// src/app/api/stats/analytics/geographic/route.ts
export async function GET(request: NextRequest) {
  // Return geographic distribution of plays
  // Country/region breakdown
  // City-level insights for major markets
}
```

### Phase 4: Integration & Optimization (Week 4)

#### 4.1 Music Player Integration
```typescript
// Update existing music player components
// Add stats tracking to:
// - Play/pause events
// - Skip events
// - Completion tracking
// - Replay detection
```

#### 4.2 Performance Optimization
- Database indexing for time-based queries
- Caching layer for frequently accessed data
- Background processing for heavy calculations
- Rate limiting for API endpoints

#### 4.3 Dashboard Enhancements
- Real-time strength score updates
- Interactive time range selectors
- Geographic heatmaps
- Artist comparison tools

## Technical Considerations

### Database Performance
- **Indexing Strategy**: Composite indexes on (trackId, timestamp), (artistId, timeRange)
- **Partitioning**: Consider partitioning large tables by date
- **Archiving**: Move old data to cold storage after 2 years

### API Performance
- **Caching**: Redis cache for frequently accessed scores
- **Pagination**: Handle large result sets efficiently
- **Rate Limiting**: Prevent abuse of analytics endpoints

### Real-time Updates
- **WebSocket Integration**: Real-time score updates
- **Event Streaming**: Process events as they come in
- **Background Jobs**: Heavy calculations in background

## Data Flow Architecture

```
User Action → Stats Library → Event Queue → API Endpoint → Database
     ↓
Background Jobs → Aggregation → Cached Results → Dashboard
     ↓
Strength Calculator → Score Updates → Real-time Display
```

### Event Collection Flow
1. User plays track → `useStats` hook captures event
2. Event queued in browser → Batched every 5 seconds
3. Sent to `/api/stats/events` → Stored in database
4. Background job processes → Updates aggregated tables
5. Strength calculator runs → Updates artist scores
6. Dashboard displays → Real-time analytics

## Next Immediate Steps

### Week 1 Priorities
1. **Run Database Migration** - Add stats tables to existing schema
2. **Create Aggregation Jobs** - Daily/weekly/monthly processing
3. **Update Analytics API** - Support time-based queries
4. **Test Event Collection** - Verify anonymous user tracking

### Week 2 Priorities
1. **Implement Strength Scoring** - Core algorithm and calculation
2. **Create Score Storage** - Database tables and caching
3. **Build Score API** - Endpoints for retrieving scores
4. **Test Scoring System** - Validate algorithm accuracy

### Week 3 Priorities
1. **Integrate with Music Player** - Add tracking to existing components
2. **Enhance Dashboard** - Time-based analytics and strength scores
3. **Geographic Analytics** - Location-based insights
4. **Performance Optimization** - Caching and indexing

## Testing Strategy

### Unit Tests
- Stats collection functions
- Aggregation algorithms
- Strength scoring calculations
- API endpoint responses

### Integration Tests
- End-to-end event flow
- Database operations
- API performance
- Dashboard functionality

### Load Tests
- High-volume event processing
- Concurrent user scenarios
- Database performance under load
- API response times

## Risk Mitigation

### Data Privacy
- **GDPR Compliance**: Right to be forgotten implementation
- **Data Minimization**: Only collect necessary data
- **Anonymization**: Remove personal identifiers
- **Audit Trails**: Track data access and modifications

### Performance Risks
- **Database Load**: Implement read replicas and caching
- **API Overload**: Rate limiting and request queuing
- **Storage Growth**: Data archiving and cleanup strategies
- **Calculation Overhead**: Background processing and optimization

### Business Risks
- **Score Accuracy**: Continuous validation and adjustment
- **User Experience**: Non-blocking implementation
- **Scalability**: Design for growth and expansion
- **Maintenance**: Automated monitoring and alerting
