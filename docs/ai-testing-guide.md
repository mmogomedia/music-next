# AI System Testing Guide

## Overview

This guide provides instructions for testing the AI agent system and LangChain tools integration.

## Current Implementation Status

✅ **Phase 1 Complete (89%)**

- Service Layer (Music, Playlist, Artist, Analytics)
- Response Registry System
- Response Types & Renderers
- API Routes Refactored

✅ **Phase 2 Complete (67%)**

- LangChain Dependencies Installed
- 16 LangChain Tools Created
- 4 Specialized Agents + Router
- Multi-Provider Support

⏳ **Phase 2.4 Not Started**

- Memory System Integration

## Prerequisites

1. **Environment Variables**
   - At least one AI provider API key configured:
     - `AZURE_OPENAI_API_KEY` (recommended)
     - `AZURE_OPENAI_ENDPOINT`
     - `AZURE_OPENAI_API_DEPLOYMENT_NAME`
     - `OPENAI_API_KEY`
     - `ANTHROPIC_API_KEY`
     - `GOOGLE_GENERATIVE_AI_API_KEY`

2. **Database**
   - Neon PostgreSQL database running
   - Sample data (tracks, playlists, artists) loaded

## Testing the Service Layer

### Test Music Service

```typescript
import { MusicService } from '@/lib/services';

// Search for tracks
const results = await MusicService.searchTracks('Amapiano', {
  genre: 'Amapiano',
  limit: 10,
});

// Get specific track
const track = await MusicService.getTrackById('track-id');

// Get trending tracks
const trending = await MusicService.getTrendingTracks(20);
```

### Test Playlist Service

```typescript
import { PlaylistService } from '@/lib/services';

// Get playlist by ID
const playlist = await PlaylistService.getPlaylistById('playlist-id');

// Get featured playlists
const featured = await PlaylistService.getFeaturedPlaylists(10);

// Get playlists by genre
const genrePlaylists = await PlaylistService.getPlaylistsByGenre(
  'Amapiano',
  10
);
```

### Test Artist Service

```typescript
import { ArtistService } from '@/lib/services';

// Get artist by slug
const artist = await ArtistService.getArtistBySlug('artist-slug');

// Search for artists
const artists = await ArtistService.searchArtists('Caeser', 10);
```

## Testing LangChain Tools

### Test Discovery Tools

```typescript
import { discoveryTools } from '@/lib/ai/tools';

// Test track search tool
const searchResults = await discoveryTools[0].func({
  query: 'Amapiano',
  limit: 10,
  orderBy: 'popular',
});
console.log('Search Results:', searchResults);

// Test get artist tool
const artistData = await discoveryTools[3].func({
  artistIdentifier: 'caeser',
});
console.log('Artist Data:', artistData);
```

### Test Playback Tools

```typescript
import { playbackTools } from '@/lib/ai/tools';

// Test create play track action
const action = await playbackTools[0].func({
  trackId: 'track-id',
  label: 'Play Track',
});
console.log('Play Action:', action);
```

### Test Analytics Tools

```typescript
import { analyticsTools } from '@/lib/ai/tools';

// Test genre stats
const genreStats = await analyticsTools[0].func({
  genre: 'Amapiano',
});
console.log('Genre Stats:', genreStats);
```

## Testing Specialized Agents

### Test Discovery Agent

```typescript
import { DiscoveryAgent } from '@/lib/ai/agents';

const agent = new DiscoveryAgent('openai');

// Test search query
const response = await agent.process(
  'Find me Amapiano tracks from Johannesburg',
  {
    filters: {
      genre: 'Amapiano',
      province: 'Gauteng',
    },
  }
);

console.log('Discovery Response:', response);
```

### Test Playback Agent

```typescript
import { PlaybackAgent } from '@/lib/ai/agents';

const agent = new PlaybackAgent('openai');

// Test playback command
const response = await agent.process('Play the trending Amapiano tracks');
console.log('Playback Response:', response);
```

### Test Recommendation Agent

```typescript
import { RecommendationAgent } from '@/lib/ai/agents';

const agent = new RecommendationAgent('openai');

// Test recommendation request
const response = await agent.process(
  'Recommend me music similar to what I listen to',
  {
    userId: 'user-id',
  }
);
console.log('Recommendation Response:', response);
```

### Test Router Agent

```typescript
import { RouterAgent } from '@/lib/ai/agents';

const router = new RouterAgent('openai');

// Test intent routing
const response1 = await router.route('Find me some new music');
console.log('Query 1 Response:', response1);

const response2 = await router.route('Play the top Amapiano tracks');
console.log('Query 2 Response:', response2);

const response3 = await router.route('What should I listen to?');
console.log('Query 3 Response:', response3);

// Test intent analysis
const decision = router.getRoutingDecision('Show me trending tracks');
console.log('Routing Decision:', decision);
// Should output: { intent: 'discovery', confidence: 0.x, agent: 'DiscoveryAgent' }
```

## Integration Testing

### Test Full Flow with API Endpoint

1. **Start Development Server**

   ```bash
   yarn dev
   ```

2. **Test AI Chat Endpoint**

   ```bash
   curl -X POST http://localhost:3000/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Find me Amapiano tracks",
       "provider": "openai"
     }'
   ```

3. **Test with Context**
   ```bash
   curl -X POST http://localhost:3000/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Show me more like this",
       "context": {
         "userId": "user-id",
         "artistProfile": "caeser",
         "genre": "Amapiano"
       }
     }'
   ```

### Test Frontend Integration

1. **Navigate to Chat Page**
   - Go to `http://localhost:3000/(chat)`
   - Or `http://localhost:3000` and click AI Chat

2. **Test Discovery Queries**
   - "Find me Amapiano tracks"
   - "Show me artists from Johannesburg"
   - "What are the trending tracks?"

3. **Test Playback Queries**
   - "Play the top Amapiano playlist"
   - "Queue trending tracks"
   - "Start playing"

4. **Test Recommendation Queries**
   - "Recommend music for me"
   - "What should I listen to?"
   - "Show me similar artists"

## Manual Testing Checklist

### Router Agent Intent Recognition

- [ ] Discovery Intent
  - [ ] "Find me music"
  - [ ] "Search for tracks"
  - [ ] "Show me playlists"
  - [ ] "Browse Amapiano"

- [ ] Playback Intent
  - [ ] "Play track XYZ"
  - [ ] "Start playing"
  - [ ] "Add to queue"
  - [ ] "Shuffle playlist"

- [ ] Recommendation Intent
  - [ ] "Recommend music"
  - [ ] "What should I listen to?"
  - [ ] "Suggest similar"
  - [ ] "Best new music"

### Tool Execution

- [ ] Discovery Tools
  - [ ] Track search works
  - [ ] Artist lookup works
  - [ ] Playlist retrieval works
  - [ ] Trending tracks fetched
  - [ ] Genre filtering works
  - [ ] Province filtering works

- [ ] Playback Tools
  - [ ] Play actions created
  - [ ] Queue actions created
  - [ ] Proper action structure

- [ ] Analytics Tools
  - [ ] Genre stats retrieved
  - [ ] Province stats retrieved
  - [ ] Data formatted correctly

### Error Handling

- [ ] Invalid track ID handled gracefully
- [ ] Empty search results handled
- [ ] Missing API keys detected
- [ ] Network errors handled
- [ ] Invalid tool inputs handled

## Testing Different AI Providers

### OpenAI (GPT-4o-mini)

```typescript
const agent = new DiscoveryAgent('openai');
```

### Anthropic (Claude 3.5 Sonnet)

```typescript
const agent = new DiscoveryAgent('anthropic');
```

### Google (Gemini Pro)

```typescript
const agent = new DiscoveryAgent('google');
```

## Performance Testing

### Expected Response Times

- Service Layer Calls: < 100ms
- LangChain Tool Calls: < 500ms
- AI Agent Processing: 1-3 seconds
- Full Request Cycle: 2-4 seconds

### Load Testing

```bash
# Install Apache Bench if needed
# macOS: brew install ab

# Test API endpoint with 10 requests
ab -n 10 -c 2 -p request.json -T application/json \
  http://localhost:3000/api/ai/chat
```

## Debugging Tips

### Enable Logging

```typescript
// In agent files, add detailed logging
console.log('Tool call:', toolName);
console.log('Tool result:', result);
console.log('Agent response:', response);
```

### Check Tool Outputs

```typescript
// Add temporary logging in tool functions
func: async params => {
  console.log('Tool called with params:', params);
  // ... tool logic
  console.log('Tool result:', result);
  return result;
};
```

### Monitor API Calls

- Check browser DevTools Network tab
- Review server logs for agent processing
- Verify API response times

## Common Issues & Solutions

### Issue: "No AI providers configured"

**Solution:** Set at least one environment variable:

```bash
export OPENAI_API_KEY="your-key"
```

### Issue: Tool returns empty results

**Solution:**

1. Verify database has sample data
2. Check service layer queries
3. Review tool parameters

### Issue: Router selects wrong agent

**Solution:**

1. Review intent keywords in `router-agent.ts`
2. Test with more explicit queries
3. Check confidence scores in logs

### Issue: Responses are too slow

**Solution:**

1. Use faster model (GPT-4o-mini instead of GPT-4)
2. Reduce limit parameters
3. Optimize database queries

## Next Steps

Once testing is complete:

1. **Phase 2.4:** Implement memory system
   - Conversation history
   - User preferences
   - Listening patterns

2. **Phase 3:** Advanced features
   - Performance optimization
   - Enhanced personalization
   - Response caching
   - Rate limiting

## Questions?

Check the main documentation:

- `docs/ai-enhancement-plan.md` - Full implementation plan
- `docs/ai-setup.md` - Initial AI setup guide
