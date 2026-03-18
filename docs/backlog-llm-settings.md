# LLM Settings Management - Backlog

## Overview

Add an LLM Settings section to the Admin Dashboard to manage router keywords and configuration dynamically from the database instead of hardcoded values.

## Goals

1. Move keywords from hardcoded arrays to database
2. Allow admins to manage keyword lists through UI
3. Allow admins to configure theme weight and other routing parameters
4. Provide real-time updates without code deployments

## Database Schema

### New Models

```prisma
model RouterKeywordList {
  id          String   @id @default(cuid())
  name        String   @unique // e.g., "PLAYBACK_KEYWORDS", "DISCOVERY_KEYWORDS"
  description String?
  keywords    RouterKeyword[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("router_keyword_lists")
}

model RouterKeyword {
  id          String   @id @default(cuid())
  listId      String
  keyword     String
  isActive    Boolean  @default(true)
  priority    Int      @default(0) // Higher priority = more weight
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  list        RouterKeywordList @relation(fields: [listId], references: [id], onDelete: Cascade)

  @@unique([listId, keyword])
  @@index([listId])
  @@map("router_keywords")
}

model RouterConfig {
  id          String   @id @default(cuid())
  key         String   @unique // e.g., "THEME_KEYWORD_WEIGHT", "MIN_KEYWORD_CONFIDENCE_THRESHOLD"
  value       String   // JSON string for complex values
  description String?
  updatedBy   String?  // User ID who last updated
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("router_config")
}
```

## Implementation Tasks

### Phase 1: Database Setup

- [ ] Create Prisma schema for RouterKeywordList, RouterKeyword, RouterConfig
- [ ] Create migration
- [ ] Seed initial keywords from current hardcoded values
- [ ] Create seed script to populate keywords

### Phase 2: API Endpoints

- [ ] `GET /api/admin/router/keywords` - List all keyword lists
- [ ] `GET /api/admin/router/keywords/:listId` - Get keywords for a list
- [ ] `POST /api/admin/router/keywords/:listId` - Add keyword to list
- [ ] `PUT /api/admin/router/keywords/:id` - Update keyword (priority, active status)
- [ ] `DELETE /api/admin/router/keywords/:id` - Remove keyword
- [ ] `GET /api/admin/router/config` - Get all router config
- [ ] `PUT /api/admin/router/config/:key` - Update config value

### Phase 3: Service Layer

- [ ] Create `RouterKeywordService` to fetch keywords from DB
- [ ] Create `RouterConfigService` to fetch config from DB
- [ ] Add caching layer (Redis or in-memory) for performance
- [ ] Add cache invalidation on updates

### Phase 4: Refactor Router Code

- [ ] Update `router-keywords.ts` to fetch from DB instead of hardcoded arrays
- [ ] Update `agent-config.ts` to fetch from DB instead of hardcoded values
- [ ] Add fallback to hardcoded values if DB fetch fails
- [ ] Add logging for keyword/config fetches

### Phase 5: Admin UI Components

- [ ] Create `LLMSettings.tsx` component
- [ ] Create `KeywordListManager.tsx` component
- [ ] Create `KeywordEditor.tsx` component (add/edit/delete keywords)
- [ ] Create `RouterConfigEditor.tsx` component
- [ ] Add to AdminDashboard navigation
- [ ] Add validation and error handling

### Phase 6: Features

- [ ] Bulk import keywords (CSV/JSON)
- [ ] Export keywords (CSV/JSON)
- [ ] Keyword usage analytics (how often each keyword matches)
- [ ] A/B testing support (test different keyword sets)
- [ ] Version history for keywords/config changes
- [ ] Rollback capability

## UI Design

### LLM Settings Page Structure

```
/admin/dashboard/llm-settings
├── Router Keywords
│   ├── Playback Keywords
│   │   ├── List of keywords with priority/active status
│   │   ├── Add keyword button
│   │   ├── Edit/Delete actions
│   │   └── Bulk import/export
│   ├── Discovery Keywords
│   ├── Recommendation Keywords
│   ├── Theme Keywords
│   ├── Industry Knowledge Keywords
│   ├── Malicious Keywords
│   ├── Music Keywords
│   ├── Off-Topic Keywords
│   └── Explicit Keywords
├── Router Configuration
│   ├── Theme Keyword Weight (slider: 0.5 - 3.0)
│   ├── Min Keyword Confidence Threshold (slider: 0.0 - 1.0)
│   └── Other configurable parameters
└── Analytics
    ├── Keyword Match Frequency
    ├── Intent Distribution
    └── Routing Accuracy Metrics
```

## Technical Considerations

### Performance

- **Caching**: Cache keywords/config in memory with TTL (5-10 minutes)
- **Lazy Loading**: Load keywords on-demand, not all at once
- **Indexing**: Ensure proper DB indexes on listId, keyword

### Data Migration

- **Initial Seed**: Migrate all current hardcoded keywords to DB
- **Fallback**: Keep hardcoded values as fallback if DB unavailable
- **Versioning**: Track changes for audit trail

### Security

- **Admin Only**: All endpoints require ADMIN role
- **Validation**: Validate keyword format (no special chars, length limits)
- **Rate Limiting**: Prevent abuse of update endpoints

### Monitoring

- **Logging**: Log all keyword/config changes
- **Metrics**: Track keyword match rates
- **Alerts**: Alert on unusual routing patterns

## Success Metrics

- ✅ All keywords moved to database
- ✅ Admin can add/edit/delete keywords via UI
- ✅ Theme weight configurable via UI
- ✅ No performance degradation (<10ms overhead)
- ✅ 100% uptime (fallback to hardcoded if DB fails)

## Future Enhancements

- Machine learning to suggest new keywords based on user queries
- Auto-tuning of keyword weights based on routing accuracy
- Multi-language keyword support
- Keyword synonyms and variations
- Intent classification training data collection
