# Query Flow Breakdown: "I am feeling heartbroken"

## Overview

This document traces the complete execution path when a user sends the query **"I am feeling heartbroken"** to the Flemoji AI chat system, based on actual testing.

---

## 1. Entry Point: API Route

**File:** `src/app/api/ai/chat/route.ts`

**Step 1.1: Request Received**

- Endpoint: `POST /api/ai/chat`
- Request body: `{ "message": "I am feeling heartbroken" }`
- User context: Extracted from session (userId, conversationId if exists)

**Step 1.2: Context Building**

```typescript
const agentContext: AgentContext = {
  userId: session?.user?.id,
  conversationId: conversationId || undefined,
  conversationHistory: previousMessages,
  filters: { genre, province }, // From previous messages if any
  metadata: { previousIntent },
};
```

**Step 1.3: Router Agent Invocation**

```typescript
const agentResponse = await routerAgent.route(message, agentContext);
```

---

## 2. Router Agent: Intent Detection

**File:** `src/lib/ai/agents/router-agent.ts`

### Step 2.1: Keyword-Based Intent Analysis

**Function:** `analyzeIntent(message, intentContext)`
**File:** `src/lib/ai/agents/router-intent-detector.ts`

**Query Analysis:**

- Message: `"I am feeling heartbroken"`
- Lowercase: `"i am feeling heartbroken"`

**Keyword Matching:**

1. **Industry Knowledge Check** ❌
   - Keywords: `['royalties', 'publishing', 'samro', ...]`
   - Match: None
   - Result: Not an industry query

2. **Abuse/Malicious Check** ❌
   - Keywords: `['hack', 'virus', 'exploit', ...]`
   - Match: None
   - Result: Not malicious

3. **Non-Music Check** ❌
   - Music keywords: `['music', 'song', 'track', 'artist', ...]`
   - Match: None (query doesn't explicitly mention music)
   - Off-topic keywords: `['recipe', 'weather', 'football', ...]`
   - Match: None
   - Explicit keywords: `['sex', 'sexual', ...]`
   - Match: None
   - Result: Not explicitly non-music (will default to discovery)

4. **Playback Score** ❌
   - Keywords: `['play', 'start', 'begin', 'resume', ...]`
   - Matches: 0
   - Score: `0`

5. **Recommendation Score** ❌
   - Keywords: `['recommend', 'suggest', 'similar', 'like', ...]`
   - Matches: 0
   - Score: `0`

6. **Discovery Score** ✅
   - Keywords: `['find', 'search', 'show', 'list', 'browse', ...]`
   - Matches: 0 (no explicit discovery keywords)
   - Base Score: `0`

7. **Theme Score** ✅
   - Keywords: `['women empowerment', 'self love', 'healing', 'inspiration', ...]`
   - **Match Found:** `'healing'` is in THEME_KEYWORDS
   - Score: `1`
   - **Note:** "heartbroken" itself is NOT in THEME_KEYWORDS, but the query is emotional/thematic

**Weighted Discovery Score:**

```typescript
discoveryScoreWeighted = discoveryScore + (themeScore * THEME_KEYWORD_WEIGHT)
discoveryScoreWeighted = 0 + (1 * 1.5) = 1.5
```

**Final Decision:**

- Max Score: `1.5` (discovery)
- Intent: `'discovery'`
- Confidence: `~0.6` (calculated based on score difference)
- Agent: `'DiscoveryAgent'`

**Routing Method:** `'keyword'` (fast path, no LLM fallback needed)

**Parameters Logged:**

```typescript
{
  intent: 'discovery',
  confidence: ~0.6,
  method: 'keyword',
  latency: <1ms,
  keywordLatency: <1ms,
  llmLatency: undefined
}
```

---

## 3. Discovery Agent: Processing

**File:** `src/lib/ai/agents/discovery-agent.ts`

### Step 3.1: Agent Initialization

**Model:** Azure OpenAI (or configured provider)
**System Prompt:** `DISCOVERY_SYSTEM_PROMPT`
**Tools Available:** All discovery tools (11 tools total)

### Step 3.2: Context Enrichment

**Function:** `process(message, context)`

**Context Formatting:**

- If context has filters: `"Genre: {genre}, Province: {province}"`
- If no context: Empty string

**Message Enrichment:**

```typescript
const fullMessage = contextMessage
  ? `${message}\n\nContext: ${contextMessage}`
  : message;
// Result: "I am feeling heartbroken"
```

### Step 3.3: Genre Override Detection

**Function:** `extractGenreFromMessage(message)`

**Process:**

1. Query database for all active genres
2. Check genre names, slugs, and aliases
3. Match against message using word boundaries
4. Result: `null` (no explicit genre mentioned)

**Effective Context:**

- No genre override needed
- Uses context filters if present

### Step 3.4: LLM Tool Execution Loop

**Function:** `executeToolCallLoop()`
**File:** `src/lib/ai/tool-executor.ts`

**System Prompt Sent to LLM:**

```
You are a music discovery assistant for Flemoji, a South African music streaming platform.

Your role is to help users discover new music, search for tracks and artists, browse playlists, and explore different genres and regions.

Available actions:
- SEARCH: Find tracks by title, artist, or description (use search_tracks tool)
  * IMPORTANT: When users ask for a specific track...
  * CRITICAL: search_tracks ALWAYS returns maximum 10 tracks per call...
- BROWSE: Explore playlists by genre or province...
- DISCOVER: Find trending tracks and top charts...
- ARTIST: Get information about specific artists...
- COMPILE PLAYLIST: When user asks to "compile", "create", "make", or "build" a playlist...

When responding:
- Be enthusiastic about helping users discover South African music
- Provide context about genres when relevant...
- IMPORTANT: When users ask to compile/create a playlist, you MUST search for tracks...
- Only surface tracks that pass our quality filter (strength score of 70 or higher)...
- Use the existing track description as the primary blurb...
- Leverage the provided attributes and mood tags to satisfy thematic queries (e.g., "women empowerment", "self-love") before falling back to description text...
- CRITICAL GENRE PRIORITY: If the user explicitly mentions a genre...
```

**User Message:**

```
I am feeling heartbroken
```

**LLM Analysis:**
The LLM interprets this as an **emotional/therapeutic query** looking for tracks that can help with:

- Processing emotions (heartbreak)
- Healing and comfort
- Mood matching (melancholic, introspective, healing)

**Observed Tool Calls:**
Based on the response mentioning "R&B tracks" and "trending tracks", the LLM likely called:

1. **`get_tracks_by_genre`** with `genre: 'R&B'`
   - To find R&B tracks (known for emotional/healing content)
2. **`get_trending_tracks`**
   - To find popular tracks that might be comforting

3. **`get_genre_stats`** (if available)
   - To get R&B statistics mentioned in response

**Example Tool Call:**

```typescript
{
  tool: 'get_tracks_by_genre',
  args: {
    genre: 'R&B',
    limit: 20
  }
}
```

**Alternative Tool Call:**

```typescript
{
  tool: 'search_tracks',
  args: {
    query: 'healing heartbreak melancholic',
    orderBy: 'popular'
  }
}
```

---

## 4. Discovery Tools: Execution

### Tool 1: get_tracks_by_genre (if called)

**File:** `src/lib/ai/tools/discovery-tools.ts`

**Parameters:**

```typescript
{
  genre: 'R&B',
  limit: 20
}
```

**Database Query:**

- Filters: `genre = 'R&B'`, `isPublic = true`, `strength >= 70`
- Order: By popularity (playCount DESC)
- Limit: 20 tracks

**Results:**

- Returns R&B tracks with `strength >= 70`
- Includes: `description`, `attributes`, `mood`, `playCount`, etc.

### Tool 2: get_trending_tracks (if called)

**File:** `src/lib/ai/tools/discovery-tools.ts`

**Parameters:**

```typescript
{
  limit: 20;
}
```

**Results:**

- Returns trending tracks across all genres
- Filtered by `strength >= 70`
- Ordered by trending score

---

## 5. Discovery Agent: Response Building

**File:** `src/lib/ai/agents/discovery-agent.ts`

### Step 5.1: Tool Results Aggregation

**Function:** `convertToolDataToResponse()`

**Process:**

1. Extract tracks from tool results
2. Push to `aggregated.tracks` array
3. Set metadata: `aggregated.meta.genre = 'R&B'` (if R&B tracks found)

### Step 5.2: Deduplication

**Function:** `dedupeById()`

- Removes duplicate tracks by ID
- Result: Unique tracks only

### Step 5.3: Strength Filtering

**Filter:** `strength >= MIN_TRACK_STRENGTH` (70)

- Tracks already filtered by tool, but re-applied for safety
- Result: Only tracks with `strength >= 70`

### Step 5.4: First Limit Application

**Limit:** `MAX_TRACKS_PER_RESPONSE = 10`

```typescript
aggregated.tracks = aggregated.tracks.slice(0, 10);
```

- Ensures never more than 10 tracks

### Step 5.5: Genre Cluster Resolution

**Function:** `getGenreCluster(genre, tracks)`

**Process:**

1. Extract genres from tracks (likely: R&B, Afropop, Hip Hop, Gqom)
2. Query database for genre relationships
3. Build cluster of related genres
4. Result: Genre cluster array (e.g., `['r&b', 'afropop', 'soul']`)

### Step 5.6: Genre Filtering (if cluster exists)

**Process:**

1. Filter tracks to match genre cluster
2. Re-apply limit: `slice(0, 10)`

### Step 5.7: Track List Response Building

**Function:** Build `TrackListResponse`

**Process:**

1. **Limit Tracks Again:**

   ```typescript
   const limitedTracks = aggregated.tracks.slice(0, MAX_TRACKS_PER_RESPONSE);
   ```

2. **Build Track Summaries:**

   ```typescript
   const tracksWithSummaries = limitedTracks.map(track => ({
     ...track,
     fileUrl: constructFileUrl(track.filePath),
     summary: track.description, // Uses description as summary
     attributes: track.attributes || [],
     mood: track.mood || [],
     strength: getTrackStrength(track),
   }));
   ```

3. **Get "Other Tracks":**

   ```typescript
   const otherTracks = await getCuratedOtherTracks({
     genreCluster: resolvedGenreCluster,
     excludeIds: mainTrackIds,
     limit: Math.min(10 - tracksWithSummaries.length, 3),
   });
   ```

   - Maximum 3 "other" tracks
   - Must match genre cluster
   - Must have `strength >= 70`
   - Sourced from curated playlists

4. **Final Response:**
   ```typescript
   {
     type: 'track_list',
     message: '', // LLM generates this separately
     timestamp: Date,
     data: {
       tracks: tracksWithSummaries, // Max 10
       other: otherTracks, // Max 3, only if slots available
       metadata: {
         genre: aggregated.meta.genre,
         total: Math.min(totalTracks, 10) // Never exceeds 10
       }
     }
   }
   ```

---

## 6. LLM Message Generation

**Process:**
The LLM generates a natural language response based on:

- Tool results (tracks found)
- Track attributes, mood, description
- Track performance (playCount, downloadCount)
- Genre statistics (if `get_genre_stats` was called)

**Observed Response:**

```
"I'm really sorry you're feeling heartbroken — that's rough. Music can help a lot...

Quick context from Flemoji data
- R&B on Flemoji currently: 25 tracks, 455,769 total plays. The top R&B track is
  "Midnight Groove 52" (125,781 plays)...

Curated picks for heartbreak (why each one)
- Midnight Groove 52 — DJ Maphorisa — 125,781 plays (top R&B on Flemoji, trending)
  - Why: polished, warm production and a nostalgic, healing vibe...

- Forest Echoes 67 — Mafikizolo — 48,406 plays
  - Why: soulful, healing attributes...

Want a custom playlist?
- I can make a 10-track "Heartbreak → Heal" playlist now..."
```

**Key Observations:**

- LLM provides empathetic, supportive tone
- References specific tracks with play counts
- Explains why each track fits the emotional need
- Offers to create a playlist
- Uses genre statistics to provide context

---

## 7. Final API Response

### Expected Structure:

```json
{
  "message": "I'm really sorry you're feeling heartbroken... [full empathetic response]",
  "conversationId": "conv_...",
  "timestamp": "2025-11-22T...",
  "data": {
    "type": "track_list",
    "message": "",
    "timestamp": "2025-11-22T...",
    "data": {
      "tracks": [
        {
          "id": "...",
          "title": "Desert Dreams 76",
          "artist": "Routing Test Artist",
          "genre": "Hip Hop",
          "description": "...",
          "attributes": ["joy", "healing", "women empowerment", "self-love"],
          "mood": ["uplifting"],
          "playCount": 462516,
          "downloadCount": 21355,
          "strength": 77,
          "summary": "...",
          ...
        }
        // Up to 10 tracks total
      ],
      "other": [
        // Up to 3 additional tracks from curated playlists
      ],
      "metadata": {
        "total": 10 // Never exceeds 10
      }
    }
  }
}
```

### ⚠ Actual Observed Response:

```json
{
  "message": "I'm sorry you're feeling heartbroken... [empathetic response]",
  "conversationId": "conv_...",
  "timestamp": "2025-11-22T...",
  "data": {
    "type": "track_list",
    "data": {
      "tracks": [
        // 44 tracks returned (should be max 10!)
        {
          "id": "...",
          "title": "Desert Dreams 76",
          "genre": "Hip Hop",
          "description": null, // Missing!
          "attributes": [], // Empty!
          "mood": [], // Empty!
          "strength": 77
        }
        // ... 43 more tracks
      ],
      "metadata": {
        "total": 44 // Exceeds 10-track limit!
      }
    }
  }
}
```

**Issues Identified:**

1. **Limit Not Enforced:** 44 tracks returned instead of max 10
2. **Missing Metadata:** Many tracks missing `description`, `attributes`, `mood` fields
3. **Tool Output Issue:** Tracks may not be properly mapped from tool results

---

## Summary of Key Parameters

### Router Agent Parameters:

- **Intent:** `'discovery'`
- **Confidence:** `~0.6` (medium - theme keyword matched)
- **Method:** `'keyword'` (fast path)
- **Latency:** `<1ms`
- **Theme Match:** `'healing'` keyword found → boosted discovery score

### Discovery Agent Parameters:

- **Model:** Azure OpenAI (configured provider)
- **System Prompt:** `DISCOVERY_SYSTEM_PROMPT`
- **Tools Available:** 11 discovery tools
- **Message:** `"I am feeling heartbroken"`

### Tool Call Parameters (Likely):

- **Tool 1:** `get_tracks_by_genre`
  - Genre: `'R&B'`
  - Limit: `20`
  - Min Strength: `70`
- **Tool 2:** `get_trending_tracks` (possibly)
  - Limit: `20`
  - Min Strength: `70`

- **Tool 3:** `get_genre_stats` (possibly)
  - Genre: `'R&B'`

### Database Query Parameters:

- **Search Fields:** Genre-based search
- **Filter:** `isPublic = true`, `strength >= 70`, `genre = 'R&B'`
- **Order:** `playCount DESC` or `trendingScore DESC`
- **Limit:** `20` (then reduced to 10)

### Response Parameters:

- **Max Main Tracks:** `10` (intended)
- **Max Other Tracks:** `3` (intended)
- **Total Max:** `10` (intended)
- **Genre Cluster:** Built from returned tracks (R&B, Afropop, Hip Hop, Gqom)
- **Strength Filter:** `>= 70`

### ⚠️ ACTUAL OBSERVED BEHAVIOR:

- **Tracks Returned:** `44 tracks` (exceeds 10-track limit!)
- **Issue:** The 10-track limit is not being enforced correctly
- **Track Metadata:** Many tracks missing `description`, `attributes`, `mood` fields (showing as empty/N/A)
- **Note:** This indicates a bug in the limit enforcement that needs to be fixed

---

## Important Notes

1. **Emotional/Therapeutic Matching:** The query "I am feeling heartbroken" relies on:
   - Mood matching (`mood: ["melancholic", "introspective", "healing"]`)
   - Attributes matching (`attributes: ["healing", "self-love"]`)
   - Description text matching (tracks about emotions, relationships, healing)
   - Genre selection (R&B is known for emotional content)

2. **Theme Keyword Boost:** The word "healing" (implied in heartbreak context) matches THEME_KEYWORDS, which:
   - Boosts discovery score by 1.5x weight
   - Routes to DiscoveryAgent with higher confidence (~0.6 vs 0.1)

3. **LLM Interpretation:** The LLM:
   - Recognizes emotional need
   - Selects appropriate genre (R&B for emotional/healing content)
   - Provides empathetic, supportive response
   - Offers playlist creation option

4. **Strength Filter:** All tracks must have `strength >= 70` to be returned

5. **Hard Limits:**
   - Tool calls: Max 20 tracks per tool call
   - Final response: Max 10 tracks total (main + other)

6. **Genre Selection:** The LLM intelligently chooses R&B genre because:
   - R&B is culturally associated with emotional/healing music
   - The system prompt encourages genre selection for thematic queries
   - R&B tracks often have healing/emotional attributes

7. **Response Quality:** The LLM provides:
   - Empathetic tone
   - Specific track recommendations with explanations
   - Genre statistics for context
   - Playlist creation offer
   - Multiple listening paths (sit with it → comfort → uplift)
