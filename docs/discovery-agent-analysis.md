# Discovery Agent Analysis

## Overview

This document provides a comprehensive analysis of the Discovery Agent, its tools, response types, and potential sources of inconsistency.

---

## 1. Discovery Tools Inventory

The Discovery Agent has access to **11 tools**:

### 1.1 `search_tracks`

**Purpose**: Search for tracks by query string

**Parameters**:

- `query` (string, required): Search query (title, artist, or description)
- `genre` (string, optional): Genre filter (e.g., "Amapiano", "Afrobeat")
- `province` (string, optional): Province filter (e.g., "Gauteng", "Western Cape")
- `excludeIds` (string[], optional): Array of track IDs to exclude (for pagination)
- `orderBy` (enum, optional, default: 'recent'): Sort order
  - Options: `'recent'` | `'popular'` | `'alphabetical'`

**Backend Call**: `MusicService.searchTracks(query, { genre, province, limit: 10, offset: 0, orderBy, minStrength: 70, excludeIds })`

**Returns**: JSON string with `{ tracks: [...], count: number }`

**Key Features**:

- **HARD LIMIT: Always returns maximum 10 tracks** (never more)
- Enforces `minStrength: 70` filter
- Supports `excludeIds` parameter for pagination (to get next batch of tracks)
- Handles multi-artist names (mentions splitting by "x", "&", "feat", etc.)
- Returns full track metadata including `description`, `attributes`, `mood`, `strength`

---

### 1.2 `get_track`

**Purpose**: Get a specific track by ID

**Parameters**:

- `trackId` (string, required): Track ID

**Backend Call**: `MusicService.getTrackById(trackId)`

**Returns**: JSON string with `{ track: {...} }` or `{ error: "...", track: null }`

**Note**: Returns limited fields (no `attributes`, `mood`, `strength`)

---

### 1.3 `get_playlist`

**Purpose**: Get a playlist with tracks by playlist ID

**Parameters**:

- `playlistId` (string, required): Playlist ID

**Backend Call**: `PlaylistService.getPlaylistById(playlistId)`

**Returns**: JSON string with `{ playlist: { id, name, description, trackCount, tracks: [...] } }`

- Limits tracks to first 10

---

### 1.4 `get_artist`

**Purpose**: Get artist profile with tracks by slug or name

**Parameters**:

- `artistIdentifier` (string, required): Artist slug or name

**Backend Call**: `ArtistService.getArtistBySlug(artistIdentifier)`

**Returns**: JSON string with `{ artist: { id, artistName, bio, genre, location, totalPlays, totalLikes, profileViews, trackCount, tracks: [...] } }`

- Limits tracks to first 10

---

### 1.5 `get_top_charts`

**Purpose**: Get top charts/trending playlists

**Parameters**:

- `limit` (number, optional, default: 10): Number of playlists (1-20, capped at 20)

**Backend Call**: `PlaylistService.getTopCharts(limit)`

**Returns**: JSON string with `{ playlists: [...], count: number }`

---

### 1.6 `get_featured_playlists`

**Purpose**: Get featured playlists

**Parameters**:

- `limit` (number, optional, default: 10): Number of playlists (1-20, capped at 20)

**Backend Call**: `PlaylistService.getFeaturedPlaylists(limit)`

**Returns**: JSON string with `{ playlists: [...], count: number }`

---

### 1.7 `get_trending_tracks`

**Purpose**: Get currently trending tracks

**Parameters**:

- `limit` (number, optional, default: 20): Number of tracks (1-50, capped at 50)

**Backend Call**: `AnalyticsService.getTrendingTracks(limit)`

**Returns**: JSON string with `{ tracks: [...], count: number }`

- Includes `trendingScore` field
- Uses `constructFileUrl(track.filePath)` for `fileUrl`
- Includes `strength` field

---

### 1.8 `get_playlists_by_genre`

**Purpose**: Get playlists filtered by genre

**Parameters**:

- `genre` (string, required): Genre name to filter by
- `limit` (number, optional, default: 20): Number of playlists (1-20, capped at 20)

**Backend Call**: `PlaylistService.getPlaylistsByGenre(genre, limit)`

**Returns**: JSON string with `{ playlists: [...], count: number }`

---

### 1.9 `get_playlists_by_province`

**Purpose**: Get playlists by province

**Parameters**:

- `province` (string, required): Province name
- `limit` (number, optional, default: 20): Number of playlists (1-20, capped at 20)

**Backend Call**: `PlaylistService.getPlaylistsByProvince(province, limit)`

**Returns**: JSON string with `{ playlists: [...], count: number }`

---

### 1.10 `get_tracks_by_genre`

**Purpose**: Get popular tracks in a specific genre

**Parameters**:

- `genre` (string, required): Genre name, slug, or alias
- `limit` (number, optional, default: 20): Number of tracks (1-50, capped at 50)

**Backend Call**: `MusicService.getTracksByGenre(genre, limit, { minStrength: 70 })`

**Returns**: JSON string with `{ tracks: [...], count: number }`

- Enforces `minStrength: 70` filter
- Includes `description`, `attributes`, `mood`, `strength`

---

### 1.11 `get_genres`

**Purpose**: Get list of all available genres

**Parameters**:

- `limit` (number, optional, default: 50): Max genres (1-100, capped at 100)
- `includeInactive` (boolean, optional, default: false): Include inactive genres

**Backend Call**: Direct Prisma query to `prisma.genre.findMany()`

**Returns**: JSON string with `{ genres: [...], count: number }`

- **Special**: Returns immediately as `genre_list` response type (doesn't go through aggregation)

---

## 2. Discovery Agent Response Types

The Discovery Agent can return **6 different response types**:

### 2.1 `track_list` (Most Common)

**When**: When tracks are found (from `search_tracks`, `get_tracks_by_genre`, `get_trending_tracks`)

**Structure**:

```typescript
{
  type: 'track_list',
  message: '',
  timestamp: Date,
  data: {
    tracks: TrackWithArtist[],  // Main tracks
    other?: TrackWithArtist[],  // Up to 3 curated "other" tracks (optional)
    metadata?: {
      genre?: string,
      total?: number
    }
  }
}
```

**Key Features**:

- Tracks filtered by `strength >= 70`
- Genre cluster filtering applied
- "Other tracks" sourced from curated playlists matching genre cluster
- Each track includes `summary` field (from `description`)

---

### 2.2 `playlist`

**When**: User wants to compile/create a playlist (`detectCompileIntent` returns true)

**Structure**:

```typescript
{
  type: 'playlist',
  message: string,
  timestamp: Date,
  data: PlaylistWithTracks  // Virtual compiled playlist
}
```

**Key Features**:

- Created from tracks found via `get_tracks_by_genre` or `search_tracks`
- Max 50 tracks
- Playlist name derived from genre or "Curated Playlist"

---

### 2.3 `playlist_grid`

**When**: Only playlists found (no tracks, no artists)

**Structure**:

```typescript
{
  type: 'playlist_grid',
  message: '',
  timestamp: Date,
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

---

### 2.4 `artist`

**When**: Single artist found

**Structure**:

```typescript
{
  type: 'artist',
  message: '',
  timestamp: Date,
  data: ArtistProfileComplete
}
```

---

### 2.5 `search_results`

**When**: Mixed results (tracks + artists) OR multiple artists only

**Structure**:

```typescript
{
  type: 'search_results',
  message: '',
  timestamp: Date,
  data: {
    tracks?: TrackWithArtist[],
    artists?: ArtistProfileComplete[],
    metadata?: {
      query?: string,
      total?: number
    }
  }
}
```

---

### 2.6 `genre_list`

**When**: `get_genres` tool is called

**Structure**:

```typescript
{
  type: 'genre_list',
  message: '',
  timestamp: Date,
  data: {
    genres: GenreInfo[],
    metadata?: {
      total?: number
    }
  }
}
```

**Note**: Returns immediately, bypasses aggregation logic

---

## 3. Tool Parameter Usage Analysis

### 3.1 How Parameters Are Used

**`search_tracks` Tool**:

- `query`: Passed directly to `MusicService.searchTracks(query, ...)`
- `genre`: Applied as filter in backend query
- `province`: Applied as filter in backend query
- `limit`: Capped at 50, passed to backend
- `orderBy`: Controls sort order (`recent` | `popular` | `alphabetical`)

**`get_tracks_by_genre` Tool**:

- `genre`: Matched against genre name, slug, or aliases in database
- `limit`: Capped at 50, passed to backend

**`get_trending_tracks` Tool**:

- `limit`: Capped at 50, passed to backend
- No filters - returns trending tracks based on analytics

---

### 3.2 Default Values

**✅ FIXED**: `searchTracksTool` now has **hard limit of 10 tracks**:

- Removed `limit` parameter from schema (no longer configurable)
- Function always uses `limit: 10` (hard limit)
- Added `excludeIds` parameter for pagination when more tracks are needed

---

## 4. System Prompt Analysis

### 4.1 Current Prompt Structure

```
1. Role definition
2. Available actions (SEARCH, BROWSE, DISCOVER, ARTIST, COMPILE PLAYLIST)
3. Response guidelines
```

### 4.2 Key Instructions

**Track Title Extraction**:

- "When users ask for a specific track, extract ONLY the track title/name"
- Examples: "show me a song called X" → use "X"
- This is mentioned but may not be enforced strongly enough

**Tool Selection**:

- SEARCH: Use `search_tracks`
- BROWSE: Use `get_playlists_by_genre`
- DISCOVER: Use `get_trending_tracks`, `get_top_charts`
- ARTIST: Use `get_artist`, `search_artists`
- COMPILE: Use `get_tracks_by_genre` or `search_tracks` (NOT `get_genres`)

**Response Guidelines**:

- Enforce quality filter (strength >= 70)
- Use track description as primary blurb
- Leverage attributes/mood for thematic queries
- Limit "Other Tracks" to 3 from curated playlists

---

### 4.3 Potential Issues with Current Prompt

1. **Ambiguity in Tool Selection**:
   - No clear priority when multiple tools could apply
   - Example: "Find Amapiano tracks" could use:
     - `search_tracks` with `genre: "Amapiano"`
     - `get_tracks_by_genre` with `genre: "Amapiano"`
     - Both might return different results!

2. **No Guidance on Parameter Usage**:
   - When to use `orderBy: 'popular'` vs `'recent'`?
   - When to set `limit` higher/lower?
   - When to use `genre` filter vs searching by genre name in query?

3. **Track Title Extraction Not Enforced**:
   - Instructions exist but LLM might still pass full phrases
   - No examples of what NOT to do

4. **No Guidance on Multiple Tool Calls**:
   - Should it call multiple tools in parallel?
   - Should it try different approaches if first fails?
   - No clear strategy

---

## 5. Sources of Inconsistency

### 5.1 LLM Non-Determinism

- **Temperature**: Model temperature affects randomness
- **Tool Selection**: LLM chooses which tools to call (can vary)
- **Parameter Values**: LLM decides parameter values (can vary)

### 5.2 Tool Parameter Variations

- **Different `limit` values**: Same query might use `limit: 10` vs `limit: 20`
- **Different `orderBy` values**: `'recent'` vs `'popular'` returns different tracks
- **Query string variations**: "Ameva" vs "song called Ameva" vs "track Ameva"

### 5.3 Multiple Tool Calls

- LLM might call `search_tracks` multiple times with different parameters
- Results aggregated, but order/number of calls varies

### 5.4 Backend Query Variations

- `MusicService.searchTracks` uses text search (can vary)
- Genre matching uses fuzzy logic (can vary)
- Database state changes between calls

### 5.5 Post-Processing Variations

- Genre cluster resolution (can vary if genre not clear)
- "Other tracks" selection uses weighted random sampling (non-deterministic)
- Deduplication order affects final results

---

## 6. Questions for Discussion

### 6.1 Tool Selection Strategy

1. **Should we enforce a specific tool selection strategy?**
   - For genre queries: Always use `get_tracks_by_genre` instead of `search_tracks`?
   - For track name queries: Always use `search_tracks` with extracted title?

2. **Should we prevent multiple tool calls for the same intent?**
   - Currently LLM can call `search_tracks` multiple times
   - Should we deduplicate or prevent redundant calls?

### 6.2 Parameter Standardization

3. **Should we standardize default parameters?**
   - Fix the `limit` default mismatch (20 vs 10)
   - Set consistent `orderBy` defaults based on query type?

4. **Should we enforce parameter values based on query type?**
   - Track name queries: `limit: 10`, `orderBy: 'recent'`
   - Genre queries: `limit: 20`, `orderBy: 'popular'`
   - Thematic queries: `limit: 20`, use `attributes` filter

### 6.3 Prompt Improvements

5. **Should we add more explicit examples?**
   - Examples of correct tool usage
   - Examples of incorrect tool usage (what NOT to do)
   - Examples of parameter selection

6. **Should we add decision trees to the prompt?**
   - "If user asks for track by name → use search_tracks with extracted title"
   - "If user asks for genre → use get_tracks_by_genre"
   - "If user asks for theme → use search_tracks with attributes filter"

### 6.4 Post-Processing

7. **Should we make "other tracks" selection deterministic?**
   - Currently uses weighted random sampling
   - Could use deterministic selection (e.g., top by playCount)

8. **Should we standardize result ordering?**
   - Always sort by playCount descending?
   - Always sort by strength descending?
   - Keep current order from tools?

### 6.5 Error Handling

9. **What should happen when a tool returns no results?**
   - Try alternative tools?
   - Try different parameters?
   - Return empty result immediately?

---

## 7. Recommendations for Standardization

### 7.1 Immediate Fixes

1. ✅ **Fixed `limit` hard limit** in `searchTracksTool` - now always returns max 10 tracks
2. ✅ **Added `excludeIds` parameter** for pagination support
3. **Standardize `fileUrl` construction** across all tools (currently inconsistent)
4. **Add explicit tool selection rules** to system prompt

### 7.2 Prompt Enhancements

4. **Add decision tree** for tool selection
5. **Add examples** of correct/incorrect tool usage
6. **Specify parameter selection** guidelines
7. **Enforce track title extraction** more strongly

### 7.3 Code-Level Standardization

8. **Add tool selection preprocessor** (before LLM decides)
9. **Standardize parameter defaults** based on query type
10. **Make "other tracks" selection deterministic** (or at least seed-based)

### 7.4 Testing & Validation

11. **Add query normalization** before passing to LLM
12. **Log tool selection decisions** for analysis
13. **Add response consistency tests** (same query → same results)

---

## 8. Next Steps

Please review this analysis and let me know:

1. Which inconsistencies are most problematic for you?
2. What level of determinism do you want? (100% deterministic vs some randomness OK)
3. Should we prioritize prompt improvements or code-level fixes?
4. Are there specific query patterns that consistently give different results?

Then we can create a focused plan to standardize the discovery agent's behavior.
