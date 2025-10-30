# Source Tracking System

## Overview

The source tracking system records where users initiate music playback from across the application. This enables analytics to understand user behavior patterns and content discovery paths.

## Core Components

### 1. Type Definitions (`/src/types/stats.ts`)

```typescript
export type SourceType =
  | 'landing'    // Landing page plays
  | 'playlist'   // Playlist-based plays (featured, top-ten, genre, provincial)
  | 'search'     // Search result plays
  | 'direct'     // Direct track access
  | 'share'      // Shared track plays
  | 'player';    // Default fallback

export type PlatformType =
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'whatsapp'
  | 'copy_link'
  | 'embed';

export interface UseStatsOptions {
  trackId?: string;
  playlistId?: string;
  source?: SourceType;
}
```

### 2. Stats Hook (`/src/hooks/useStats.ts`)

The `useStats` hook provides tracking functions with source awareness:

```typescript
const { trackPlayStart, trackPlayEnd, trackLike, trackShare, trackDownload } = useStats(options);
```

**Key Features:**
- **Minimum Play Duration**: 20 seconds before recording a play event
- **Source Priority**: Direct parameters override hook options
- **Session Management**: Automatic session ID generation
- **User Context**: Integrates with authentication

### 3. Music Player Context (`/src/contexts/MusicPlayerContext.tsx`)

Central music player with integrated source tracking:

```typescript
const playTrack = (track: Track, source: SourceType = 'player', playlistId?: string) => {
  // Updates source state and calls trackPlayStart with direct parameters
  setCurrentSource(source);
  setCurrentPlaylistId(playlistId);
  trackPlayStart(track.id, source, playlistId);
};
```

## Source Mapping by Component

### Playlist Components (Source: `'playlist'`)

| Component | Playlist Type | Playlist ID Source |
|-----------|---------------|-------------------|
| `StreamingHero` | Featured | `data.playlist?.id` from `/api/playlists/featured` |
| `MusicStreaming` | Active Playlist | `activePlaylist?.id` from selected playlist |
| `TopTenTracks` | Top Ten | `data.playlist?.id` from `/api/playlists/top-ten` |
| `ProvincialPlaylists` | Provincial | Selected playlist ID from dropdown |
| `GenrePlaylists` | Genre | Selected playlist ID from dropdown |

### Admin Components (Source: `'admin'`)

| Component | Description |
|-----------|-------------|
| `TrackManagement` | Admin track management interface |
| `SubmissionReview` | Track submission review interface |

### Dashboard Components (Source: `'dashboard'`)

| Component | Description |
|-----------|-------------|
| `Dashboard Page` | Main dashboard track plays |

## Implementation Rules

### 1. Play Button Implementation

**Required Pattern:**
```typescript
const handlePlay = (track: Track) => {
  playTrack(track, 'playlist' as SourceType, playlistId);
  onTrackPlay?.(track);
};
```

**Key Requirements:**
- Always pass explicit `source` parameter
- Include `playlistId` for playlist-based components
- Use appropriate `SourceType` for component context

### 2. Playlist ID Management

**For Playlist Components:**
```typescript
// 1. Add state for playlist ID
const [playlistId, setPlaylistId] = useState<string | undefined>();

// 2. Capture from API response
if (data.tracks && data.tracks.length > 0) {
  setTracks(data.tracks);
  setPlaylistId(data.playlist?.id);
}

// 3. Pass to playTrack
playTrack(track, 'playlist' as SourceType, playlistId);
```

### 3. Source Type Guidelines

| Context | Source Type | When to Use |
|---------|-------------|-------------|
| Featured tracks | `'playlist'` | Always |
| Top ten tracks | `'playlist'` | Always |
| Genre playlists | `'playlist'` | Always |
| Provincial playlists | `'playlist'` | Always |
| Admin interfaces | `'admin'` | Always |
| Dashboard | `'dashboard'` | Always |
| Search results | `'search'` | When implemented |
| Shared links | `'share'` | When implemented |
| Direct access | `'direct'` | When implemented |

### 4. API Response Requirements

**Playlist APIs must return:**
```json
{
  "playlist": {
    "id": "playlist_id_here",
    "name": "Playlist Name",
    // ... other playlist fields
  },
  "tracks": [
    // ... track objects
  ]
}
```

## Database Schema

### Play Events Table
```sql
CREATE TABLE play_events (
  id STRING PRIMARY KEY,
  track_id STRING NOT NULL,
  user_id STRING,
  session_id STRING NOT NULL,
  source STRING NOT NULL,        -- SourceType enum
  playlist_id STRING,            -- Optional playlist ID
  duration INTEGER,              -- Play duration in seconds
  timestamp DATETIME NOT NULL,
  user_agent STRING,
  ip_address STRING
);
```

## Analytics Queries

### Popular Sources
```sql
SELECT source, COUNT(*) as play_count
FROM play_events
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY source
ORDER BY play_count DESC;
```

### Playlist Performance
```sql
SELECT 
  p.name as playlist_name,
  pe.source,
  COUNT(*) as play_count
FROM play_events pe
JOIN playlists p ON pe.playlist_id = p.id
WHERE pe.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY p.id, p.name, pe.source
ORDER BY play_count DESC;
```

## Testing Requirements

### Unit Tests
- Test `useStats` hook with different source types
- Test `playTrack` function parameter passing
- Test playlist ID extraction from API responses

### Integration Tests
- Test complete play flow from UI to database
- Test source tracking across all components
- Test minimum play duration enforcement

### Manual Testing Checklist
- [ ] Featured playlist plays show `source: 'playlist'`
- [ ] Top ten plays show `source: 'playlist'`
- [ ] Genre playlist plays show `source: 'playlist'`
- [ ] Provincial playlist plays show `source: 'playlist'`
- [ ] Admin plays show `source: 'admin'`
- [ ] Dashboard plays show `source: 'dashboard'`
- [ ] Play events only recorded after 20 seconds
- [ ] Playlist IDs correctly captured and stored

## Maintenance

### Adding New Components
1. Import `SourceType` from `@/types/stats`
2. Determine appropriate source type for component
3. Implement `handlePlay` with explicit source parameter
4. Add playlist ID management if playlist-based
5. Update this documentation

### Modifying Source Types
1. Update `SourceType` enum in `/src/types/stats.ts`
2. Update all components using the modified type
3. Update database schema if needed
4. Update analytics queries
5. Update this documentation

## Troubleshooting

### Common Issues

**Source showing as 'player':**
- Check if component is passing explicit source parameter
- Verify `playTrack` call includes source type
- Check if timing issue with state updates

**Missing playlist ID:**
- Verify API response includes `playlist` object
- Check playlist ID extraction logic
- Ensure playlist ID is passed to `playTrack`

**Play events not recorded:**
- Check minimum play duration (20 seconds)
- Verify `trackPlayStart` is called
- Check for errors in stats API endpoint

### Debug Mode
Enable debug logging by adding console.log statements in:
- `useStats.ts` - `trackPlayStart` function
- `MusicPlayerContext.tsx` - `playTrack` function
- Component `handlePlay` functions

## Performance Considerations

- Source tracking adds minimal overhead
- Playlist ID lookups are cached in component state
- Stats API calls are batched when possible
- Session IDs are generated once per session

## Security

- Source tracking data is not sensitive
- Playlist IDs are public identifiers
- User sessions are tracked for analytics only
- IP addresses are captured for geographic analytics
