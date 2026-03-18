# PULSE³ Implementation Status

## ✅ Completed

### 1. TikTok OAuth Integration

- ✅ OAuth flow with PKCE (Proof Key for Code Exchange)
- ✅ Authorization URL generation
- ✅ Token exchange and refresh
- ✅ User info fetching with `user.info.basic`, `user.info.stats`, and `video.list` scopes
- ✅ Error handling for TikTok API responses (handles `error.code === 'ok'` success pattern)
- ✅ Database storage in `Account` table (NextAuth model)
- ✅ Social links storage in `ArtistProfile.socialLinks`

### 2. UI Components

- ✅ **PulseConnectPage** (`/pulse/connect`) - Platform connection interface
  - TikTok connection with status check
  - Spotify and YouTube placeholders (Coming Soon)
  - Success/error message handling
  - Disconnect functionality
- ✅ **PulseCard** - Dashboard widget showing PULSE³ status
  - Connection prompt when not connected
  - Loading states
  - Eligibility score display
  - Momentum score display (when monitored)
  - Position on Top 100 chart
  - "What is PULSE³?" modal
  - "Why not tracked?" modal

- ✅ **PulseDashboard** (`/pulse`) - Full PULSE³ dashboard
  - Overview of scores and position
  - Action items for improvement
  - Connection management

- ✅ **PulseInfoModal** - Educational content about PULSE³
- ✅ **PulseNotTrackedModal** - Explanation for non-monitored artists

### 3. API Endpoints

- ✅ `GET /api/pulse/tiktok/authorize` - Initiates OAuth flow
- ✅ `GET /api/pulse/tiktok/callback` - Handles OAuth callback
- ✅ `GET /api/pulse/tiktok/status` - Checks connection status
- ✅ `GET /api/pulse/tiktok/data` - Fetches TikTok user data and videos
- ✅ `POST /api/pulse/tiktok/disconnect` - Disconnects TikTok
- ✅ `GET /api/pulse/scores` - Returns PULSE³ scores (currently placeholder)

### 4. Services

- ✅ `TikTokService` - Complete TikTok integration service
  - OAuth flow management
  - Token refresh
  - User info fetching
  - Video list fetching
  - Connection persistence
  - Disconnect functionality

### 5. Navigation

- ✅ PULSE³ tab added to Artist Navigation
- ✅ Routes configured (`/pulse`, `/pulse/connect`)

## 🚧 Outstanding Work

### 1. Database Models (High Priority)

**Status:** Not created yet

Need to create Prisma models for:

- `PulseEligibilityScore` - Store calculated eligibility scores
- `PulseMomentumScore` - Store calculated momentum scores
- `PulseMonitoringStatus` - Track which artists are actively monitored
- `PulsePlatformData` - Store historical platform data (TikTok stats over time)

**Schema should include:**

```prisma
model PulseEligibilityScore {
  id              String   @id @default(cuid())
  artistProfileId String
  score           Float    // 0-100
  rank            Int?     // Rank among all artists
  calculatedAt    DateTime @default(now())

  artistProfile   ArtistProfile @relation(...)

  @@unique([artistProfileId, calculatedAt])
  @@index([score])
  @@index([rank])
}

model PulseMomentumScore {
  id              String   @id @default(cuid())
  artistProfileId String
  score           Float    // 0-100
  position        Int?     // 1-100 on Top 100 chart
  calculatedAt    DateTime @default(now())

  artistProfile   ArtistProfile @relation(...)

  @@unique([artistProfileId, calculatedAt])
  @@index([position])
}

model PulseMonitoringStatus {
  id                String   @id @default(cuid())
  artistProfileId   String   @unique
  isActivelyMonitored Boolean @default(false)
  lastCalculatedAt  DateTime @default(now())
  updatedAt         DateTime @updatedAt

  artistProfile     ArtistProfile @relation(...)
}
```

### 2. Eligibility Score Calculation (High Priority)

**Status:** Currently using placeholder score (65)

**Need to implement:**

- Fetch TikTok stats (follower_count, video_count, likes_count, etc.)
- Calculate score based on:
  - **Follower count** (weighted)
  - **Engagement rate** (likes/video, comments/video)
  - **Posting consistency** (videos over time)
  - **Recent performance** (trending up/down)
  - **Cross-platform presence** (Spotify, YouTube when available)
- Store calculated scores in database
- Update eligibility score periodically (background job)

**Scoring Algorithm:**

```
Eligibility Score = (
  (Follower Score × 0.25) +
  (Engagement Score × 0.30) +
  (Consistency Score × 0.20) +
  (Trend Score × 0.15) +
  (Platform Diversity × 0.10)
) × 100
```

### 3. Momentum Score Calculation (High Priority)

**Status:** Currently using placeholder score (72)

**Need to implement:**

- Track changes in TikTok metrics over time
- Calculate momentum based on:
  - **Growth velocity** (follower growth rate)
  - **Engagement acceleration** (increasing likes/comments)
  - **Viral potential** (recent video performance)
  - **Cross-platform momentum** (when multiple platforms connected)
- Only calculate for artists in Top 100 (eligibility >= threshold)
- Store calculated scores in database

### 4. Top 100 Ranking System (High Priority)

**Status:** Placeholder position (#45)

**Need to implement:**

- Rank artists by eligibility score
- Top 100 artists get actively monitored
- Calculate momentum scores for monitored artists
- Rank monitored artists by momentum score (1-100)
- Update rankings periodically
- Public Top 100 chart page (if needed)

### 5. Background Jobs / Cron Tasks (High Priority)

**Status:** Not implemented

**Need to create:**

- Periodic eligibility score calculation (e.g., every 6 hours)
- Periodic momentum score calculation (e.g., every hour for Top 100)
- Periodic TikTok data sync (fetch latest stats)
- Ranking updates

**Options:**

- Next.js API routes with cron triggers (Vercel Cron)
- Separate worker service
- Database triggers

### 6. TikTok Data Fetching & Storage (Medium Priority)

**Status:** Can fetch but not storing historical data

**Need to implement:**

- Periodic fetching of TikTok user stats
- Store historical data for trend analysis
- Track video performance over time
- Calculate engagement rates

### 7. Spotify Integration (Medium Priority)

**Status:** UI placeholder only

**Need to implement:**

- Spotify OAuth flow
- Spotify API integration
- Fetch artist data (monthly listeners, followers)
- Add to eligibility score calculation
- Similar structure to TikTok integration

### 8. YouTube Integration (Medium Priority)

**Status:** UI placeholder only

**Need to implement:**

- YouTube OAuth flow
- YouTube Data API integration
- Fetch channel data (subscribers, views, video count)
- Add to eligibility score calculation
- Similar structure to TikTok integration

### 9. Public Top 100 Chart (Low Priority)

**Status:** Not implemented

**Need to create:**

- Public-facing chart page
- Display top 100 artists by momentum
- Real-time or near-real-time updates
- Artist profile links

### 10. Testing & Error Handling (Ongoing)

**Status:** Basic error handling in place

**Need to improve:**

- Comprehensive error handling for API failures
- Token refresh error recovery
- Rate limiting for TikTok API calls
- Data validation
- Unit tests for scoring algorithms
- Integration tests for OAuth flows

## 📋 Implementation Priority

### Phase 1: Core Scoring (Next Steps)

1. Create database models for PULSE³ scores
2. Implement eligibility score calculation using TikTok data
3. Implement momentum score calculation
4. Create background jobs for periodic calculations
5. Update `/api/pulse/scores` to use real data

### Phase 2: Platform Expansion

6. Spotify OAuth and integration
7. YouTube OAuth and integration
8. Multi-platform scoring

### Phase 3: Features & Polish

9. Public Top 100 chart
10. Historical data tracking
11. Advanced analytics and insights
12. Performance optimizations

## 🔧 Technical Notes

### Current Architecture

- **OAuth Flow:** PKCE-based, secure state management via database
- **Token Storage:** NextAuth Account model
- **Data Storage:** ArtistProfile.socialLinks for connection metadata
- **Scoring:** Placeholder values until models are created

### Dependencies

- TikTok API (working)
- Prisma for database
- NextAuth for authentication
- Next.js API routes

### Environment Variables Required

- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## 📝 Notes

- The current implementation provides a solid foundation with working OAuth and UI
- Placeholder scores prevent UI from showing infinite loading states
- Next major milestone is implementing real scoring algorithms
- Consider using existing `ArtistStrengthScore` model as reference for scoring patterns
