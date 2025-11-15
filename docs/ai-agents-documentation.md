# AI Agents Documentation

## Overview

The Flemoji AI system uses a multi-agent architecture with specialized agents for different types of user queries. All agents use Azure OpenAI as the primary provider (with fallbacks to OpenAI, Anthropic, and Google).

## Agent Architecture

```
User Query
    ↓
RouterAgent (analyzes intent)
    ↓
Specialized Agent (Discovery/Playback/Recommendation)
    ↓
Tool Execution (database queries)
    ↓
Structured Response
```

## Available Agents

### 1. RouterAgent

**Purpose:** Routes user queries to the appropriate specialized agent based on intent analysis.

**Location:** `src/lib/ai/agents/router-agent.ts`

**Responsibilities:**

- Analyzes user message to determine intent
- Routes to Discovery, Playback, or Recommendation agent
- Defaults to DiscoveryAgent for unknown intents

**Intent Types:**

- `discovery` - Search, find, browse queries
- `playback` - Play, queue, control playback
- `recommendation` - Suggest, recommend, similar music
- `unknown` - Falls back to discovery

**Routing Logic:**

- **Playback keywords:** play, start, begin, resume, pause, stop, shuffle, queue, add to, next, previous, skip
- **Recommendation keywords:** recommend, suggest, similar, like, discover, new music, fresh, what should i, tell me what, help me find, best, top, what else, else is good, other good
- **Discovery keywords:** find, search, show, list, browse, look for, what is, who is, tell me about, artist, album, playlist, trending, track, song

---

### 2. DiscoveryAgent

**Purpose:** Handles music discovery, search, and browsing operations.

**Location:** `src/lib/ai/agents/discovery-agent.ts`

**System Prompt:**

- Specialized for music discovery on Flemoji
- Helps users discover new music, search for tracks and artists, browse playlists
- Explores different genres and regions
- Provides context about South African music genres

**Available Actions:**

- **SEARCH:** Find tracks by title, artist, or description
- **BROWSE:** Explore playlists by genre or province
- **DISCOVER:** Find trending tracks and top charts
- **ARTIST:** Get information about specific artists
- **GENRES:** List available genres on the platform

**Tools Used:**

- `discoveryTools` - All discovery-related tools (search_tracks, get_tracks_by_genre, get_playlists_by_genre, etc.)

**Response Types Returned:**

1. **`genre_list`** - List of available genres

   ```typescript
   {
     type: 'genre_list',
     data: {
       genres: GenreInfo[],
       metadata?: {
         total?: number
       }
     }
   }
   ```

   - **When:** User asks about available genres, "what genres exist", "show me genres"
   - **Tool:** `get_genres`
   - **Fields:**
     - `genres: GenreInfo[]` - List of genres with id, name, slug, description, colorHex, icon, trackCount

2. **`track_list`** - List of tracks

   ```typescript
   {
     type: 'track_list',
     data: {
       tracks: TrackWithArtist[],
       other?: TrackWithArtist[], // Featured tracks (up to 5)
       metadata?: {
         genre?: string,
         total?: number
       }
     }
   }
   ```

   - **When:** Search queries, genre queries, trending tracks
   - **Features:**
     - Tracks include AI-generated summaries (if Azure OpenAI configured)
     - "other" field contains featured tracks from playlists (if available)
     - Handles multi-artist tracks (splits by "x", "&", "feat", etc.)

3. **`playlist_grid`** - Grid of playlists

   ```typescript
   {
     type: 'playlist_grid',
     data: {
       playlists: PlaylistInfo[],
       metadata?: {
         genre?: string,
         province?: string,
         total?: number
       }
     }
   }
   ```

   - **When:** Playlist browse queries, genre playlists, province playlists

4. **`artist`** - Artist profile

   ```typescript
   {
     type: 'artist',
     data: ArtistProfileComplete
   }
   ```

   - **When:** Artist queries, "tell me about [artist]"

5. **`search_results`** - Mixed results (tracks + artists)

   ```typescript
   {
     type: 'search_results',
     data: {
       tracks?: TrackWithArtist[],
       artists?: ArtistProfileComplete[],
       metadata?: {
         query: string,
         total?: number
       }
     }
   }
   ```

   - **When:** General search queries that match both tracks and artists

**Special Features:**

- **Track Summaries:** Generates AI summaries for tracks (2-3 sentences) using Azure OpenAI
- **Multi-Artist Handling:** Automatically splits multi-artist names (e.g., "Caeser x MLT zA") and searches for each artist individually
- **Featured Tracks:** Includes "other" field with up to 5 featured tracks from playlists

---

### 3. PlaybackAgent

**Purpose:** Handles music playback control and actions.

**Location:** `src/lib/ai/agents/playback-agent.ts`

**System Prompt:**

- Specialized for music playback control
- Creates actions to play tracks, playlists, manage queue
- Brief and action-oriented responses

**Available Actions:**

- **PLAY TRACK:** Play a specific track
- **PLAY PLAYLIST:** Play a complete playlist
- **QUEUE:** Add tracks to the playback queue
- **SHUFFLE:** Shuffle the current playback

**Tools Used:**

- `playbackTools` - Playback-related tools

**Response Types Returned:**

1. **`action`** - Playback action

   ```typescript
   {
     type: 'action',
     action: {
       type: 'play_track' | 'play_playlist' | 'queue_add' | 'queue_replace' | 'shuffle',
       label: string,
       data: {
         trackId?: string,
         playlistId?: string
       }
     }
   }
   ```

   - **When:** User requests to play music

2. **`track_list`** - Tracks to play

   ```typescript
   {
     type: 'track_list',
     data: {
       tracks: TrackWithArtist[]
     },
     actions?: Action[]
   }
   ```

   - **When:** User requests tracks with playback actions

---

### 4. RecommendationAgent

**Purpose:** Provides personalized music recommendations.

**Location:** `src/lib/ai/agents/recommendation-agent.ts`

**System Prompt:**

- Specialized for personalized recommendations
- Uses analytics and trends data
- Explains why specific tracks/artists are recommended

**Available Data Sources:**

- **TRENDING:** Current trending tracks
- **GENRE STATS:** Statistics by genre
- **PROVINCE STATS:** Regional music statistics
- **USER HISTORY:** User's listening patterns (if available)

**Tools Used:**

- `analyticsTools` - Analytics and statistics tools
- `discoveryTools` - For finding tracks to recommend

**Response Types Returned:**

1. **`track_list`** - Recommended tracks

   ```typescript
   {
     type: 'track_list',
     data: {
       tracks: TrackWithArtist[],
       metadata?: {
         genre?: string,
         total?: number
       }
     }
   }
   ```

   - **When:** User asks for recommendations

2. **`playlist_grid`** - Recommended playlists

   ```typescript
   {
     type: 'playlist_grid',
     data: {
       playlists: PlaylistInfo[]
     }
   }
   ```

   - **When:** User asks for playlist recommendations

---

## Response Type Reference

### Complete List of Response Types

| Type                | Description                 | Returned By                                        |
| ------------------- | --------------------------- | -------------------------------------------------- |
| `text`              | Simple conversational text  | All agents (fallback)                              |
| `track_list`        | List of tracks              | DiscoveryAgent, PlaybackAgent, RecommendationAgent |
| `playlist`          | Single playlist with tracks | DiscoveryAgent                                     |
| `playlist_grid`     | Grid of playlists           | DiscoveryAgent, RecommendationAgent                |
| `artist`            | Artist profile              | DiscoveryAgent                                     |
| `search_results`    | Mixed tracks + artists      | DiscoveryAgent                                     |
| `action`            | Playback action             | PlaybackAgent                                      |
| `genre_list`        | List of genres              | DiscoveryAgent                                     |
| `quick_link_track`  | Quick link track data       | DiscoveryAgent                                     |
| `quick_link_album`  | Quick link album data       | DiscoveryAgent                                     |
| `quick_link_artist` | Quick link artist data      | DiscoveryAgent                                     |

### Response Type Details

#### TrackListResponse

- **Fields:**
  - `tracks: TrackWithArtist[]` - Main tracks
  - `other?: TrackWithArtist[]` - Featured/other tracks (up to 5)
  - `summary?: string` - AI-generated summary (for single track results)
  - `metadata?: { genre?, total?, query? }`
- **Special Features:**
  - Tracks include `summary` field (AI-generated, 2-3 sentences)
  - `other` field contains featured tracks from playlists
  - All tracks include `downloadCount` field

#### PlaylistGridResponse

- **Fields:**
  - `playlists: PlaylistInfo[]`
  - `metadata?: { genre?, province?, total? }`

#### ArtistResponse

- **Fields:**
  - `data: ArtistProfileComplete` - Full artist profile with top tracks

#### SearchResultsResponse

- **Fields:**
  - `tracks?: TrackWithArtist[]`
  - `artists?: ArtistProfileComplete[]`
  - `metadata?: { query, total? }`

#### ActionResponse

- **Fields:**
  - `action: Action` - Action to execute
  - `success?: boolean`

#### GenreListResponse

- **Fields:**
  - `genres: GenreInfo[]` - List of genres
  - `metadata?: { total? }`
- **GenreInfo Fields:**
  - `id: string`
  - `name: string`
  - `slug: string`
  - `description?: string`
  - `colorHex?: string`
  - `icon?: string`
  - `trackCount?: number`

---

## AI Provider Configuration

**Primary Provider:** Azure OpenAI

- **Default Model:** `gpt-5-mini` (via `AZURE_OPENAI_API_DEPLOYMENT_NAME`)
- **API Version:** `2024-10-21` (via `AZURE_OPENAI_API_VERSION`)
- **Temperature:** `1` (required for gpt-5-mini)

**Fallback Providers:**

- OpenAI (gpt-4o-mini)
- Anthropic (claude-3-5-sonnet-20241022)
- Google (gemini-1.5-pro)

**Configuration:**

- Environment variables in `.env.local` and Vercel
- See `docs/ai-setup.md` for setup instructions

---

## Tool Execution

All agents use the **central tool-call executor** (`src/lib/ai/tool-executor.ts`):

- Executes tool calls from LLM responses
- Handles multiple tool calls in sequence
- Feeds results back to LLM for final response
- Loops until LLM provides final answer

---

## Multi-Artist Track Handling

**DiscoveryAgent** automatically handles multi-artist tracks:

- Splits artist names by: "x", "&", "feat", "ft", "featuring", ","
- Makes separate searches for each artist
- Example: "Caeser x MLT zA" → searches for "Caeser" and "MLT zA" separately
- Combines results from all searches

---

## Track Summaries

**DiscoveryAgent** generates AI summaries for tracks:

- Uses Azure OpenAI (gpt-5-mini)
- 2-3 sentence summaries
- Highlights genre, artist, popularity
- Only generated if Azure OpenAI is fully configured
- Summaries included in `track.summary` field

---

## Last Updated

**Date:** 2025-01-12
**Version:** Current (with Azure OpenAI integration, multi-artist handling, track summaries)

---

## Related Documentation

- `docs/ai-setup.md` - Setup and configuration
- `docs/ai-testing-guide.md` - Testing procedures
- `docs/ai-response-types-testing-results.md` - Response type testing results
- `docs/ai-integration-complete.md` - Integration status
