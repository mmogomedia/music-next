# AGENTS.md — Flemoji AI Agent System

This document describes the AI agent architecture for Flemoji: how messages flow through the system,
what each agent does, which tools are available, how memory works, and how to extend the system.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Message Flow](#2-message-flow)
3. [Intent Routing](#3-intent-routing)
4. [Agent Reference](#4-agent-reference)
5. [Tools Reference](#5-tools-reference)
6. [Memory System](#6-memory-system)
7. [Response Types](#7-response-types)
8. [Extending the System](#8-extending-the-system)
9. [File Map](#9-file-map)
10. [Debugging](#10-debugging)

---

## 1. Architecture Overview

```
User message
    │
    ▼
POST /api/ai/chat/stream          ← SSE streaming endpoint
    │
    ├─ Load memory (history + preferences + episodic)
    ├─ Build agentContext
    │
    ▼
RouterAgent                       ← Sole orchestrator — routes to one specialist
    │
    ├─ [keyword] confidence ≥ 0.6 → skip LLM, route immediately  (~80% of queries)
    └─ [LLM] confidence < 0.6    → IntentClassifierAgent call
    │
    ▼
Specialist Agent                  ← handles the query, calls tools, returns AIResponse
    │
    ├─ DiscoveryAgent
    ├─ RecommendationAgent
    ├─ PreferencesAgent
    ├─ TimelineAgent
    ├─ HelpAgent
    ├─ ClarificationAgent
    ├─ AbuseGuardAgent
    ├─ FallbackAgent
    └─ IndustryInfoAgent
    │
    ▼
AIResponse { type, message, data, metadata }
    │
    ▼
SSE stream → ResponseRenderer → UI component
```

**Core design principle:** Code makes decisions; LLM generates text.
The router, tool selection, and response conversion are deterministic wherever possible.
LLM calls are reserved for generating the short header sentence and handling truly ambiguous queries.

---

## 2. Message Flow

### SSE Pipeline (`src/app/api/ai/chat/stream/route.ts`)

SSE events emitted in order:

| Event              | Meaning                                      |
| ------------------ | -------------------------------------------- |
| `connected`        | Connection established                       |
| `analyzing_intent` | Keyword routing in progress                  |
| `routing_decision` | Agent selected, routing method (keyword/llm) |
| `agent_processing` | Specialist agent started                     |
| `tool_call`        | Tool being called (dev visibility)           |
| `tool_result`      | Tool returned results (dev visibility)       |
| `response`         | Final `AIResponse` payload                   |
| `complete`         | Stream closed                                |

### Context Assembly

Before routing, the stream route builds `agentContext`:

```typescript
agentContext = {
  userId,
  conversationId,
  conversationHistory,       // last 6 messages
  filters: {
    province,                // user's province (if set) — used in search filters
    // NOTE: genre is intentionally NOT set here — see §3 routing notes
  },
  metadata: {
    chatType,                // 'AI_CHAT' | 'TIMELINE'
    subIntent,               // set by extractDiscoveryMetadata()
    entities,                // { artist?, genre?, query? }
    preferences: {           // from memory system (decay-weighted)
      genres: string[],
      artists: string[],
      moods: string[],
    },
    relevantMemories,        // top-N past conversation summaries (pgvector)
  },
}
```

---

## 3. Intent Routing

### Priority Order in `analyzeIntent()` (`router-intent-detector.ts`)

Evaluated top-to-bottom; first match wins.

| Priority     | Condition                                             | Agent              | Confidence |
| ------------ | ----------------------------------------------------- | ------------------ | ---------- |
| 0            | `chatType === 'TIMELINE'`                             | TimelineAgent      | 1.0        |
| 1            | Follow-up query + known previous intent               | previous agent     | 0.9        |
| 2            | Abuse / off-topic / malicious keywords                | AbuseGuardAgent    | 1.0        |
| 3            | Industry knowledge keywords                           | IndustryInfoAgent  | 1.0        |
| 3a           | Preferences patterns ("my taste", "what do I like")   | PreferencesAgent   | 0.95       |
| 3b           | Help patterns ("how can I search", "what can you do") | HelpAgent          | 0.9        |
| 3c           | Timeline patterns ("posts", "feed", "timeline")       | TimelineAgent      | 0.85       |
| **3d**       | **Unambiguous discovery** (see below)                 | **DiscoveryAgent** | **0.98**   |
| 4            | Keyword scoring (DISCOVERY vs RECOMMENDATION)         | varies             | 0.8–1.0    |
| 5 (fallback) | LLM `IntentClassifierAgent`                           | varies             | from LLM   |

**Priority 3d — Unambiguous Discovery patterns** (always `DiscoveryAgent`):

- `"song/track/music called X"` or `"track named X"` — specific title lookup
- `"show me genres"` / `"what genres"` / `"all genres"` — genre list
- `"trending"` / `"top tracks"` — trending browse

> **Why these are high-priority:** Conversation history is added to the keyword-scoring
> enrichment string. Previous "recommendation" responses can pollute the score and
> misroute "show me all genres" to RecommendationAgent. Priority 3d intercepts before scoring.

### Discovery Sub-Intent Extraction (`extractDiscoveryMetadata`)

When `analyzeIntent` returns `discovery`, RouterAgent calls `extractDiscoveryMetadata()` to
determine which tool to call directly (the "fast path"). Returns `{ subIntent, entities }` or
`null` (falls back to LLM tool selection).

| Sub-intent        | Example trigger                        | Entities extracted       |
| ----------------- | -------------------------------------- | ------------------------ |
| `genres_list`     | "what genres are available"            | —                        |
| `trending`        | "show me trending music"               | —                        |
| `artist_profile`  | "who is Caesar"                        | `{ artist }`             |
| `artist_tracks`   | "music by Caesar", "Caesar's songs"    | `{ artist }`             |
| `genre_tracks`    | "show me amapiano tracks"              | `{ genre }`              |
| `genre_playlists` | "playlists by genre X"                 | `{ genre }`              |
| `search`          | "find si healer lana", "song called X" | `{ query }` (title only) |

> **Important:** "song called X" / "track named X" patterns extract only the title portion —
> e.g., "looking for an afropop song called ngidla ngedwa" → `query: "ngidla ngedwa"`.

### Fast Path (`DiscoveryAgent`)

When `context.metadata.subIntent` is set, DiscoveryAgent skips LLM tool selection entirely
and calls the service directly:

```
subIntent         → service call               → response type
─────────────────────────────────────────────────────────────
genres_list       → prisma.genre.findMany()    → genre_list
trending          → getTrendingTracks()         → track_list
artist_tracks     → searchTracks(artist)        → track_list
artist_profile    → getArtist(name)             → artist
genre_tracks      → getTracksByGenre(genre)     → track_list
genre_playlists   → getPlaylistsByGenre(genre)  → playlist_grid
search            → searchTracks(query)         → track_list
                  ↓ fallback: getTracksByGenre()
```

Result: **0 LLM calls** for ~80% of queries. Typical latency: 50–150 ms.

---

## 4. Agent Reference

### RouterAgent

**File:** `src/lib/ai/agents/router-agent.ts`
**Purpose:** Sole orchestrator. Receives all messages, routes to one specialist, never produces user-facing content.
**Key methods:**

- `route(message, context)` — Main entry point; returns `AgentResponse`
- Emits SSE events via `context.emitEvent`

---

### DiscoveryAgent

**File:** `src/lib/ai/agents/discovery-agent.ts`
**Purpose:** Music search, browsing, genre/playlist discovery — any query where the user wants to find specific content.
**Triggers:** `discovery` intent; "find", "search", "show me X", "song called X", "genres", "trending"
**Tools:** All 8 discovery tools
**Response types:** `track_list`, `playlist`, `playlist_grid`, `artist`, `search_results`, `genre_list`

**Fast path:** Checks `context.metadata.subIntent` first. If set, calls the service directly.
Falls back to LLM tool loop only if service returns empty results or subIntent is null.

**Strength filter:** `minStrength: 70` applies to trending/genre browsing (quality filter).
`minStrength: 0` (no filter) applies to specific title/artist searches.

---

### RecommendationAgent

**File:** `src/lib/ai/agents/recommendation-agent.ts`
**Purpose:** Personalised music recommendations based on user preferences, mood, or similarity requests.
**Triggers:** `recommendation` intent; "recommend", "suggest", "something like", "music for studying", "party vibes"
**Tools:** `analyticsTools` + `discoveryTools`
**Response types:** `track_list`, `playlist_grid`

Extracts "reason" tags from LLM message via regex and attaches them to tracks.
Does not have a fast path — always uses LLM for context-aware reasoning.

---

### PreferencesAgent

**File:** `src/lib/ai/agents/preferences-agent.ts`
**Purpose:** Show the user their stored taste profile.
**Triggers:** "my preferences", "what do I like", "my listening history", "show my taste"
**Tools:** None — reads from `semanticMemoryManager` directly
**Response types:** `user_preferences`

Returns up to 12 genres, 12 artists, 6 moods with decay-weighted scores.
Returns empty state if user is unauthenticated.

---

### TimelineAgent

**File:** `src/lib/ai/agents/timeline-agent.ts`
**Purpose:** Browse and search timeline posts (music news, videos, artist posts).
**Triggers:** `chatType === 'TIMELINE'` OR "posts", "feed", "timeline", "what are people saying"
**Tools:** 4 timeline tools
**Response types:** `timeline_post_list`, `text`

Detects explicit genre mentions and removes the genre filter for genre-agnostic queries
("latest news", "trending posts").

---

### HelpAgent

**File:** `src/lib/ai/agents/help-agent.ts`
**Purpose:** Answer questions about Flemoji features and how to use the chat.
**Triggers:** "how can I search", "what can you do", "how do I find music"
**Tools:** None
**Response types:** `text` with `actions[]` (5 suggested action chips)

---

### ClarificationAgent

**File:** `src/lib/ai/agents/clarification-agent.ts`
**Purpose:** Ask clarifying questions when intent is ambiguous (confidence < 0.3).
**Triggers:** Low-confidence routing or `needsClarification` flag from LLM classifier
**Tools:** None (queries DB for genre options)
**Response types:** `clarification` (interactive radio/checkbox UI)

Shows up to 5 genres from user history + 5 popular genres.

---

### AbuseGuardAgent

**File:** `src/lib/ai/agents/abuse-guard-agent.ts`
**Purpose:** Reject malicious, off-topic, or harmful queries.
**Triggers:** Malicious keywords, non-music off-topic queries (high confidence ≥ 0.8)
**Tools:** None
**Response types:** `text`

---

### FallbackAgent

**File:** `src/lib/ai/agents/fallback-agent.ts`
**Purpose:** Handle queries that cannot be classified.
**Triggers:** `unknown` intent
**Tools:** None
**Response types:** `text` with 3 suggested action chips

---

### IndustryInfoAgent

**File:** `src/lib/ai/agents/industry-info-agent.ts`
**Purpose:** Music industry knowledge (beats, production, royalties, music business).
**Status:** Stub — returns "feature coming soon" message
**Triggers:** Industry keywords (production, mixing, royalties, publishing, etc.)

---

### IntentClassifierAgent

**File:** `src/lib/ai/agents/intent-classifier-agent.ts`
**Purpose:** LLM fallback classifier when keyword confidence < 0.6.
**Returns:** `{ intent, confidence, needsClarification, isMetaQuestion }`
Not a user-facing agent — called internally by RouterAgent only.

---

## 5. Tools Reference

### Discovery Tools (`src/lib/ai/tools/discovery-tools.ts`)

| Tool name                | Purpose                                             | Key params                                            | Max results |
| ------------------------ | --------------------------------------------------- | ----------------------------------------------------- | ----------- |
| `search_tracks`          | Full-text search (title, artist, description)       | `query`, `genre`, `province`, `excludeIds`, `orderBy` | 10          |
| `get_track`              | Fetch single track by ID                            | `trackId`                                             | 1           |
| `get_tracks_by_genre`    | Browse tracks in a genre                            | `genre`, `limit`                                      | 20          |
| `get_playlists_by_genre` | Browse playlists in a genre                         | `genre`, `limit`                                      | 20          |
| `get_trending_tracks`    | Trending tracks (by play count)                     | `genre`, `limit`                                      | 20          |
| `get_top_charts`         | Top chart playlists                                 | `limit`                                               | 20          |
| `get_genres`             | List all active genres (id, name, slug, trackCount) | —                                                     | all         |
| `get_artist`             | Artist profile + bio by ID or name                  | `artistId` or `artistName`                            | 1           |

**Search behaviour:**

- `search_tracks` searches: track title, legacy artist string, description, `artistProfile.artistName`, `primaryArtistIds`, `featuredArtistIds`
- Genre matching is alias-aware and case-insensitive (slug, name, and aliases all checked)
- `strength: 0` tracks are always included (strength=0 means not-yet-scored, not low quality)
- `strength: 46` track with `minStrength: 70` → **excluded** (not 0 and not ≥ 70)

### Analytics Tools (`src/lib/ai/tools/analytics-tools.ts`)

| Tool name            | Purpose                         | Key params            |
| -------------------- | ------------------------------- | --------------------- |
| `get_genre_stats`    | Tracks/plays/topTrack per genre | `genre` (optional)    |
| `get_province_stats` | Tracks/plays per province       | `province` (optional) |

### Timeline Tools (`src/lib/ai/tools/timeline-tools.ts`)

| Tool name                       | Purpose                  | Key params                                                         |
| ------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| `search_timeline_posts`         | Full-text post search    | `query`, `postTypes`, `limit`, `sortBy`                            |
| `get_timeline_feed`             | Browse feed with filters | `postTypes`, `genreId`, `authorId`, `following`, `limit`, `sortBy` |
| `get_featured_timeline_content` | Curated featured posts   | `limit`, `sortBy`                                                  |
| `get_timeline_post`             | Single post details      | `postId`                                                           |

---

## 6. Memory System

### Architecture (`src/lib/ai/memory/`)

The memory system uses the **Adapter Pattern** — a portable core wired to Flemoji's Prisma + OpenAI:

```
bootstrap.ts  ←  wires Flemoji-specific adapters to the portable core
    │
    ├─ PrismaStorageAdapter     (PostgreSQL via Prisma)
    └─ OpenAIEmbeddingAdapter   (text-embedding-3-small, 1536 dims)
```

**Exported singletons** from `bootstrap.ts`:

- `conversationStore` — message history
- `semanticMemoryManager` — preference decay
- `memoryOrchestrator` — combines episodic + semantic
- `contextBuilder` — legacy context (kept for backwards compatibility)

### Three Memory Tiers

#### Working Memory — Conversation History

- Table: `AIConversationMessage`
- Last 6 messages passed to every agent
- Auto-generates conversation title from first exchange

#### Semantic Memory — Preference Decay

- Table: `UserPreference`
- Tracks: genres, artists, moods (explicit + implicit signals)
- Score formula: `score = baseScore × exp(−ln2 × days / halfLife)`
- Explicit signals (likes, saves): weight 1.0
- Implicit signals (plays, queries): weight 0.5
- Half-life: configurable per preference type

#### Episodic Memory — Conversation Embeddings

- Table: `ConversationEmbedding` (pgvector `vector(1536)`)
- Automatically summarised after N messages
- Retrieved by cosine similarity to current message
- Included as "relevant past context" in agent system prompts
- `messageId` is optional — synthetic pipeline IDs are not stored as FK

### Context Injection

Agents receive memory via their system prompt (`buildSystemPromptWithMemory`):

```
## USER MEMORY CONTEXT
Favourite genres: afropop, 3 step, house
Favourite artists: caeser, rich pee
Relevant past context:
- "User searched for Caeser tracks; found Ameva and Ngiyakucela (2025-11-10)"
```

> **Genre filter note:** User's top genre preference is available via
> `context.metadata.preferences.genres[0]` but is intentionally NOT appended to the user
> message as "Context: Genre: X". That caused the LLM to apply genre as a hard filter on
> every search_tracks call, breaking specific song lookups.

---

## 7. Response Types

All types defined in `src/types/ai-responses.ts`. Every `AIResponse` has:

- `type` — discriminated union key
- `message` — short header string (max 15 words, one sentence)
- `data` — type-specific payload
- `metadata` — agent name, tools called, fastPath flag, genre/province
- `actions?` — array of `SuggestedAction` chips

| Type                 | Renderer                 | Data shape                                     |
| -------------------- | ------------------------ | ---------------------------------------------- |
| `text`               | TextRenderer             | `{ message }` + optional `actions[]`           |
| `track_list`         | TrackListRenderer        | `{ tracks[], metadata }`                       |
| `playlist`           | PlaylistRenderer         | `{ playlist }` (with nested tracks)            |
| `playlist_grid`      | PlaylistGridRenderer     | `{ playlists[], metadata }`                    |
| `artist`             | ArtistRenderer           | `{ artist: ArtistProfileComplete }`            |
| `search_results`     | SearchResultsRenderer    | `{ tracks[], artists[], metadata }`            |
| `genre_list`         | GenreListRenderer        | `{ genres[], metadata }`                       |
| `timeline_post_list` | TimelinePostListRenderer | `{ posts[], metadata }`                        |
| `user_preferences`   | PreferencesRenderer      | `{ genres[], artists[], moods[], hasHistory }` |
| `clarification`      | (inline in AIChat)       | `{ questions[], context }`                     |
| `quick_link_track`   | QuickLinkTrackRenderer   | quickLink + track                              |
| `quick_link_album`   | QuickLinkAlbumRenderer   | quickLink + album                              |
| `quick_link_artist`  | QuickLinkArtistRenderer  | quickLink + artist                             |

### Suggested Actions

Every renderer ends with `<SuggestedActions>` chips. Context is derived from real response
metadata, not hard-coded:

- `track_list` / `playlist_grid` → chips use `metadata.genre` + `metadata.province`
- `search_results` / `timeline_post_list` → chips use `metadata.query`
- `text` → chips from `response.actions` filtered by `type === 'send_message'`; falls back
  to `DEFAULT_SUGGESTIONS` if none pass

---

## 8. Extending the System

### Adding a New Agent

1. Create `src/lib/ai/agents/my-agent.ts` extending `BaseAgent`
2. Implement `process(message, context): Promise<AgentResponse>`
3. Add to `AgentIntent` union in `router-agent.ts`
4. Add routing logic in `analyzeIntent()` (`router-intent-detector.ts`)
5. Add `case 'MyAgent'` in RouterAgent's agent dispatch switch
6. Add intent detection keywords to `router-keywords.ts` if needed

```typescript
export class MyAgent extends BaseAgent {
  constructor() {
    super('MyAgent', MY_SYSTEM_PROMPT);
  }

  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    const systemPrompt = this.buildSystemPromptWithMemory(
      this.systemPrompt,
      context
    );
    // ... call tools or services, return AIResponse
  }
}
```

### Adding a New Tool

1. Create the tool with `DynamicStructuredTool` in the appropriate tools file
2. Export it from `src/lib/ai/tools/index.ts`
3. Add it to the relevant agent's tools array
4. Add a handler in `DiscoveryAgent.convertToolDataToResponse()` for the tool name

### Adding a New Response Type

1. Add interface to `src/types/ai-responses.ts`
2. Add to the `AIResponse` discriminated union
3. Register in `RESPONSE_TYPE_MAP` and `isXxxResponse` typeguard
4. Create a renderer in `src/components/ai/response-renderers/`
5. Register in `src/components/ai/response-renderers/index.tsx`

### Adding a Discovery Sub-Intent (Fast Path)

1. Add the sub-intent string to the `DiscoveryMetadata.subIntent` union in `router-intent-detector.ts`
2. Add detection pattern in `extractDiscoveryMetadata()`
3. Add `case 'my_sub_intent':` in `DiscoveryAgent.fastPathProcess()`
4. Call the service and build `toolData`

---

## 9. File Map

```
src/lib/ai/
├── agents/
│   ├── router-agent.ts              Main orchestrator
│   ├── router-intent-detector.ts    Keyword routing + sub-intent extraction
│   ├── router-keywords.ts           Keyword dictionaries
│   ├── intent-classifier-agent.ts   LLM fallback classifier
│   ├── base-agent.ts                Abstract base + shared utilities
│   ├── agent-prompts.ts             All system prompt strings
│   ├── agent-config.ts              Constants (min strength, max tracks, etc.)
│   ├── model-factory.ts             LLM model creation
│   ├── discovery-agent.ts           Search / browse / genre / trending
│   ├── recommendation-agent.ts      Personalised recommendations
│   ├── preferences-agent.ts         User taste profile
│   ├── timeline-agent.ts            Timeline post discovery
│   ├── help-agent.ts                Feature usage help
│   ├── clarification-agent.ts       Ambiguous query handler
│   ├── abuse-guard-agent.ts         Malicious query blocker
│   ├── fallback-agent.ts            Unclassifiable fallback
│   └── industry-info-agent.ts       Industry knowledge (stub)
│
├── tools/
│   ├── discovery-tools.ts           8 search/discovery tools
│   ├── analytics-tools.ts           2 analytics tools
│   ├── timeline-tools.ts            4 timeline tools
│   └── index.ts                     Barrel exports
│
├── memory/
│   ├── bootstrap.ts                 Flemoji adapter wiring + singletons
│   ├── core/
│   │   ├── memory-orchestrator.ts   Combines episodic + semantic
│   │   ├── semantic-memory-manager.ts  Preference decay
│   │   ├── episodic-memory-manager.ts  pgvector conversation summaries
│   │   ├── conversation-store.ts    Message history CRUD
│   │   ├── context-builder.ts       Legacy context (backwards compat)
│   │   └── interfaces/              Storage + embedding + logger contracts
│   └── presets/
│       ├── prisma-storage-adapter.ts   PostgreSQL via Prisma
│       └── openai-embedding-adapter.ts OpenAI embeddings
│
└── tool-executor.ts                 Multi-turn LLM tool call loop

src/app/api/ai/chat/
├── stream/route.ts                  SSE streaming entry point
├── route.ts                         Non-streaming (legacy)
└── conversations/                   Conversation management endpoints

src/components/ai/
├── AIChat.tsx                       Main chat UI + SSE consumer
├── DebugPanel.tsx                   Dev-only live event trace panel
└── response-renderers/
    ├── index.tsx                    Renderer registry
    ├── track-list-renderer.tsx
    ├── playlist-renderer.tsx
    ├── playlist-grid-renderer.tsx
    ├── artist-renderer.tsx
    ├── search-results-renderer.tsx
    ├── genre-list-renderer.tsx
    ├── timeline-post-list-renderer.tsx
    ├── preferences-renderer.tsx
    ├── text-renderer.tsx
    └── suggested-actions.tsx        Shared follow-up chip strip

src/types/
└── ai-responses.ts                  All AIResponse type definitions
```

---

## 10. Debugging

### Dev Debug Panel

A floating debug panel (`DebugPanel.tsx`) is rendered in development builds only.
It shows every SSE event in real-time with colour-coded types, plus a Summary tab showing:

- Routing method (keyword / llm)
- Detected intent + confidence
- Agent selected
- Tools called
- Fast path indicator

### LangSmith Tracing

LLM calls are traced via LangSmith when `LANGCHAIN_TRACING_V2=true` is set.
Traces show: token usage, latency, tool call arguments, tool outputs, reasoning token counts.

Required env vars:

```env
LANGCHAIN_TRACING_V2="true"
LANGCHAIN_API_KEY="..."
LANGCHAIN_PROJECT="flemoji"
LANGCHAIN_ENDPOINT="https://api.smith.langchain.com"
```

### Common Issues

| Symptom                                    | Likely cause                                    | Fix                                                                         |
| ------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------- |
| Track cards not showing, only text         | LLM returned plain text without structured data | Check agent routing — may have gone to wrong agent                          |
| Search returns 0 results                   | Genre filter applied to specific song lookup    | `base-agent.ts formatContext` intentionally excludes genre now              |
| Track exists but not found                 | `strength` is not 0 and not ≥ 70                | Fast path search uses `minStrength: 0`; LLM path tools use configurable min |
| "Show me genres" → recommendation response | Conversation history polluted keyword score     | Priority 3d in `analyzeIntent` catches this before scoring                  |
| Slow responses (10–27s)                    | 3 sequential LLM calls                          | Check if fast path fired — it should for 80%+ of queries                    |
| Duplicate key warning in GenreList         | Genre `id` missing from data                    | Fast path `genres_list` now queries DB directly for full genre objects      |

### Routing Decision Log

Server logs emit the routing decision for every message:

```
[RouterAgent] Routing method: keyword | intent: discovery | confidence: 0.98
[DiscoveryAgent] Fast path: subIntent=search entities={"query":"ngidla ngedwa"}
```

---

_Last Updated: 2026-02-28_
