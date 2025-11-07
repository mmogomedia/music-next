# AI Search Result Tracking Implementation Plan

## Overview

This document outlines the implementation plan for tracking how many times songs appear in AI search results, specifically focusing on tracks that appear in the `other` field (featured/recommended tracks) of AI responses.

## Business Requirements

- **Track Only**: Count tracks that appear in the `other` field of AI responses
- **Exclude Main Results**: Do NOT count tracks from the main `tracks` array
- **Comprehensive Tracking**: Use hybrid approach (events + counters + aggregated stats)
- **Performance**: Fast reads via counters, detailed history via events

## Architecture Decision: Hybrid Approach + Unified Stats System

### Components

1. **Unified Stats System** (`AISearchEvent` in `stats.ts`): Client-side event tracking via unified stats collector
2. **Event Table** (`AISearchEvent` in database): Detailed historical tracking
3. **Counter Field** (`Track.aiSearchCount`): Fast read access
4. **Aggregated Stats**: Time-based analytics (daily/weekly/monthly/yearly)

### Why Hybrid + Unified?

- **Unified Tracking**: Uses the same stats system as plays, likes, shares, etc.
- **Fast Reads**: Counter field allows instant access to total counts
- **Detailed History**: Event table enables deep analytics and auditing
- **Time-Based Analytics**: Aggregated stats enable trend analysis
- **Consistency**: Follows existing pattern (PlayEvent + playCount + DailyStats)
- **Batched Processing**: Events are batched and sent efficiently via `/api/stats/events`

## Database Schema Changes

### 1. New Event Table: `AISearchEvent`

```prisma
model AISearchEvent {
  id              String   @id @default(cuid())
  trackId         String
  conversationId  String?  // Optional: which conversation this was in
  userId          String?  // Optional: if user was authenticated
  resultType      String   // 'track_list' (only type that has "other" field)
  timestamp       DateTime @default(now())
  createdAt       DateTime @default(now())
  
  // Relations
  track           Track    @relation("TrackAISearches", fields: [trackId], references: [id], onDelete: Cascade)
  conversation    AIConversation? @relation("AISearchEvents", fields: [conversationId], references: [id], onDelete: SetNull)
  user            User?    @relation("AISearchEvents", fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([trackId])
  @@index([timestamp])
  @@index([conversationId])
  @@index([userId])
  @@index([resultType])
  @@map("ai_search_events")
}
```

**Notes:**
- Only tracks from `other` field will be recorded
- `resultType` will always be `'track_list'` (only type that has `other` field)
- `conversationId` may be null for unauthenticated users
- `userId` may be null for unauthenticated users

### 2. Update Track Model

```prisma
model Track {
  // ... existing fields
  aiSearchCount   Int                  @default(0)  // Total times appeared in AI "other" field
  aiSearchEvents  AISearchEvent[]      @relation("TrackAISearches")
  
  // ... rest of existing fields
}
```

### 3. Update User Model

```prisma
model User {
  // ... existing fields
  aiSearchEvents  AISearchEvent[]      @relation("AISearchEvents")
  
  // ... rest of existing fields
}
```

### 4. Update AIConversation Model

```prisma
model AIConversation {
  // ... existing fields
  aiSearchEvents  AISearchEvent[]      @relation("AISearchEvents")
  
  // ... rest of existing fields
}
```

### 5. Update Aggregated Stats Tables

Add `totalAISearches` field to all aggregated stats tables:

```prisma
model DailyStats {
  // ... existing fields
  totalAISearches Int      @default(0)  // Times track appeared in AI "other" field today
  
  // ... rest of existing fields
}

model WeeklyStats {
  // ... existing fields
  totalAISearches Int      @default(0)  // Times track appeared in AI "other" field this week
  
  // ... rest of existing fields
}

model MonthlyStats {
  // ... existing fields
  totalAISearches Int      @default(0)  // Times track appeared in AI "other" field this month
  
  // ... rest of existing fields
}

model YearlyStats {
  // ... existing fields
  totalAISearches Int      @default(0)  // Times track appeared in AI "other" field this year
  
  // ... rest of existing fields
}
```

## Implementation Location

### Primary Implementation Point

**File**: `src/lib/ai/agents/discovery-agent.ts`  
**Method**: `convertToolDataToResponse()`  
**Specific Location**: Lines 385-444 (where `other` field is populated)

### Tracking Logic

```typescript
// Location: After building otherTracks array, before returning response
// Lines ~444 in discovery-agent.ts

// Pseudo-code:
if (otherTracks && otherTracks.length > 0) {
  // Track these tracks in AI search events
  // This happens for all track results that have featured tracks in the "other" field
}
```

### Key Points

- **Only track `other` field**: The `other` field appears when:
  - Track results are returned (any number of tracks)
  - Featured tracks are successfully fetched
  - Featured tracks are filtered to exclude tracks already in main results
  - Featured tracks are mapped to `otherTracks` (max 5 tracks)
- **Never track main results**: The `tracks` array in main results is explicitly excluded
- **Context available**: Conversation ID and User ID are available from the agent context

## Unified Stats System Integration

### Event Type: `AISearchEvent`

**Location**: `src/lib/stats.ts`

**Event Interface:**
```typescript
export interface AISearchEvent {
  eventType: 'ai_search';
  trackId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  conversationId?: string; // Optional: which conversation this was in
  resultType: string; // 'track_list' (only type that has "other" field)
}
```

**Usage:**
```typescript
import { stats, generateSessionId } from '@/lib/stats';

// Generate session ID (shared across tracks in same AI response)
const sessionId = generateSessionId();

// Track each track that appears in "other" field
stats.aiSearch({
  eventType: 'ai_search',
  trackId: track.id,
  userId: context?.userId,
  sessionId: sessionId,
  conversationId: context?.conversationId,
  resultType: 'track_list',
});
```

**Benefits:**
- **Unified System**: Uses same batching and queueing as other events
- **Non-blocking**: Events are queued and sent in batches (50 per batch)
- **Automatic Batching**: StatsCollector handles batching automatically
- **Error Handling**: Built-in retry logic for failed events
- **Performance**: Minimizes database round trips via batching

**API Processing:**
- Events are processed by `/api/stats/events` route
- Creates `AISearchEvent` database records
- Updates `Track.aiSearchCount` counter
- Handles errors gracefully (won't break other event processing)

## Integration Points

### 1. Discovery Agent Integration

**File**: `src/lib/ai/agents/discovery-agent.ts`

**Integration Point**: After `otherTracks` array is built (line ~444, works for all track results)

**Code Flow:**
1. Build `otherTracks` array (existing code - now works for all track results, not just single track)
2. If `otherTracks` has items, extract track IDs
  3. Track each track using the unified stats system (deduplicate within response):
     ```typescript
     import { stats, generateSessionId } from '@/lib/stats';
     
     // Generate or get session ID (can be shared across tracks in same response)
     const sessionId = generateSessionId();
     
     // Track each unique track that appeared in "other" field (deduplicate)
     if (otherTracks && otherTracks.length > 0) {
       const uniqueTrackIds = new Set<string>();
       for (const track of otherTracks) {
         if (!uniqueTrackIds.has(track.id)) {
           uniqueTrackIds.add(track.id);
           stats.aiSearch({
             eventType: 'ai_search',
             trackId: track.id,
             userId: context?.userId,
             sessionId: sessionId,
             conversationId: context?.conversationId,
             resultType: 'track_list',
           });
         }
       }
     }
     ```
4. Continue with existing return logic

**Error Handling:**
- Tracking is non-blocking (stats collector handles batching)
- If tracking fails, it's handled internally by the stats collector
- Use try-catch around stats calls to ensure search results are never delayed

### 2. Context Access

**Available Context:**
- `conversationId`: From conversation context (may be null for new conversations)
- `userId`: From user context (may be null for unauthenticated users)
- `resultType`: Always `'track_list'` for results with `other` field

**Context Source**: 
- Need to check how context flows through the agent
- May need to pass context explicitly to `convertToolDataToResponse()`

### 3. Background Jobs (Optional)

**Purpose**: Aggregate events into daily/weekly/monthly stats

**Implementation**: 
- Cron job or scheduled task
- Runs daily to update aggregated stats
- Can be added in Phase 2 if needed

## Data Flow

```
1. User sends AI chat message
   ↓
2. Discovery Agent processes request
   ↓
3. Agent fetches tracks and builds response
   ↓
4. For all track results: Fetches featured tracks → populates `other` field (excluding tracks already in main results)
   ↓
5. BEFORE returning response:
   - Extract track IDs from `other` array
   - Call stats.aiSearch() for each track (unified stats system)
   ↓
6. Unified Stats System (Client-side):
   a. Events are queued in StatsCollector
   b. Batched and sent to /api/stats/events (up to 50 events per batch)
   ↓
7. API Route (/api/stats/events):
   a. Receives batched events
   b. Creates AISearchEvent records (batch insert)
   c. Updates Track.aiSearchCount (atomic increment)
   ↓
8. Return response to user (non-blocking)
```

## Edge Cases & Considerations

### 1. Duplicate Tracks in Same Response
- **Scenario**: Same track appears multiple times in `other` array
- **Decision**: Count once per track per response (deduplicate within same response)
- **Rationale**: One appearance per response is sufficient to track popularity; avoids inflating counts

### 2. Track Not Found
- **Scenario**: Track ID in `other` array doesn't exist in database
- **Decision**: Skip that track, log warning, continue with others
- **Rationale**: Don't break tracking for invalid data

### 3. Unauthenticated Users
- **Scenario**: User not logged in, no `conversationId` or `userId`
- **Decision**: Record events with null `conversationId` and `userId`
- **Rationale**: Still valuable to track anonymous usage

### 4. Performance
- **Scenario**: Large batch of tracks to track
- **Decision**: Use batch insert for events, batch update for counters
- **Rationale**: Minimize database round trips

### 5. Transaction Safety
- **Scenario**: Tracking fails partway through
- **Decision**: Use transactions or ensure idempotency
- **Rationale**: Data consistency

### 6. Rate Limiting
- **Scenario**: High volume of AI searches
- **Decision**: Track asynchronously if needed (Phase 2)
- **Rationale**: Don't slow down AI responses

## Testing Strategy

### Unit Tests
- Test `AISearchTrackingService` methods
- Test event creation with various contexts
- Test counter updates
- Test edge cases (null values, missing tracks, etc.)

### Integration Tests
- Test discovery agent integration
- Test that only `other` field is tracked
- Test that main results are NOT tracked
- Test with authenticated and unauthenticated users

### Performance Tests
- Test batch insert performance
- Test counter update performance
- Ensure tracking doesn't slow down AI responses

## Migration Strategy

### Phase 1: Schema Migration
1. Create migration for `AISearchEvent` table
2. Add `aiSearchCount` to `Track` model
3. Add `totalAISearches` to aggregated stats tables
4. Run migration

### Phase 2: Implementation
1. Create `AISearchTrackingService`
2. Integrate into discovery agent
3. Test thoroughly
4. Deploy

### Phase 3: Backfill (Optional)
- If historical data is needed, create script to backfill from conversation messages
- Parse existing conversation messages to extract `other` field data
- Create events and update counters

## Monitoring & Analytics

### Metrics to Track
- Number of events created per day
- Average tracks per AI search response
- Top tracks by AI search appearances
- Performance impact of tracking (latency)

### Queries for Analytics

```sql
-- Top tracks by AI search appearances
SELECT t.id, t.title, t.artist, t.aiSearchCount 
FROM tracks t 
ORDER BY t.aiSearchCount DESC 
LIMIT 100;

-- Tracks by AI search appearances in last 30 days
SELECT t.id, t.title, COUNT(*) as appearances
FROM ai_search_events e
JOIN tracks t ON e.trackId = t.id
WHERE e.timestamp >= NOW() - INTERVAL '30 days'
GROUP BY t.id, t.title
ORDER BY appearances DESC
LIMIT 100;

-- Daily trend of AI search appearances
SELECT DATE(timestamp) as date, COUNT(*) as total_appearances
FROM ai_search_events
WHERE timestamp >= NOW() - INTERVAL '90 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

## Implementation Checklist

### Phase 1: Database Schema ✅
- [ ] Create Prisma migration for `AISearchEvent` model
- [ ] Add `aiSearchCount` field to `Track` model
- [ ] Add `aiSearchEvents` relation to `Track` model
- [ ] Add `aiSearchEvents` relation to `User` model
- [ ] Add `aiSearchEvents` relation to `AIConversation` model
- [ ] Add `totalAISearches` field to `DailyStats` model
- [ ] Add `totalAISearches` field to `WeeklyStats` model
- [ ] Add `totalAISearches` field to `MonthlyStats` model
- [ ] Add `totalAISearches` field to `YearlyStats` model
- [ ] Run migration and verify schema

### Phase 2: Context Enhancement ✅
- [ ] Add `conversationId?: string` to `AgentContext` interface in `base-agent.ts`
- [ ] Update API route to include `conversationId` in `agentContext`
- [ ] Update `DiscoveryAgent.process()` to pass context to `convertToolDataToResponse()`
- [ ] Update `convertToolDataToResponse()` signature to accept context parameter
- [ ] Test context flow through agent chain

### Phase 3: Unified Stats Integration ✅
- [x] Add `AISearchEvent` interface to `src/lib/stats.ts`
- [x] Add `recordAISearch()` method to `StatsCollector`
- [x] Add `stats.aiSearch()` helper function
- [x] Update `/api/stats/events` route to handle `ai_search` events
- [x] Update `StatEvent` union type to include `AISearchEvent`
- [ ] Add error handling for missing database table (graceful degradation)
- [ ] Write unit tests for stats integration

### Phase 4: Discovery Agent Integration ✅
- [x] Fix discovery agent to populate `otherTracks` for all track results (not just single track)
- [x] Update filtering to exclude all main result tracks (not just first track)
- [ ] Review discovery agent context flow
- [ ] Identify exact integration point (after `otherTracks` built, line ~444)
- [ ] Extract track IDs from `other` array
- [ ] Extract context (conversationId, userId)
- [ ] Import `stats` and `generateSessionId` from `@/lib/stats`
- [ ] Generate session ID for the AI response
- [ ] Call `stats.aiSearch()` for each track in `other` array
- [ ] Add error handling (non-blocking with try-catch)
- [ ] Verify main results are NOT tracked (only `other` field)
- [ ] Write integration tests

### Phase 5: Testing ✅
- [ ] Unit tests for service layer
- [ ] Integration tests for discovery agent
- [ ] Test with authenticated users
- [ ] Test with unauthenticated users
- [ ] Test edge cases (duplicates, missing tracks, etc.)
- [ ] Performance testing
- [ ] Verify tracking doesn't slow down AI responses

### Phase 6: Deployment ✅
- [ ] Code review
- [ ] Deploy to staging
- [ ] Monitor for errors
- [ ] Verify events are being created
- [ ] Verify counters are updating
- [ ] Deploy to production
- [ ] Monitor production metrics

### Phase 7: Analytics & Monitoring (Optional) ✅
- [ ] Create analytics queries
- [ ] Set up monitoring dashboards
- [ ] Create background job for aggregated stats (if needed)
- [ ] Document analytics endpoints (if needed)

## Future Enhancements

### Phase 2 Features (Future)
- Background job for aggregated stats updates
- Analytics API endpoints
- Dashboard for AI search trends
- Historical data backfill (if needed)
- Rate limiting/throttling for high volume

### Potential Analytics
- Track which genres appear most in "other" field
- Track which artists appear most in "other" field
- Correlate AI search appearances with actual plays
- A/B testing for featured track selection algorithm

## Notes

- **Tracking Scope**: Only tracks in `other` field are tracked
- **Main Results**: Explicitly excluded from tracking
- **Performance**: Tracking is non-blocking and should not affect AI response times
- **Privacy**: Events may have null userId/conversationId for unauthenticated users
- **Scalability**: Batch operations are used for performance

## Context Flow Solution ✅

### Current State Analysis
- `AgentContext` interface has `userId` but NOT `conversationId`
- `conversationId` is available in API route but not passed to agents
- Need to enhance context flow to include `conversationId`

### Implementation Steps
1. **Update `AgentContext` interface** (`src/lib/ai/agents/base-agent.ts`):
   ```typescript
   export interface AgentContext {
     userId?: string;
     conversationId?: string;  // ADD THIS
     conversationHistory?: AIMessage[];
     filters?: {
       genre?: string;
       province?: string;
     };
   }
   ```

2. **Update API Route** (`src/app/api/ai/chat/route.ts`):
   ```typescript
   const agentContext = {
     userId: context?.userId,
     conversationId: conversationId,  // ADD THIS
     filters: built.filters ?? ({} as any),
   };
   ```

3. **Update `DiscoveryAgent.process()`** to pass context to `convertToolDataToResponse()`:
   - Modify `handleToolCalls()` to accept context
   - Pass context to `convertToolDataToResponse(context)`

4. **Update `convertToolDataToResponse()` signature**:
   ```typescript
   private async convertToolDataToResponse(
     toolData: any[],
     context?: AgentContext  // ADD THIS
   ): Promise<AIResponse | null>
   ```

## Decisions Made ✅

1. **Context Access**: ✅ RESOLVED
   - Add `conversationId` to `AgentContext` interface
   - Pass from API route → agent → `convertToolDataToResponse()`

2. **Async vs Sync**: ✅ DECISION
   - Start with synchronous (non-blocking with try-catch)
   - Move to async if performance becomes an issue

3. **Error Handling**: ✅ DECISION
   - Log errors to logger
   - Use try-catch to ensure search results are never delayed
   - Fail silently from user perspective

4. **Backfill**: ✅ DECISION
   - Not needed initially
   - Can be done later if historical data is required

5. **Unified Stats System**: ✅ DECISION
   - Use `AISearchEvent` type in unified stats system (`stats.ts`)
   - Integrate with existing batching and queueing infrastructure
   - Events sent via `/api/stats/events` endpoint
   - Benefits: consistency, automatic batching, error handling

## Summary: Unified AI Search Event Tracking

### New Event Type: `AISearchEvent`

**Location**: `src/lib/stats.ts`

**Purpose**: Track when tracks appear in AI search results (specifically in the `other` field of track_list responses)

**Usage in Discovery Agent**:
```typescript
import { stats, generateSessionId } from '@/lib/stats';

// After building otherTracks array (line ~444 in discovery-agent.ts)
if (otherTracks && otherTracks.length > 0) {
  const sessionId = generateSessionId();
  
  try {
    // Deduplicate tracks within the same response (count once per track)
    const uniqueTrackIds = new Set<string>();
    for (const track of otherTracks) {
      if (!uniqueTrackIds.has(track.id)) {
        uniqueTrackIds.add(track.id);
        stats.aiSearch({
          eventType: 'ai_search',
          trackId: track.id,
          userId: context?.userId,
          sessionId: sessionId,
          conversationId: context?.conversationId,
          resultType: 'track_list',
        });
      }
    }
  } catch (error) {
    // Non-blocking: log error but continue
    logger.error('Failed to track AI search events:', error);
  }
}
```

**Key Points**:
- ✅ Integrated into unified stats system
- ✅ Automatic batching (50 events per batch)
- ✅ Non-blocking (won't delay AI responses)
- ✅ Error handling built-in
- ✅ Events processed by `/api/stats/events`
- ✅ Updates `Track.aiSearchCount` counter
- ✅ Creates `AISearchEvent` database records

**What Gets Tracked**:
- ✅ Tracks in `other` field (featured/recommended tracks)
- ❌ Tracks in main `tracks` array (explicitly excluded)

**When to Track**:
- When `otherTracks` array has items (featured tracks in "other" field)
- Works for all track results (single or multiple tracks)
- Only for `track_list` response type
- Count once per track per response (deduplicate within same response)

