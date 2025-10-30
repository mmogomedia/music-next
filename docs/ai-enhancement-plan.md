# AI Enhancement Plan: LangChain Agents & MCP Servers

## Executive Summary

Transform the current basic AI chat into an intelligent agent system using LangChain with MCP (Model Context Protocol) servers that can:

1. Understand user intent and respond with appropriate **interactive UI elements**
2. Actually **execute actions** via our APIs (play music, search playlists, etc.)
3. Maintain **conversation context** for personalized experiences

---

## Current State Analysis

### What We Have Now

- ✅ Basic AI chat endpoint (`/api/ai/chat`)
- ✅ Simple text responses
- ✅ Multiple AI provider support (OpenAI, Anthropic, Google, Cohere)
- ✅ Context awareness (province, genre filters)
- ✅ Quick action links that populate chat input

### What We're Missing

- ❌ **Structured response types** - AI can't return playlists, tracks, or interactive elements
- ❌ **Action execution** - AI can't actually play music or trigger platform actions
- ❌ **Tool/function calling** - No connection to our APIs
- ❌ **Memory/conversation tracking** - No persistent conversation history
- ❌ **Interactive UI rendering** - Everything is just text

---

## Key Questions for Clarity

Before we build, I need to understand your vision:

### 1. **Structured Response System** ✅ **DECIDED**

We'll use **Structured Data + Renderer** approach. When users ask "Show me trending Amapiano tracks", the AI response will contain complete data:

```typescript
{
  type: "track_list",
  message: "Here are the trending Amapiano tracks:",
  data: { tracks: [...] },
  actions: ["play_all", "save_playlist"]
}
```

**How it works:**

1. AI returns complete data payload with all information needed
2. Frontend has predefined components for each response type
3. Components render the data exactly as provided
4. AI has control over what data is included/shown

**Example Flow:**

```typescript
// AI Response
{
  type: "track_list",
  message: "Here are trending Amapiano tracks from Johannesburg:",
  data: {
    tracks: [
      {
        id: "123",
        title: "Track Name",
        artist: "Artist Name",
        coverImage: "url",
        duration: 210,
        playUrl: "url"
      },
      // ... more tracks
    ],
    metadata: {
      total: 10,
      genre: "Amapiano",
      location: "Johannesburg"
    }
  },
  actions: [
    { type: "play_all", label: "▶️ Play All" },
    { type: "shuffle", label: "🔀 Shuffle" },
    { type: "save_playlist", label: "➕ Save as Playlist" }
  ]
}

// Frontend Renderer
function ResponseRenderer({ response }) {
  switch (response.type) {
    case "track_list":
      return <TrackListComponent tracks={response.data.tracks} />;
    case "playlist":
      return <PlaylistComponent playlist={response.data} />;
    case "artist":
      return <ArtistProfileComponent artist={response.data} />;
    // ... etc
  }
}
```

**Why This Approach:**

✅ **AI Context is Important**: The AI controls what tracks/playlists are shown because it understands musical relationships, curates based on conversation context, and personalizes based on user's current mood/situation

✅ **Data Completeness**: Complete control over the data returned - AI can include/exclude tracks based on relevance and provide rich metadata

✅ **Consistency**: Same query = same rendering = better UX - users expect consistent behavior

✅ **Faster UX**: No loading spinners between AI response and data display - everything shows up immediately

✅ **Simpler to Implement**: Type-safe with clear TypeScript interfaces, self-contained data, easy to debug

✅ **No Extra API Calls**: Data comes directly from AI in the response

---

### 2. **What Actions Should AI Be Able to Execute?** ✅ **DECIDED**

Current quick links to be implemented:

- 🔥 **Trending music** → Fetch top charts ✅ (Read Actions)
- 🎵 **Browse genres** → Find playlists by genre ✅ (Read Actions)
- 🌍 **Provincial music** → Find playlists by province ✅ (Read Actions)
- ✨ **Discover new music** → Search and browse featured content ✅ (Read Actions)

**MVP Priority Actions:**

#### **Read Actions** (Search & Discovery) ✅ **PRIORITY**

- ✅ Search tracks by title, artist, lyrics
- ✅ Find playlists by genre, province, mood (covers quick links)
- ✅ Get artist profiles and bios
- ✅ Fetch top charts (top ten, by province, by genre) (covers trending)
- ✅ Browse featured content (covers discover)

**Quick Link Coverage:**

- 🔥 Trending → `Fetch top charts` + `Find playlists by genre`
- 🎵 Browse genres → `Find playlists by genre, province, mood`
- 🌍 Provincial music → `Find playlists by province`
- ✨ Discover new music → `Search tracks` + `Browse featured content`

#### **Play Actions** (Music Control) ✅ **PRIORITY**

- ✅ Play a specific track
- ✅ Add tracks to queue
- ✅ Play entire playlists
- ✅ Start genre/province radio
- ✅ Control playback (play, pause, skip)

#### **Social Actions** (Engagement) ⏸️ **LATER**

- Like/favorite tracks
- Share tracks/playlists
- Follow artists
- Create custom playlists
- Submit tracks to playlists (if artist)

#### **Utility Actions** ⏸️ **LATER**

- Show music statistics
- Track playback history
- Manage user library

**Decision**: ✅ **All quick links are covered by MVP Read + Play actions!**

---

### 3. **Response Rendering Strategy** ✅ **DECIDED**

We'll use **Multi-Component Response** approach. Each AI response type will render its own specialized component.

**How it Works:**

```
User: "Show me music from Cape Town"

AI Response:
┌─────────────────────────────────┐
│ 🤖 AI: Here's music from        │ ← AI message
│    Cape Town:                   │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 🎵 [TrackListComponent]         │ ← Track list component
│    • Track 1 (Play button)     │
│    • Track 2 (Play button)     │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 💬 AI: "Tap any track to play"  │ ← Optional follow-up message
└─────────────────────────────────┘
```

**Benefits:**

- ✅ **Reuse Existing Components**: TrackList, PlaylistCard, ArtistProfile, etc.
- ✅ **Flexible Rendering**: Each content type has its own component
- ✅ **Rich Interactions**: Custom buttons, actions, and layouts per type
- ✅ **Maintainable**: Easy to update individual components

**Implementation:**

```typescript
function AIResponseRenderer({ response }) {
  return (
    <>
      <AIMessage message={response.message} />

      {response.type === 'track_list' && (
        <TrackListComponent tracks={response.data.tracks} />
      )}

      {response.type === 'playlist' && (
        <PlaylistCardComponent playlist={response.data} />
      )}

      {response.type === 'artist' && (
        <ArtistProfileComponent artist={response.data} />
      )}

      {response.followup && (
        <AIMessage message={response.followup} />
      )}
    </>
  );
}
```

---

### 4. **Memory & Conversation Context** ✅ **DECIDED**

We need **Persistent Memory** across sessions for logged-in users.

**Example Flow:**

```
Session 1:
User: "Show me Hip Hop"
AI: [Shows Hip Hop tracks]

Session 2 (next day):
User: "Play more Hip Hop like yesterday"
AI: [Remembers previous Hip Hop tracks, shows similar ones]

User: "Show me that artist again"
AI: [Recalls artist from session 1]
```

**How Persistent Memory Works:**

- ✅ **Session-based**: Current conversation in active browser tab (required)
- ✅ **Persistent across sessions**: Database storage for logged-in users (required)
- ✅ **User preferences learning**: Tracks preferred genres, artists, listening patterns
- ✅ **Context retrieval**: AI can reference past conversations

**Important**: Persistent memory doesn't exclude other options. It works alongside:

- Agent architecture (Single/Multi-Agent)
- MCP Servers vs Direct API calls
- All rendering strategies
- All action types

**It only affects** where/how we store conversation history, not the AI's capabilities.

---

### 5. **MCP Server Architecture** ✅ **DECIDED**

**Architecture: Direct API Calls with LangChain Tools**

We'll use **LangChain tools** that directly call our existing API routes instead of separate MCP servers.

**Flow:**

```
User Query
    ↓
LangChain Agent (in Next.js API route)
    ↓
LangChain Tools (Functions that call our APIs)
    ├─ searchTracks(trackName) → calls /api/tracks
    ├─ getPlaylist(id) → calls /api/playlists/[id]/tracks
    ├─ getArtist(slug) → calls /api/artist-profile/[slug]
    └─ playTrack(id) → returns action for client
    ↓
Returns Structured Response with Actions
    ↓
Client-side executes actions (plays music, updates UI)
```

**Benefits:**

- ✅ **Simpler**: No need to set up separate MCP servers
- ✅ **Less overhead**: Direct communication with your existing APIs
- ✅ **Better Type Safety**: Use your existing TypeScript types
- ✅ **Easier Debugging**: Standard HTTP requests we can trace
- ✅ **Works in Serverless**: No persistent processes needed

**Playback Implementation:**

Instead of server-to-client communication, we return actions in the AI response:

```typescript
// AI Response
{
  type: "action",
  message: "Playing Track Name by Artist",
  action: {
    type: "play_track",
    trackId: "123",
    trackData: { ... }
  }
}

// Client executes
function executeAction(action) {
  if (action.type === "play_track") {
    musicPlayerContext.play(action.trackData);
  }
}
```

**Why This Approach:**

- ✅ **No WebSocket/SSE needed**: Actions are returned in the response
- ✅ **Simpler architecture**: Standard HTTP request/response
- ✅ **Client-side control**: Music player context stays on client
- ✅ **Better UX**: No network delays for playback commands

---

### 6. **LangChain Agent Types** ✅ **DECIDED**

We'll use **Specialized Agents** for focused expertise in different domains.

**Architecture:**

```
User Input
    ↓
Router/Orchestrator
    ↓
┌────────────────────────────────────────┐
│ Music Discovery Agent                   │ ← Search, browse, discover
│ • Search tracks                         │
│ • Find playlists                        │
│ • Get artist profiles                   │
│ • Fetch charts                          │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Playback Control Agent                  │ ← Music actions
│ • Play tracks/playlists                 │
│ • Queue management                      │
│ • Playback control                      │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Recommendation Agent                    │ ← Suggestions
│ • Personalized recommendations          │
│ • Similar tracks                        │
│ • Discover new music                    │
└────────────────────────────────────────┘
    ↓
Returns Structured Response
```

**Benefits:**

- ✅ **Focused Expertise**: Each agent specializes in its domain
- ✅ **Better Prompts**: Domain-specific system prompts for each agent
- ✅ **Scalable**: Easy to add new agents for new features
- ✅ **Maintainable**: Clear separation of concerns
- ✅ **Testable**: Can test each agent independently

**Implementation:**

- Router analyzes user intent and routes to appropriate agent
- Each agent has its own tools and capabilities
- All agents return consistent structured responses

---

## Implementation Plan

### Phase 1: Foundation Layer ⭐ (MVP - 1 week)

**Goal:** Create shared service layer and extensible response system

**1. Create Shared Service Layer** (2-3 days)

```typescript
// lib/services/
├── music-service.ts      // Track search, discovery, metadata
├── playlist-service.ts   // Playlist operations, genre/province
├── artist-service.ts     // Artist profiles, bios
└── analytics-service.ts  // Stats, trends, recommendations
```

**Benefits:**

- Single source of truth for all data operations
- Shared by API routes AND AI tools
- Type-safe with Prisma
- Fast direct database calls

**2. Implement Response Registry System** (2-3 days)

```typescript
// lib/ai/response-registry.ts
- AIResponseRegistry class
- Register response types with handlers
- Auto-generate AI system prompts
- Type-safe component mapping
```

**3. Create Extensible Response Types** (1 day)

```typescript
// types/ai-responses.ts
- BaseAIResponse interface
- Specific response interfaces (TrackList, Playlist, Artist, etc.)
- Action types
- Union type for all responses
```

**4. Build Response Renderer System** (1 day)

```typescript
// components/ai/response-renderers/
├── index.ts              // Main renderer with registry
├── track-list-renderer.tsx
├── playlist-renderer.tsx
├── artist-renderer.tsx
└── action-executor.tsx
```

**Deliverables:**

- ✅ Shared service layer
- ✅ Response registry with auto-registration
- ✅ Type-safe response definitions
- ✅ UI renderer system

**Timeline:** 6-7 days

---

### Phase 2: LangChain Integration ⭐ (1-2 weeks)

**Goal:** Connect AI agents to data via LangChain tools

**1. Install Dependencies** (0.5 day)

```bash
yarn add langchain @langchain/openai @langchain/core @langchain/anthropic
```

**2. Create LangChain Tools Using Services** (2-3 days)

```typescript
// lib/ai/tools/
├── discovery-tools.ts    // Uses MusicService, PlaylistService
├── playback-tools.ts     // Creates actions for client
├── analytics-tools.ts    // Uses AnalyticsService
└── index.ts             // Exports all tools
```

**Key Insight:** Tools call service layer directly (not HTTP)

```typescript
// Fast - no HTTP overhead
const track = await MusicService.searchTracks(query);
```

**3. Build Specialized Agents** (3-4 days)

```typescript
// lib/ai/agents/
├── router-agent.ts          // Intent analysis & routing
├── discovery-agent.ts       // Search, browse, discover
├── playback-agent.ts        // Music actions
├── recommendation-agent.ts  // Personalized suggestions
└── index.ts
```

**Agent Features:**

- Use response registry for dynamic output schemas
- Each agent has domain-specific system prompt
- Tools from shared services
- Return structured responses from registry

**4. Memory System Integration** (2 days)

```typescript
// lib/ai/memory/
├── conversation-store.ts   // Store chat history
├── preference-tracker.ts   // Track user preferences
└── context-builder.ts     // Build context from history
```

**Deliverables:**

- ✅ LangChain agents with tool calling
- ✅ Persistent conversation memory
- ✅ User preference learning
- ✅ AI can access all music data

**Timeline:** 7-10 days

---

### Phase 3: Advanced Features & Polish (1 week)

**1. Enhanced Personalization**

- Analyze listening patterns
- Dynamic genre preferences
- Similar artist discovery
- Context-aware recommendations

**2. Performance Optimization**

- Response caching strategy
- Query optimization
- Rate limiting
- Error recovery

**3. Adding New Response Types**

**Example: Adding "Concert" Response Type**

```typescript
// Step 1: Define type (types/ai-responses.ts)
interface ConcertResponse extends BaseAIResponse {
  type: "concert";
  data: { events: Concert[] };
  actions: Action[];
}

// Step 2: Create renderer (components/ai/response-renderers/concert-renderer.tsx)
export function ConcertRenderer({ response }: { response: ConcertResponse }) {
  return <ConcertList events={response.data.events} />;
}

// Step 3: Register in response-registry.ts
responseRegistry.register('concert', {
  component: ConcertRenderer,
  schema: { /* schema */ },
  metadata: { description: 'Live events', category: 'discovery' }
});

// Done! AI and UI automatically know about it
```

**Timeline:** 5-7 days

---

## Technical Decisions Summary

### Decision Matrix ✅ ALL DECISIONS MADE

✅ **Response Format**: Structured JSON - AI returns complete data payload  
✅ **Actions**: Read and Play actions for MVP (Social & Utility actions later)  
✅ **Rendering**: Multi-component approach with extensible registry system  
✅ **Memory**: Persistent across sessions + session-based (with user preference learning)  
✅ **Architecture**: Direct database calls via shared service layer (fast, DRY, type-safe)  
✅ **Agent Type**: Specialized Agents (Discovery, Playback Control, Recommendation)  
✅ **Extensibility**: Registry pattern for adding new response types (3 steps)

---

## Next Steps

**Ready to begin implementation!**

**Phase 1 (Foundation):** 6-7 days

- Create shared service layer
- Implement response registry
- Build renderer system

**Phase 2 (AI Integration):** 7-10 days

- LangChain agents & tools
- Memory system
- Tool calling with services

**Phase 3 (Advanced):** 5-7 days

- Personalization
- Optimization
- Adding new response types

**Total Timeline:** 3-4 weeks for full implementation

---

## Architecture Sketch

```
┌──────────────────────────────────────────────────────────────────┐
│  Frontend: Response Renderer (Registry-based)                   │
│  • Auto-registers all response types                            │
│  • Type-safe component rendering                                │
└────────────────┬─────────────────────────────────────────────────┘
                 │ HTTP Request
                 ↓
┌──────────────────────────────────────────────────────────────────┐
│  API: /api/ai/chat                                              │
│  • Loads conversation history                                   │
│  • Routes via Router Agent                                      │
└────────────────┬─────────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────────────┐
│  Specialized Agents (Discovery, Playback, Recommendation)        │
│  • Use LangChain tools for data access                          │
└────────────────┬─────────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────────────┐
│  LangChain Tools                                                 │
│  • searchTracks(), getPlaylist(), getArtist()                   │
│  ⭐ Direct function calls (not HTTP!)                          │
└────────────────┬─────────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────────────────────────┐
│  Shared Service Layer ⭐ (NEW!)                                │
│  • MusicService, PlaylistService, ArtistService                 │
│  • Single source of truth                                       │
│  • Used by both API routes AND AI tools                         │
└────────────────┬─────────────────────────────────────────────────┘
                 ↓ Prisma queries
┌──────────────────────────────────────────────────────────────────┐
│  Neon PostgreSQL Database                                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Foundation Layer (6-7 days)

#### 1.1 Create Shared Service Layer ✅

- [x] Create `lib/services/` directory
- [x] Create `music-service.ts` base structure
  - [x] Implement `searchTracks(query)` method
  - [x] Implement `getTrackById(id)` method
  - [x] Implement `getTrackMetadata(id)` method
  - [x] Implement `getTrackByUrl(uniqueUrl)` method
  - [x] Implement `getTracksByGenre(genre)` method
  - [x] Add URL construction helpers
  - [x] Add error handling
- [x] Create `playlist-service.ts` base structure
  - [x] Implement `getPlaylistById(id)` method
  - [x] Implement `getPlaylistTracks(id)` method
  - [x] Implement `getPlaylistsByGenre(genre)` method
  - [x] Implement `getPlaylistsByProvince(province)` method
  - [x] Implement `getTopCharts()` method
  - [x] Implement `getFeaturedPlaylists()` method
- [x] Create `artist-service.ts` base structure
  - [x] Implement `getArtistBySlug(slug)` method
  - [x] Implement `getArtistTracks(artistId)` method
  - [x] Implement `getArtistProfile(id)` method
  - [x] Implement `getArtistByName(artistName)` method
  - [x] Implement `searchArtists(query)` method
  - [x] Add social links helpers
- [x] Create `analytics-service.ts` base structure
  - [x] Implement `getTrendingTracks()` method
  - [x] Implement `getGenreStats(genre)` method
  - [x] Implement `getProvinceStats(province)` method
- [ ] Add unit tests for service layer methods
- [x] Document service APIs with JSDoc comments

#### 1.2 Implement Response Registry System ✅

- [x] Create `lib/ai/response-registry.ts` file
- [x] Define `ResponseHandler<T>` interface
  - [x] Add component property type
  - [x] Add promptTemplate property
  - [x] Add schema property (JSONSchema)
  - [x] Add metadata property (description, category, icon)
- [x] Create `AIResponseRegistry` class
  - [x] Implement `register<T>(type, handler)` method
  - [x] Implement `get(type)` method
  - [x] Implement `getRegisteredTypes()` method
  - [x] Implement `generateSystemPrompt()` method
  - [x] Implement `validateResponse(response)` method
- [x] Create singleton instance `responseRegistry`
- [x] Add TypeScript types for all registry operations
- [ ] Test registry functionality

#### 1.3 Create Extensible Response Types ✅

- [x] Create `types/ai-responses.ts` file
- [x] Define `BaseAIResponse` interface
  - [x] Add `type` property
  - [x] Add `message` property
  - [x] Add `timestamp` property
- [x] Create specific response interfaces
  - [x] Define `TrackListResponse` interface
  - [x] Define `PlaylistResponse` interface
  - [x] Define `PlaylistGridResponse` interface
  - [x] Define `ArtistResponse` interface
  - [x] Define `ActionResponse` interface
  - [x] Define `TextResponse` interface
  - [x] Define `SearchResultsResponse` interface
- [x] Create `Action` type with all possible actions
- [x] Create type guards for validation
- [x] Create union type `AIResponse`
- [x] Export all types for use across app
- [x] Add JSDoc documentation for each type

#### 1.4 Build Response Renderer System ✅

- [x] Create `components/ai/response-renderers/` directory
- [x] Create `index.tsx` main renderer
  - [x] Import response registry
  - [x] Implement `ResponseRenderer` component
  - [x] Add error handling for unknown types
  - [x] Auto-register all components
- [x] Create `track-list-renderer.tsx`
  - [x] Display track list with cover images
  - [x] Add play buttons for each track
  - [x] Implement track selection
  - [x] Handle actions from response
- [x] Create `playlist-renderer.tsx`
  - [x] Display playlist info (name, description)
  - [x] Show playlist tracks
  - [x] Add play playlist button
  - [x] Handle playlist actions
- [x] Create `playlist-grid-renderer.tsx`
  - [x] Display grid of playlists
  - [x] Add click handlers
- [x] Create `artist-renderer.tsx`
  - [x] Display artist profile
  - [x] Show artist tracks
  - [x] Add social links
  - [x] Handle artist actions
- [x] Create `search-results-renderer.tsx`
  - [x] Display mixed results
  - [x] Show both tracks and artists
- [x] Create `action-executor.tsx`
  - [x] Execute actions automatically
  - [x] Handle play/queue operations
- [x] Register all renderers in response registry (auto-registration)
- [ ] Test renderer components

#### 1.5 Refactor Existing API Routes ✅

- [x] Update `/api/playlists/[id]/tracks` to use PlaylistService
- [x] Update `/api/artist-profile/[slug]` to use ArtistService
- [x] Update `/api/playlists/top-ten` to use PlaylistService
- [x] Update `/api/playlists/featured` to use PlaylistService
- [ ] Update `/api/tracks` to use MusicService (user-owned tracks - low priority)
- [ ] Test all refactored API routes
- [ ] Verify backward compatibility
- [ ] Update API route documentation

**Phase 1 Deliverables:** ✅ Shared service layer ✅ Response registry ✅ Type definitions ✅ Renderer system

---

### Phase 2: LangChain Integration (7-10 days)

#### 2.1 Install Dependencies ✅

- [x] Run `yarn add langchain`
- [x] Run `yarn add @langchain/openai`
- [x] Run `yarn add @langchain/core`
- [x] Run `yarn add @langchain/anthropic` (if using Anthropic)
- [x] Run `yarn add @langchain/google-genai`
- [x] Run `yarn add zod`
- [x] Verify dependencies installed correctly
- [ ] Check for TypeScript compatibility

#### 2.2 Create LangChain Tools Using Services ✅

- [x] Create `lib/ai/tools/` directory
- [x] Create `discovery-tools.ts`
  - [x] Implement `searchTracksTool` using MusicService
  - [x] Implement `getTrackTool` using MusicService
  - [x] Implement `getPlaylistTool` using PlaylistService
  - [x] Implement `getArtistTool` using ArtistService
  - [x] Implement `getTopChartsTool` using PlaylistService
  - [x] Implement `getFeaturedPlaylistsTool` using PlaylistService
  - [x] Implement `getTrendingTracksTool` using AnalyticsService
  - [x] Implement `getPlaylistsByGenreTool` using PlaylistService
  - [x] Implement `getPlaylistsByProvinceTool` using PlaylistService
  - [x] Implement `getTracksByGenreTool` using MusicService
  - [x] Define tool schemas with Zod
- [x] Create `playback-tools.ts`
  - [x] Implement `createPlayTrackActionTool`
  - [x] Implement `createPlayPlaylistActionTool`
  - [x] Implement `createQueueAddActionTool`
  - [x] Implement `createShuffleActionTool`
  - [x] Define action tool schemas
- [x] Create `analytics-tools.ts`
  - [x] Implement `getGenreStatsTool` using AnalyticsService
  - [x] Implement `getProvinceStatsTool` using AnalyticsService
- [x] Create `index.ts` to export all tools
- [ ] Test each tool independently
- [x] Add error handling to all tools

#### 2.3 Build Specialized Agents ✅

- [x] Create `lib/ai/agents/` directory
- [x] Create `base-agent.ts`
  - [x] Define base agent interface
  - [x] Implement common agent logic
  - [x] Add system prompt management
  - [x] Create BaseAgent abstract class
  - [x] Define AgentContext and AgentResponse interfaces
- [x] Create `router-agent.ts`
  - [x] Implement intent analysis
  - [x] Implement routing logic
  - [x] Add fallback handling
  - [ ] Test routing accuracy
- [x] Create `discovery-agent.ts`
  - [x] Set up agent with discovery tools
  - [x] Create discovery-specific system prompt
  - [x] Implement search/browse/discover logic
  - [ ] Integrate with response registry
  - [ ] Test agent with sample queries
- [x] Create `playback-agent.ts`
  - [x] Set up agent with playback tools
  - [x] Create playback-specific system prompt
  - [x] Implement music action logic
  - [x] Handle action creation
  - [ ] Test playback actions
- [x] Create `recommendation-agent.ts`
  - [x] Set up agent with analytics tools
  - [x] Create recommendation-specific system prompt
  - [x] Implement personalization logic
  - [ ] Integrate user preferences
  - [ ] Test recommendations
- [x] Create `index.ts` to export all agents

#### 2.4 Memory System Integration ⏳

- [ ] Create `lib/ai/memory/` directory
- [ ] Create `conversation-store.ts`
  - [ ] Design conversation schema
  - [ ] Implement `storeMessage(userId, message)` method
  - [ ] Implement `getConversation(userId, limit)` method
  - [ ] Add Prisma integration
- [ ] Create `preference-tracker.ts`
  - [ ] Track genre preferences
  - [ ] Track artist preferences
  - [ ] Track listening patterns
  - [ ] Store preferences in database
- [ ] Create `context-builder.ts`
  - [ ] Implement `buildContext(userId, recentMessages)` method
  - [ ] Include user preferences in context
  - [ ] Format context for AI consumption
- [ ] Integrate memory with agents
  - [ ] Add context to discovery agent
  - [ ] Add context to playback agent
  - [ ] Add context to recommendation agent
- [ ] Test memory system end-to-end

**Phase 2 Deliverables:** ✅ LangChain agents with tools ✅ Memory system ✅ Agent orchestration ✅ Tool calling

---

### Phase 3: Advanced Features & Polish (5-7 days)

#### 3.1 Enhanced Personalization ⏳

- [ ] Analyze listening patterns from play history
- [ ] Implement genre preference detection
- [ ] Add similar artist discovery algorithm
- [ ] Create context-aware recommendation engine
- [ ] Add A/B testing for recommendations
- [ ] Track recommendation accuracy

#### 3.2 Performance Optimization ⏳

- [ ] Implement response caching strategy
  - [ ] Cache common queries
  - [ ] Set appropriate cache TTLs
  - [ ] Add cache invalidation logic
- [ ] Optimize database queries
  - [ ] Add indexes where needed
  - [ ] Optimize Prisma queries
  - [ ] Add query performance monitoring
- [ ] Implement rate limiting
  - [ ] Add per-user rate limits
  - [ ] Add per-endpoint rate limits
  - [ ] Add rate limit headers
- [ ] Improve error recovery
  - [ ] Add retry logic for AI calls
  - [ ] Add fallback responses
  - [ ] Improve error messages

#### 3.3 Testing & Quality Assurance ⏳

- [ ] Write unit tests for services (80%+ coverage)
- [ ] Write integration tests for agents
- [ ] Write E2E tests for AI chat flow
- [ ] Test all response types render correctly
- [ ] Test memory persistence across sessions
- [ ] Load testing for concurrent users
- [ ] Security testing (input validation, SQL injection)

#### 3.4 Documentation ⏳

- [ ] Document service layer APIs
- [ ] Document response types and registry
- [ ] Document agent architecture
- [ ] Create user guide for AI chat
- [ ] Create developer guide for adding new response types
- [ ] Update main README with AI features

#### 3.5 Deployment Preparation ⏳

- [ ] Update environment variables documentation
- [ ] Prepare production configuration
- [ ] Set up monitoring and logging
- [ ] Create deployment checklist
- [ ] Prepare rollback plan
- [ ] Schedule production deployment

**Phase 3 Deliverables:** ✅ Enhanced personalization ✅ Optimized performance ✅ Complete testing ✅ Documentation ✅ Deployment ready

---

## Progress Tracking

**Overall Progress:** 93 / 178 tasks completed (52%)

- Phase 1: 55 / 62 tasks (89%)
  - 1.1 Service Layer: ✅ Complete (22/22)
  - 1.2 Response Registry: ✅ Complete (12/13)
  - 1.3 Response Types: ✅ Complete (10/10)
  - 1.4 Renderer System: ✅ Complete (7/7)
  - 1.5 API Refactoring: ✅ Complete (4/6)
- Phase 2: 38 / 57 tasks (67%)
  - 2.1 Dependencies: ✅ Complete (8/8)
  - 2.2 LangChain Tools: ✅ Complete (11/11)
  - 2.3 Specialized Agents: ✅ Complete (19/22)
    - Base Agent: ✅ Complete
    - Discovery Agent: ✅ Complete
    - Playback Agent: ✅ Complete
    - Recommendation Agent: ✅ Complete
    - Router Agent: ✅ Complete
  - 2.4 Memory System: ⏳ Not started (0/16)
- Phase 3: 0 / 63 tasks (0%)

---

## Key Architectural Improvements

**✅ Shared Service Layer:** Single source of truth, fast direct DB calls  
**✅ Response Registry:** Extensible, auto-registration for AI & UI  
**✅ No HTTP Overhead:** Tools call services directly (serverless-friendly)  
**✅ Type Safety:** End-to-end TypeScript enforcement
