# Query Flow Breakdown: "A celebration of culture and heritage"

## Overview

This document traces the complete execution path when a user sends the query **"A celebration of culture and heritage"** to the Flemoji AI chat system.

---

## 1. Entry Point: API Route

**File:** `src/app/api/ai/chat/route.ts`

**Step 1.1: Request Received**

- Endpoint: `POST /api/ai/chat`
- Request body: `{ "message": "A celebration of culture and heritage" }`
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

- Message: `"A celebration of culture and heritage"`
- Lowercase: `"a celebration of culture and heritage"`

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
   - Matches: 0 (no exact theme keyword matches)
   - Score: `0`
   - **Note:** "celebration", "culture", "heritage" are NOT in THEME_KEYWORDS list

**Weighted Discovery Score:**

```typescript
discoveryScoreWeighted = discoveryScore + (themeScore * THEME_KEYWORD_WEIGHT)
discoveryScoreWeighted = 0 + (0 * 1.5) = 0
```

**Final Decision:**

- Max Score: `0`
- Intent: `'discovery'` (default when no keywords match)
- Confidence: `0.1` (low confidence - no keyword matches)
- Agent: `'DiscoveryAgent'`

**Routing Method:** `'keyword'` (fast path, no LLM fallback needed since default is discovery)

**Parameters Logged:**

```typescript
{
  intent: 'discovery',
  confidence: 0.1,
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
// Result: "A celebration of culture and heritage"
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
A celebration of culture and heritage
```

**LLM Analysis:**
The LLM interprets this as a **thematic query** looking for tracks with attributes related to:

- "celebration"
- "culture"
- "heritage"

**Tool Selection Decision:**
The LLM chooses `search_tracks` because:

1. The query is thematic (attributes-based)
2. No specific track/artist mentioned
3. No genre explicitly mentioned
4. The system prompt instructs to use `search_tracks` for thematic queries

**Tool Call Made:**

```typescript
{
  tool: 'search_tracks',
  args: {
    query: 'celebration culture heritage', // LLM extracts key terms
    genre: undefined, // No genre filter
    province: undefined, // No province filter
    excludeIds: undefined, // First call
    orderBy: 'popular' // LLM chooses popular for thematic relevance
  }
}
```

---

## 4. Discovery Tool: search_tracks

**File:** `src/lib/ai/tools/discovery-tools.ts`

### Step 4.1: Tool Execution

**Function:** `searchTracksTool.func()`

**Parameters Received:**

```typescript
{
  query: 'celebration culture heritage',
  genre: undefined,
  province: undefined,
  excludeIds: undefined,
  orderBy: 'popular'
}
```

### Step 4.2: MusicService.searchTracks Call

**File:** `src/lib/services/music-service.ts`

**Function:** `MusicService.searchTracks(query, options)`

**Database Query Built:**

```typescript
const where = {
  isPublic: true,
  OR: [
    {
      title: { contains: 'celebration culture heritage', mode: 'insensitive' },
    },
    {
      artist: { contains: 'celebration culture heritage', mode: 'insensitive' },
    },
    {
      description: {
        contains: 'celebration culture heritage',
        mode: 'insensitive',
      },
    },
  ],
  // Genre filter: None (genre is undefined)
  // Province filter: None (province is undefined)
  // Strength filter: minStrength = 70 (enforced)
  // Exclude IDs: None
};
```

**SQL Query (conceptual):**

```sql
SELECT * FROM tracks
WHERE is_public = true
  AND strength >= 70
  AND (
    LOWER(title) LIKE '%celebration culture heritage%'
    OR LOWER(artist) LIKE '%celebration culture heritage%'
    OR LOWER(description) LIKE '%celebration culture heritage%'
  )
ORDER BY play_count DESC -- orderBy: 'popular'
LIMIT 10 -- Hard limit enforced
```

**Note:** The search also checks the `attributes` array field, but Prisma's `contains` doesn't work directly on arrays. The LLM relies on description matching, and the backend filters by `strength >= 70`.

### Step 4.3: Results Processing

**Tracks Returned:**

- Filtered by: `strength >= 70`
- Limited to: `10 tracks maximum`
- Ordered by: `playCount DESC` (popular)

**Track Mapping:**
Each track is mapped to include:

```typescript
{
  id: string,
  title: string,
  artist: string,
  genre: string | null,
  duration: number,
  playCount: number,
  likeCount: number,
  coverImageUrl: string | null,
  uniqueUrl: string,
  filePath: string,
  fileUrl: string, // Constructed from filePath
  artistId: string,
  userId: string,
  createdAt: Date,
  updatedAt: Date,
  albumArtwork: string | null,
  isDownloadable: boolean,
  description: string | null,
  attributes: string[], // e.g., ["joy", "healing", "women empowerment", "self-love"]
  mood: string[], // e.g., ["uplifting"]
  downloadCount: number,
  strength: number // Must be >= 70
}
```

**Tool Response:**

```json
{
  "tracks": [...], // Array of up to 10 tracks
  "count": 10
}
```

---

## 5. Discovery Agent: Response Building

**File:** `src/lib/ai/agents/discovery-agent.ts`

### Step 5.1: Tool Results Aggregation

**Function:** `convertToolDataToResponse()`

**Process:**

1. Extract tracks from `search_tracks` tool result
2. Push to `aggregated.tracks` array
3. Set metadata: `aggregated.meta.genre = undefined` (no genre in result)

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

1. Extract genres from tracks
2. Query database for genre relationships (parent, sub-genres, aliases)
3. Build cluster of related genres
4. Result: Genre cluster array (e.g., `['afropop', 'afrobeat', 'amapiano']`)

**Note:** Since no explicit genre was mentioned, cluster is built from returned tracks.

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

## 6. LLM Behavior: Two Possible Paths

### Path A: Direct Tool Execution (Expected)

The LLM calls `search_tracks` tool immediately with extracted keywords.

**Tool Call:**

```typescript
{
  tool: 'search_tracks',
  args: {
    query: 'celebration culture heritage',
    orderBy: 'popular'
  }
}
```

**Then generates response** based on tool results.

### Path B: Clarifying Questions (Observed)

The LLM may ask clarifying questions before calling tools, especially if:

- The query is ambiguous
- The query suggests playlist creation
- The LLM wants to understand user preferences

**Observed Response:**

```
"Love that idea — sounds like a beautiful playlist theme. I can put together a
'Celebration of Culture & Heritage' mix...

Quick choices so I build the right playlist for you:
- Do you want upbeat party vibes, reflective/listening vibes, or a mix of both?
- Any genres to prioritise...
- Region or language focus...
- How many tracks would you like (10, 15, 25)?

Say 'Yes, build it' plus your preferences and I'll compile a playlist..."
```

**Note:** In this case, no tools are called yet, and no structured data is returned. The user must provide clarification before tools are executed.

---

## 7. Final API Response

### Path A: With Tool Results (When Tools Are Called)

**Structure:**

```json
{
  "message": "I found some tracks celebrating culture and heritage!...",
  "conversationId": "conv_...",
  "timestamp": "2025-01-22T...",
  "data": {
    "type": "track_list",
    "message": "",
    "timestamp": "2025-01-22T...",
    "data": {
      "tracks": [
        {
          "id": "...",
          "title": "...",
          "artist": "...",
          "genre": "...",
          "description": "...",
          "attributes": ["celebration", "culture", "heritage"],
          "mood": ["uplifting"],
          "playCount": 1234,
          "downloadCount": 567,
          "strength": 85,
          "summary": "...",
          ...
        }
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

### Path B: Clarifying Questions (When LLM Asks First)

**Structure:**

```json
{
  "message": "Love that idea — sounds like a beautiful playlist theme... [clarifying questions]",
  "conversationId": "conv_...",
  "timestamp": "2025-01-22T..."
  // No "data" field - no structured response yet
}
```

**Note:** The LLM's behavior can vary. It may:

1. Call tools immediately and return tracks
2. Ask clarifying questions first, then call tools on follow-up
3. Detect compile intent and ask for playlist preferences

The actual behavior depends on:

- Query ambiguity
- LLM interpretation
- System prompt guidance
- Context from previous messages

---

## Summary of Key Parameters

### Router Agent Parameters:

- **Intent:** `'discovery'`
- **Confidence:** `0.1` (low - no keyword matches)
- **Method:** `'keyword'` (fast path)
- **Latency:** `<1ms`

### Discovery Agent Parameters:

- **Model:** Azure OpenAI (configured provider)
- **System Prompt:** `DISCOVERY_SYSTEM_PROMPT`
- **Tools Available:** 11 discovery tools
- **Message:** `"A celebration of culture and heritage"`

### Tool Call Parameters:

- **Tool:** `search_tracks`
- **Query:** `"celebration culture heritage"` (LLM extracted)
- **Genre:** `undefined`
- **Province:** `undefined`
- **Order By:** `'popular'`
- **Limit:** `10` (hard limit)
- **Min Strength:** `70`

### Database Query Parameters:

- **Search Fields:** `title`, `artist`, `description`
- **Filter:** `isPublic = true`, `strength >= 70`
- **Order:** `playCount DESC`
- **Limit:** `10`

### Response Parameters:

- **Max Main Tracks:** `10`
- **Max Other Tracks:** `3`
- **Total Max:** `10`
- **Genre Cluster:** Built from returned tracks
- **Strength Filter:** `>= 70`

---

## Important Notes

1. **Thematic Matching:** The query "celebration of culture and heritage" relies on:
   - Description text matching (`description` field contains these terms)
   - Attributes array matching (if tracks have `attributes: ["celebration", "culture", "heritage"]`)
   - The LLM extracts key terms and searches for them

2. **No Explicit Genre:** Since no genre is mentioned, the system:
   - Searches across all genres
   - Builds genre cluster from returned tracks
   - Filters "other tracks" to match the cluster

3. **Strength Filter:** All tracks must have `strength >= 70` to be returned

4. **Hard Limits:**
   - `search_tracks` tool: Max 10 tracks per call
   - Final response: Max 10 tracks total (main + other)

5. **LLM Tool Selection:** The LLM chooses `search_tracks` because:
   - It's a thematic query (not a specific track/artist)
   - The system prompt instructs to use `search_tracks` for thematic queries
   - No explicit genre to use `get_tracks_by_genre`

6. **LLM Behavior Variability:**
   - The LLM may ask clarifying questions before calling tools
   - This is especially common for ambiguous queries or playlist creation requests
   - The actual tool calls depend on LLM interpretation and context
   - **Observed behavior:** For "A celebration of culture and heritage", the LLM often asks clarifying questions about playlist preferences before executing tools

7. **Actual vs Expected:**
   - **Expected:** LLM calls `search_tracks` immediately
   - **Observed:** LLM may ask questions first, requiring user follow-up
   - Both behaviors are valid and depend on LLM interpretation
