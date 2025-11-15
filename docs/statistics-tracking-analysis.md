# Statistics Tracking System - Complete Analysis

## Overview

This document provides a comprehensive analysis of the statistics tracking system from frontend to backend to database, including event collection, processing, storage, and analytics.

---

## 📊 Architecture Flow

```
Frontend Component
    ↓
useStats Hook (React Hook)
    ↓
StatsCollector (Client-side Queue)
    ↓
POST /api/stats/events (Batch API)
    ↓
Raw Event Tables (PlayEvent, LikeEvent, etc.)
    ↓
Track Counters (playCount, likeCount, etc.)
    ↓
Aggregated Stats Tables (DailyStats, WeeklyStats, etc.)
    ↓
Analytics APIs (/api/stats/analytics, /api/dashboard/stats)
```

---

## 🎯 Frontend Tracking System

### 1. React Hook: `useStats` (`src/hooks/useStats.ts`)

**Purpose**: Provides React components with functions to track user interactions.

**Key Features**:

- Generates unique session IDs per component instance
- Tracks play start/end with duration calculation
- Tracks likes, saves, shares, and downloads
- Integrates with NextAuth for user identification
- Supports source tracking (playlist, landing, search, etc.)

**Functions Provided**:

- `trackPlayStart(trackId, source?, playlistId?)` - Records when playback begins
- `trackPlayEnd(trackId, duration?, skipped?)` - Records completion (only if ≥20 seconds)
- `trackLike(trackId, action)` - Records like/unlike actions
- `trackSave(trackId, playlistId, action)` - Records save/unsave to playlists
- `trackShare(trackId, platform)` - Records sharing events
- `trackDownload(trackId)` - Records download events

**Session Management**:

- Each hook instance generates a unique session ID: `session_${timestamp}_${random}`
- Session persists for component lifecycle
- Used to identify unique users/listeners

**Play Duration Tracking**:

- Only records events if user played for at least 20 seconds (meaningful engagement)
- Calculates completion rate: `(playDuration / trackDuration) * 100`
- Tracks skipped status (duration < 20 seconds)

### 2. Client-Side Stats Collector (`src/lib/stats.ts`)

**Purpose**: Non-blocking event queue that batches and sends events to the server.

**Key Features**:

- Batched event processing (50 events per batch)
- Auto-flush every 5 seconds
- Queue overflow protection (max 1000 events)
- Page unload handling with `sendBeacon` API
- Event retry on failure (re-queues recent events)

**Event Types**:

```typescript
- PlayEvent: trackId, userId, sessionId, source, playlistId, duration, completionRate, skipped, replayed
- LikeEvent: trackId, userId, sessionId, source, action (like/unlike)
- SaveEvent: trackId, userId, sessionId, playlistId, action (save/unsave)
- ShareEvent: trackId, userId, sessionId, platform, source
- DownloadEvent: trackId, userId, sessionId, source, userAgent, ip
```

**Queue Management**:

- Events are queued in memory
- Auto-flush when batch size (50) reached
- Periodic flush every 5 seconds
- Synchronous flush on page unload using `navigator.sendBeacon`

**API Endpoint**: `POST /api/stats/events`

- Accepts array of events
- Uses `keepalive: true` for reliability
- Returns success confirmation

### 3. Integration Points

**Music Player Context** (`src/contexts/MusicPlayerContext.tsx`):

- Uses `useStats` hook with dynamic source tracking
- Tracks play start when audio.play() is called
- Tracks play end when audio ends or is paused
- Updates source and playlistId dynamically based on play context

**Components Using Stats**:

- Any component that plays music calls `playTrack(track, source, playlistId)`
- Components handling likes/shares/saves call respective tracking functions
- Source is automatically inferred or explicitly passed

---

## 🔄 Backend Processing System

### 1. Event Ingestion API (`src/app/api/stats/events/route.ts`)

**Endpoint**: `POST /api/stats/events`

**Process Flow**:

1. Receives batch of events (up to 1000 per request)
2. Categorizes events by type (play, like, save, share, download)
3. Processes in batches of 50 using database transactions
4. Inserts events into respective tables
5. Updates track counters (playCount, likeCount, shareCount, downloadCount)

**Transaction Safety**:

- All operations wrapped in Prisma transaction
- Ensures data consistency
- Atomic updates to both event tables and track counters

**Event Processing**:

```typescript
// Play Events
- Creates PlayEvent records
- Increments Track.playCount for each play

// Like Events
- Creates LikeEvent records
- Increments/decrements Track.likeCount based on action

// Share Events
- Creates ShareEvent records
- Increments Track.shareCount

// Download Events
- Creates DownloadEvent records
- Increments Track.downloadCount

// Save Events
- Creates SaveEvent records (no counter update - saves are per-playlist)
```

**IP Address Handling**:

- IP is captured server-side (not sent from client)
- Extracted from request headers for geographic analytics

### 2. Analytics API (`src/app/api/stats/analytics/route.ts`)

**Endpoint**: `GET /api/stats/analytics`

**Access Control**: Admin only

**Query Parameters**:

- `trackId` - Track-specific analytics
- `artistId` - Artist-specific analytics (all tracks)
- `timeRange` - 24h, 7d, 30d, 90d, 1y, all
- `metric` - plays, likes, shares, downloads, saves

**Analytics Strategy**:

1. **Aggregated Data First**: Uses DailyStats, WeeklyStats, MonthlyStats, YearlyStats for performance
2. **Raw Data Fallback**: Falls back to raw event queries if aggregated data unavailable
3. **Time Range Optimization**:
   - 7d: Uses WeeklyStats
   - 30d/90d: Uses MonthlyStats
   - 1y: Uses YearlyStats
   - 24h/all: Uses raw PlayEvent queries

**Returned Metrics**:

- **Plays**: totalPlays, uniquePlays, sourceBreakdown, avgDuration, avgCompletionRate, skipRate, replayRate
- **Likes**: totalLikes
- **Shares**: totalShares, platformBreakdown
- **Downloads**: totalDownloads
- **Saves**: totalSaves

### 3. Dashboard Stats API (`src/app/api/dashboard/stats/route.ts`)

**Endpoint**: `GET /api/dashboard/stats`

**Access Control**: Authenticated users (artist dashboard)

**Query Parameters**:

- `timeRange` - 24h, 7d, 30d, 90d, 1y, all

**Returns**:

- **Overview**: Total tracks, plays, likes, shares, downloads, saves, unique listeners, avg duration, avg completion rate
- **Artist Profile**: Basic profile info
- **Recent Activity**: Last 10 plays, last 5 likes
- **Top Tracks**: Top 5 performing tracks
- **Engagement Metrics**: Like rate, share rate, save rate, download rate, completion rate
- **Playlist Stats**: User's playlists and submissions
- **Growth Metrics**: Comparison with previous period (plays, likes, shares growth %)

**Data Aggregation**:

- Prefers aggregated stats tables when available
- Falls back to raw event queries for real-time data
- Calculates growth by comparing current period with previous period

---

## 💾 Database Schema

### Raw Event Tables

#### PlayEvent (`play_events`)

```prisma
- id: String (CUID)
- trackId: String (FK to Track)
- userId: String? (FK to User, nullable for anonymous)
- sessionId: String (for unique listener tracking)
- timestamp: DateTime
- source: String (landing, playlist, search, direct, share, player)
- playlistId: String? (if played from playlist)
- userAgent: String
- ip: String? (captured server-side)
- duration: Int? (seconds played)
- completionRate: Int? (0-100%)
- skipped: Boolean
- replayed: Boolean
- createdAt: DateTime

Indexes: trackId, timestamp, sessionId, source
```

#### LikeEvent (`like_events`)

```prisma
- id: String (CUID)
- trackId: String (FK to Track)
- userId: String? (FK to User)
- sessionId: String
- timestamp: DateTime
- source: String
- action: String (like | unlike)
- createdAt: DateTime

Indexes: trackId, timestamp, sessionId
```

#### SaveEvent (`save_events`)

```prisma
- id: String (CUID)
- trackId: String (FK to Track)
- userId: String? (FK to User)
- sessionId: String
- timestamp: DateTime
- playlistId: String (FK to Playlist)
- action: String (save | unsave)
- createdAt: DateTime

Indexes: trackId, timestamp, sessionId
```

#### ShareEvent (`share_events`)

```prisma
- id: String (CUID)
- trackId: String (FK to Track)
- userId: String? (FK to User)
- sessionId: String
- timestamp: DateTime
- platform: String (twitter, facebook, instagram, whatsapp, copy_link, embed)
- source: String
- createdAt: DateTime

Indexes: trackId, timestamp, sessionId
```

#### DownloadEvent (`download_events`)

```prisma
- id: String (CUID)
- trackId: String (FK to Track)
- userId: String? (FK to User)
- sessionId: String
- timestamp: DateTime
- source: String
- userAgent: String
- ip: String?
- createdAt: DateTime

Indexes: trackId, timestamp, sessionId
```

### Aggregated Stats Tables

#### DailyStats (`daily_stats`)

```prisma
- id: String (CUID)
- trackId: String (FK to Track)
- date: Date
- totalPlays: Int
- uniquePlays: Int
- totalLikes: Int
- totalShares: Int
- totalDownloads: Int
- totalSaves: Int
- avgDuration: Float
- avgCompletionRate: Float
- skipRate: Float
- replayRate: Float
- createdAt: DateTime

Unique Constraint: [trackId, date]
Indexes: date, trackId
```

#### WeeklyStats (`weekly_stats`)

```prisma
- id: String (CUID)
- trackId: String (FK to Track)
- weekStart: Date
- totalPlays: Int
- uniquePlays: Int
- totalLikes: Int
- totalShares: Int
- totalDownloads: Int
- totalSaves: Int
- avgDuration: Float
- avgCompletionRate: Float
- skipRate: Float
- replayRate: Float
- createdAt: DateTime

Unique Constraint: [trackId, weekStart]
Indexes: weekStart, trackId
```

#### MonthlyStats (`monthly_stats`)

```prisma
- id: String (CUID)
- trackId: String (FK to Track)
- monthStart: Date
- totalPlays: Int
- uniquePlays: Int
- totalLikes: Int
- totalShares: Int
- totalDownloads: Int
- totalSaves: Int
- avgDuration: Float
- avgCompletionRate: Float
- skipRate: Float
- replayRate: Float
- createdAt: DateTime

Unique Constraint: [trackId, monthStart]
Indexes: monthStart, trackId
```

#### YearlyStats (`yearly_stats`)

```prisma
- id: String (CUID)
- trackId: String (FK to Track)
- year: Int
- totalPlays: Int
- uniquePlays: Int
- totalLikes: Int
- totalShares: Int
- totalDownloads: Int
- totalSaves: Int
- avgDuration: Float
- avgCompletionRate: Float
- skipRate: Float
- replayRate: Float
- createdAt: DateTime

Unique Constraint: [trackId, year]
Indexes: year, trackId
```

### Track Counters (Denormalized)

The `Track` model maintains denormalized counters for quick access:

```prisma
- playCount: Int @default(0)
- likeCount: Int @default(0)
- shareCount: Int @default(0)
- downloadCount: Int @default(0)
```

These are updated in real-time as events are processed, providing O(1) access to basic metrics.

---

## 📈 Aggregation System

### Purpose

Aggregated stats tables provide fast query performance for analytics without scanning millions of raw events.

### Aggregation Jobs (`src/lib/aggregation-jobs.ts`)

**StatsAggregator Class**:

- `aggregateDaily(date)` - Aggregates all tracks for a specific date
- `aggregateWeekly(weekStart)` - Aggregates weekly stats
- `aggregateMonthly(monthStart)` - Aggregates monthly stats
- `aggregateYearly(year)` - Aggregates yearly stats

**Aggregation Process**:

1. Finds all tracks with activity in the time period
2. For each track:
   - Queries all events (play, like, save, share, download)
   - Calculates totals and averages
   - Computes unique plays (unique sessionIds)
   - Calculates skip rate, replay rate, completion rates
3. Inserts/updates aggregated record

**Metrics Calculated**:

- **Total Plays**: Count of all play events
- **Unique Plays**: Count of unique sessionIds
- **Total Likes**: Count of like actions
- **Total Shares**: Count of share events
- **Total Downloads**: Count of download events
- **Total Saves**: Count of save actions
- **Avg Duration**: Average of all play durations
- **Avg Completion Rate**: Average of all completion rates
- **Skip Rate**: Percentage of plays that were skipped (<20 seconds)
- **Replay Rate**: Percentage of plays that were replays

**When Aggregation Runs**:

- Typically via scheduled jobs (cron)
- Should run after raw events are collected
- Can be triggered manually or automatically

---

## 🔍 Analytics Queries

### Source Breakdown

Queries group events by `source` field to understand where plays come from:

- `landing` - From landing page
- `playlist` - From playlist view
- `search` - From search results
- `direct` - Direct URL access
- `share` - From shared link
- `player` - From music player

### Platform Breakdown (Shares)

Groups share events by `platform`:

- twitter, facebook, instagram, whatsapp, copy_link, embed

### Unique Listeners

Uses `sessionId` to count unique listeners:

- Groups by sessionId to get unique count
- Session ID is generated per component instance
- Persists for component lifecycle

### Engagement Metrics

- **Like Rate**: `(totalLikes / totalPlays) * 100`
- **Share Rate**: `(totalShares / totalPlays) * 100`
- **Save Rate**: `(totalSaves / totalPlays) * 100`
- **Download Rate**: `(totalDownloads / totalPlays) * 100`
- **Completion Rate**: Average of all completion rates

### Growth Metrics

Compares current period with previous period:

- **Plays Growth**: `((current - previous) / previous) * 100`
- **Likes Growth**: Same formula
- **Shares Growth**: Same formula

---

## ⚠️ Important Notes & Limitations

### 1. Play Duration Threshold

- Only play events ≥20 seconds are recorded with duration
- Shorter plays are considered "skipped" and may not be recorded
- This prevents noise from accidental clicks

### 2. Anonymous User Tracking

- Events can be recorded without userId (anonymous users)
- Session ID is used for unique listener tracking
- IP address captured server-side for geographic analytics

### 3. Source Tracking

- Source is inferred from context or explicitly passed
- Music player automatically sets source based on play context
- Components can override source when calling tracking functions

### 4. Aggregation Timing

- Aggregated stats are not updated in real-time
- Raw events are always available for real-time queries
- Aggregation improves performance for historical queries

### 5. Session ID Limitations

- Session ID is per-component-instance, not per-user
- Multiple components = multiple sessions
- For true unique user tracking, userId is required

### 6. IP Address Privacy

- IP addresses are captured but may be subject to GDPR/privacy regulations
- Consider anonymization or removal if required

### 7. Track Counters

- Denormalized counters (playCount, likeCount) are updated in real-time
- These provide fast access but may drift from actual event counts
- Use event tables for accurate counts

---

## 🚀 Performance Optimizations

### 1. Batched Event Processing

- Events are batched (50 per batch) to reduce API calls
- Reduces database write overhead
- Improves client-side performance

### 2. Aggregated Stats Tables

- Pre-computed stats for faster queries
- Reduces need to scan millions of raw events
- Indexed by date/track for fast lookups

### 3. Database Indexes

- All event tables indexed by trackId, timestamp, sessionId
- Aggregated tables indexed by date/trackId
- Enables fast filtering and grouping

### 4. Transaction Safety

- All event processing uses database transactions
- Ensures data consistency
- Prevents partial updates

### 5. Fallback Strategy

- Analytics APIs prefer aggregated data
- Fall back to raw queries if aggregated data unavailable
- Ensures data availability even if aggregation fails

---

## 📝 Recommendations

### 1. Aggregation Job Scheduling

- Set up cron job to run daily aggregation
- Consider weekly/monthly/yearly aggregations
- Ensure aggregation runs after peak traffic hours

### 2. Monitoring

- Monitor event queue size
- Alert if queue exceeds threshold
- Track API response times

### 3. Data Retention

- Consider archiving old raw events
- Keep aggregated stats for historical analysis
- Implement data retention policies

### 4. Unique User Tracking

- Consider using userId more consistently
- Implement persistent session tracking
- Use cookies/localStorage for anonymous user identification

### 5. Error Handling

- Improve error logging in event processing
- Add retry logic for failed events
- Monitor failed event processing

---

## 🔗 Related Files

- Frontend Hook: `src/hooks/useStats.ts`
- Client Collector: `src/lib/stats.ts`
- Event API: `src/app/api/stats/events/route.ts`
- Analytics API: `src/app/api/stats/analytics/route.ts`
- Dashboard API: `src/app/api/dashboard/stats/route.ts`
- Aggregation Jobs: `src/lib/aggregation-jobs.ts`
- Music Player: `src/contexts/MusicPlayerContext.tsx`
- Database Schema: `prisma/schema.prisma`

---

## Summary

The statistics tracking system is a comprehensive, multi-layered solution:

1. **Frontend**: React hooks and client-side queue for non-blocking event collection
2. **Backend**: Batch API for efficient event processing with transaction safety
3. **Database**: Raw event tables + aggregated stats tables for performance
4. **Analytics**: Multiple APIs for different use cases (admin, artist dashboard)
5. **Optimization**: Batching, aggregation, indexing for scalability

The system is designed to handle high-volume traffic while maintaining data accuracy and query performance.
