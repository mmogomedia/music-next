/**
 * AI Chat Response Types Tests
 *
 * Comprehensive tests for all AI response types according to documentation.
 * Tests verify that responses match the expected structure defined in
 * docs/ai-system-complete.md and src/types/ai-responses.ts
 *
 * @module ResponseTypesTests
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import type {
  TrackListResponse,
  PlaylistResponse,
  PlaylistGridResponse,
  ArtistResponse,
  SearchResultsResponse,
  ActionResponse,
  GenreListResponse,
  QuickLinkTrackResponse,
  QuickLinkAlbumResponse,
  QuickLinkArtistResponse,
  TextResponse,
} from '@/types/ai-responses';
import type { TrackWithArtist } from '@/lib/services';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: async () => body,
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
    })),
  },
}));

// Mock dependencies
jest.mock('@/lib/ai/agents', () => ({
  routerAgent: {
    route: jest.fn(),
  },
}));

jest.mock('@/lib/ai/memory/conversation-store', () => ({
  conversationStore: {
    storeMessage: jest.fn(),
    getConversation: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/lib/ai/memory/preference-tracker', () => ({
  preferenceTracker: {
    updateFromMessage: jest.fn(),
    updateFromResults: jest.fn(),
  },
}));

jest.mock('@/lib/ai/memory/context-builder', () => ({
  contextBuilder: {
    buildContext: jest.fn().mockResolvedValue({
      filters: {},
    }),
  },
}));

jest.mock('@/lib/ai/ai-service', () => ({
  aiService: {
    getAvailableProviders: jest.fn().mockReturnValue(['azure-openai']),
  },
}));

describe('AI Chat Response Types', () => {
  const { routerAgent } = require('@/lib/ai/agents');
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Helper to create a mock request
   */
  const createRequest = (message: string, context?: any) => {
    return new Request(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    }) as any as NextRequest;
  };

  /**
   * Helper to validate response structure
   */
  const validateBaseResponse = (response: any) => {
    expect(response).toHaveProperty('message');
    expect(response).toHaveProperty('conversationId');
    expect(response).toHaveProperty('timestamp');
    expect(typeof response.message).toBe('string');
    expect(typeof response.conversationId).toBe('string');
    // timestamp can be string (ISO) or Date object
    expect(
      typeof response.timestamp === 'string' ||
        response.timestamp instanceof Date
    ).toBe(true);
  };

  /**
   * Helper to validate TrackListResponse structure
   */
  const validateTrackListResponse = (data: any) => {
    expect(data).toHaveProperty('type', 'track_list');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('tracks');
    expect(Array.isArray(data.data.tracks)).toBe(true);

    // Validate track structure
    if (data.data.tracks.length > 0) {
      const track = data.data.tracks[0];
      expect(track).toHaveProperty('id');
      expect(track).toHaveProperty('title');
      expect(track).toHaveProperty('artist');
      expect(track).toHaveProperty('genre');
    }

    // Validate optional fields
    if (data.data.other) {
      expect(Array.isArray(data.data.other)).toBe(true);
      expect(data.data.other.length).toBeLessThanOrEqual(3);
    }

    if (data.data.metadata) {
      expect(typeof data.data.metadata).toBe('object');
    }
  };

  /**
   * Helper to validate PlaylistResponse structure
   */
  const validatePlaylistResponse = (data: any) => {
    expect(data).toHaveProperty('type', 'playlist');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('name');
    expect(data.data).toHaveProperty('tracks');
    expect(Array.isArray(data.data.tracks)).toBe(true);
  };

  /**
   * Helper to validate PlaylistGridResponse structure
   */
  const validatePlaylistGridResponse = (data: any) => {
    expect(data).toHaveProperty('type', 'playlist_grid');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('playlists');
    expect(Array.isArray(data.data.playlists)).toBe(true);

    if (data.data.playlists.length > 0) {
      const playlist = data.data.playlists[0];
      expect(playlist).toHaveProperty('id');
      expect(playlist).toHaveProperty('name');
    }

    if (data.data.metadata) {
      expect(typeof data.data.metadata).toBe('object');
    }
  };

  /**
   * Helper to validate ArtistResponse structure
   */
  const validateArtistResponse = (data: any) => {
    expect(data).toHaveProperty('type', 'artist');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('artistName');
  };

  /**
   * Helper to validate SearchResultsResponse structure
   */
  const validateSearchResultsResponse = (data: any) => {
    expect(data).toHaveProperty('type', 'search_results');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('tracks');
    expect(data.data).toHaveProperty('artists');

    if (data.data.tracks) {
      expect(Array.isArray(data.data.tracks)).toBe(true);
    }

    if (data.data.artists) {
      expect(Array.isArray(data.data.artists)).toBe(true);
    }

    if (data.data.metadata) {
      expect(data.data.metadata).toHaveProperty('query');
    }
  };

  /**
   * Helper to validate ActionResponse structure
   */
  const validateActionResponse = (data: any) => {
    expect(data).toHaveProperty('type', 'action');
    expect(data).toHaveProperty('action');
    expect(data.action).toHaveProperty('type');
    expect([
      'play_track',
      'play_playlist',
      'queue_add',
      'queue_replace',
      'shuffle',
    ]).toContain(data.action.type);
    expect(data.action).toHaveProperty('label');
    expect(data.action).toHaveProperty('data');
  };

  /**
   * Helper to validate GenreListResponse structure
   */
  const validateGenreListResponse = (data: any) => {
    expect(data).toHaveProperty('type', 'genre_list');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('genres');
    expect(Array.isArray(data.data.genres)).toBe(true);

    if (data.data.genres.length > 0) {
      const genre = data.data.genres[0];
      expect(genre).toHaveProperty('id');
      expect(genre).toHaveProperty('name');
      expect(genre).toHaveProperty('slug');
    }

    if (data.data.metadata) {
      expect(typeof data.data.metadata).toBe('object');
    }
  };

  /**
   * Helper to validate QuickLinkTrackResponse structure
   */
  const validateQuickLinkTrackResponse = (data: any) => {
    expect(data).toHaveProperty('type', 'quick_link_track');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('quickLink');
    expect(data.data).toHaveProperty('track');
    expect(data.data.quickLink).toHaveProperty('id');
    expect(data.data.quickLink).toHaveProperty('type', 'TRACK');
    expect(data.data.track).toHaveProperty('id');
    expect(data.data.track).toHaveProperty('title');
  };

  /**
   * Helper to validate QuickLinkAlbumResponse structure
   */
  const validateQuickLinkAlbumResponse = (data: any) => {
    expect(data).toHaveProperty('type', 'quick_link_album');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('quickLink');
    expect(data.data).toHaveProperty('album');
    expect(data.data.quickLink).toHaveProperty('type', 'ALBUM');
    expect(data.data.album).toHaveProperty('albumName');
    expect(data.data.album).toHaveProperty('tracks');
    expect(Array.isArray(data.data.album.tracks)).toBe(true);
  };

  /**
   * Helper to validate QuickLinkArtistResponse structure
   */
  const validateQuickLinkArtistResponse = (data: any) => {
    expect(data).toHaveProperty('type', 'quick_link_artist');
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('quickLink');
    expect(data.data).toHaveProperty('artist');
    expect(data.data.quickLink).toHaveProperty('type', 'ARTIST');
    expect(data.data.artist).toHaveProperty('artistName');
    expect(data.data.artist).toHaveProperty('topTracks');
    expect(Array.isArray(data.data.artist.topTracks)).toBe(true);
  };

  /**
   * Helper to validate TextResponse structure
   */
  const validateTextResponse = (data: any) => {
    expect(data).toHaveProperty('type', 'text');
    expect(data).toHaveProperty('message');
    expect(typeof data.message).toBe('string');
  };

  describe('1. TrackListResponse', () => {
    it('should return track_list response for track search queries', async () => {
      const mockResponse: TrackListResponse = {
        type: 'track_list',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: [
            {
              id: 'track1',
              title: 'Ocean Waves 36',
              artist: 'Uncle Waffles',
              genre: 'Amapiano',
              playCount: 216788,
              duration: 212,
              coverImageUrl: null,
              filePath: 'demo-tracks/ocean-waves-36.mp3',
              artistProfileId: 'artist1',
              createdAt: new Date(),
              updatedAt: new Date(),
              albumArtwork: null,
              isDownloadable: false,
              artistProfile: null,
              fileUrl: 'https://example.com/demo-tracks/ocean-waves-36.mp3',
            } as TrackWithArtist,
          ],
          metadata: {
            total: 1,
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Found tracks matching your query',
        data: mockResponse,
      });

      const request = createRequest('I want a song called Ocean waves');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      expect(body.data).toBeDefined();
      validateTrackListResponse(body.data);
    });

    it('should include other tracks field when available (max 3)', async () => {
      const mockResponse: TrackListResponse = {
        type: 'track_list',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: [
            {
              id: 'track1',
              title: 'Main Track',
              artist: 'Artist',
              genre: 'Amapiano',
              playCount: 1000,
              duration: 200,
              coverImageUrl: null,
              filePath: 'track1.mp3',
              artistProfileId: 'artist1',
              createdAt: new Date(),
              updatedAt: new Date(),
              albumArtwork: null,
              isDownloadable: false,
              artistProfile: null,
              fileUrl: 'https://example.com/track1.mp3',
            } as any,
          ],
          other: [
            {
              id: 'track2',
              title: 'Other Track 1',
              artist: 'Artist',
              genre: 'Amapiano',
              playCount: 500,
              duration: 180,
              coverImageUrl: null,
              filePath: 'track2.mp3',
              artistProfileId: 'artist1',
              createdAt: new Date(),
              updatedAt: new Date(),
              albumArtwork: null,
              isDownloadable: false,
              artistProfile: null,
              fileUrl: 'https://example.com/track2.mp3',
            } as any,
          ],
          metadata: {
            total: 1,
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Found tracks',
        data: mockResponse,
      });

      const request = createRequest('find amapiano tracks');
      const response = await POST(request);
      const body = await response.json();

      validateTrackListResponse(body.data);
      expect(body.data.data.other).toBeDefined();
      expect(body.data.data.other.length).toBeLessThanOrEqual(3);
    });

    it('should include metadata with genre and total', async () => {
      const mockResponse: TrackListResponse = {
        type: 'track_list',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: [],
          metadata: {
            genre: 'Amapiano',
            total: 0,
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'No tracks found',
        data: mockResponse,
      });

      const request = createRequest('find amapiano tracks');
      const response = await POST(request);
      const body = await response.json();

      validateTrackListResponse(body.data);
      expect(body.data.data.metadata).toBeDefined();
      expect(body.data.data.metadata.genre).toBe('Amapiano');
      expect(body.data.data.metadata.total).toBe(0);
    });
  });

  describe('2. PlaylistResponse', () => {
    it('should return playlist response for single playlist queries', async () => {
      const mockResponse: PlaylistResponse = {
        type: 'playlist',
        message: '',
        timestamp: new Date(),
        data: {
          id: 'playlist1',
          name: 'Amapiano Hits',
          description: 'Top Amapiano tracks',
          province: null,
          status: 'ACTIVE',
          coverImage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          tracks: [],
        } as any,
      };

      routerAgent.route.mockResolvedValue({
        message: 'Here is the playlist',
        data: mockResponse,
      });

      const request = createRequest('show me the Amapiano Hits playlist');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      expect(body.data).toBeDefined();
      validatePlaylistResponse(body.data);
    });
  });

  describe('3. PlaylistGridResponse', () => {
    it('should return playlist_grid response for playlist browse queries', async () => {
      const mockResponse: PlaylistGridResponse = {
        type: 'playlist_grid',
        message: '',
        timestamp: new Date(),
        data: {
          playlists: [
            {
              id: 'playlist1',
              name: 'Amapiano Hits',
              description: 'Top Amapiano tracks',
              coverImage: null,
              trackCount: 10,
            } as any,
          ],
          metadata: {
            genre: 'Amapiano',
            total: 1,
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Here are playlists',
        data: mockResponse,
      });

      const request = createRequest('show me amapiano playlists');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      expect(body.data).toBeDefined();
      validatePlaylistGridResponse(body.data);
    });

    it('should include province in metadata when filtering by province', async () => {
      const mockResponse: PlaylistGridResponse = {
        type: 'playlist_grid',
        message: '',
        timestamp: new Date(),
        data: {
          playlists: [],
          metadata: {
            province: 'Gauteng',
            total: 0,
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'No playlists found',
        data: mockResponse,
      });

      const request = createRequest('show me playlists from Gauteng');
      const response = await POST(request);
      const body = await response.json();

      validatePlaylistGridResponse(body.data);
      expect(body.data.data.metadata?.province).toBe('Gauteng');
    });
  });

  describe('4. ArtistResponse', () => {
    it('should return artist response for artist queries', async () => {
      const mockResponse: ArtistResponse = {
        type: 'artist',
        message: '',
        timestamp: new Date(),
        data: {
          id: 'artist1',
          artistName: 'Uncle Waffles',
          slug: 'uncle-waffles',
          bio: 'Amapiano DJ',
          profileImage: null,
          coverImage: null,
          location: 'Johannesburg',
          genre: 'Amapiano',
          socialLinks: {},
          streamingLinks: {},
        } as any,
      };

      routerAgent.route.mockResolvedValue({
        message: 'Here is the artist',
        data: mockResponse,
      });

      const request = createRequest('tell me about Uncle Waffles');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      expect(body.data).toBeDefined();
      validateArtistResponse(body.data);
    });
  });

  describe('5. SearchResultsResponse', () => {
    it('should return search_results for mixed track and artist queries', async () => {
      const mockResponse: SearchResultsResponse = {
        type: 'search_results',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: [
            {
              id: 'track1',
              title: 'Track 1',
              artist: 'Artist 1',
              genre: 'Amapiano',
              playCount: 1000,
              duration: 200,
              coverImageUrl: null,
              filePath: 'track1.mp3',
              artistProfileId: 'artist1',
              createdAt: new Date(),
              updatedAt: new Date(),
              albumArtwork: null,
              isDownloadable: false,
              artistProfile: null,
              fileUrl: 'https://example.com/track1.mp3',
            } as any,
          ],
          artists: [
            {
              id: 'artist1',
              artistName: 'Artist 1',
              slug: 'artist-1',
              bio: null,
              profileImage: null,
              coverImage: null,
              location: null,
              genre: null,
              socialLinks: {},
              streamingLinks: {},
            } as any,
          ],
          metadata: {
            query: 'artist',
            total: 2,
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Found results',
        data: mockResponse,
      });

      const request = createRequest('search for artist');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      expect(body.data).toBeDefined();
      validateSearchResultsResponse(body.data);
    });
  });

  describe('6. ActionResponse', () => {
    it('should return action response for play_track requests', async () => {
      const mockResponse: ActionResponse = {
        type: 'action',
        message: '',
        timestamp: new Date(),
        action: {
          type: 'play_track',
          label: 'Play Track',
          data: {
            trackId: 'track1',
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Playing track',
        data: mockResponse,
      });

      const request = createRequest('play track track1');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      expect(body.data).toBeDefined();
      validateActionResponse(body.data);
      expect(body.data.action.type).toBe('play_track');
      expect(body.data.action.data.trackId).toBe('track1');
    });

    it('should return action response for play_playlist requests', async () => {
      const mockResponse: ActionResponse = {
        type: 'action',
        message: '',
        timestamp: new Date(),
        action: {
          type: 'play_playlist',
          label: 'Play Playlist',
          data: {
            playlistId: 'playlist1',
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Playing playlist',
        data: mockResponse,
      });

      const request = createRequest('play the amapiano playlist');
      const response = await POST(request);
      const body = await response.json();

      validateActionResponse(body.data);
      expect(body.data.action.type).toBe('play_playlist');
      expect(body.data.action.data.playlistId).toBe('playlist1');
    });

    it('should return action response for queue_add requests', async () => {
      const mockResponse: ActionResponse = {
        type: 'action',
        message: '',
        timestamp: new Date(),
        action: {
          type: 'queue_add',
          label: 'Add to Queue',
          data: {
            trackIds: ['track1', 'track2'],
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Adding to queue',
        data: mockResponse,
      });

      const request = createRequest('add these tracks to queue');
      const response = await POST(request);
      const body = await response.json();

      validateActionResponse(body.data);
      expect(body.data.action.type).toBe('queue_add');
      expect(body.data.action.data.trackIds).toBeDefined();
    });
  });

  describe('7. GenreListResponse', () => {
    it('should return genre_list response for genre queries', async () => {
      const mockResponse: GenreListResponse = {
        type: 'genre_list',
        message: '',
        timestamp: new Date(),
        data: {
          genres: [
            {
              id: 'genre1',
              name: 'Amapiano',
              slug: 'amapiano',
              description: 'South African house music',
              colorHex: '#FF5733',
              icon: '🎹',
              trackCount: 100,
            },
          ],
          metadata: {
            total: 1,
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Here are the genres',
        data: mockResponse,
      });

      const request = createRequest('what genres are available');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      expect(body.data).toBeDefined();
      validateGenreListResponse(body.data);
    });
  });

  describe('8. QuickLinkTrackResponse', () => {
    it('should return quick_link_track response for quick link track queries', async () => {
      const mockResponse: QuickLinkTrackResponse = {
        type: 'quick_link_track',
        message: '',
        timestamp: new Date(),
        data: {
          quickLink: {
            id: 'link1',
            slug: 'ocean-waves',
            title: 'Ocean Waves',
            description: 'Track description',
            type: 'TRACK',
            isPrerelease: false,
          },
          track: {
            id: 'track1',
            title: 'Ocean Waves',
            artist: 'Uncle Waffles',
            album: null,
            albumArtwork: null,
            coverImageUrl: null,
            duration: 212,
            description: null,
            genre: 'Amapiano',
            bpm: null,
            releaseDate: null,
            isDownloadable: false,
            filePath: 'track1.mp3',
            fileUrl: null,
            streamingLinks: [],
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Here is the track',
        data: mockResponse,
      });

      const request = createRequest('show me ocean waves quick link');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      expect(body.data).toBeDefined();
      validateQuickLinkTrackResponse(body.data);
    });
  });

  describe('9. QuickLinkAlbumResponse', () => {
    it('should return quick_link_album response for quick link album queries', async () => {
      const mockResponse: QuickLinkAlbumResponse = {
        type: 'quick_link_album',
        message: '',
        timestamp: new Date(),
        data: {
          quickLink: {
            id: 'link1',
            slug: 'album-name',
            title: 'Album Name',
            description: 'Album description',
            type: 'ALBUM',
            isPrerelease: false,
          },
          album: {
            albumName: 'Album Name',
            artistName: 'Artist',
            artistSlug: 'artist',
            tracks: [],
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Here is the album',
        data: mockResponse,
      });

      const request = createRequest('show me album quick link');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      expect(body.data).toBeDefined();
      validateQuickLinkAlbumResponse(body.data);
    });
  });

  describe('10. QuickLinkArtistResponse', () => {
    it('should return quick_link_artist response for quick link artist queries', async () => {
      const mockResponse: QuickLinkArtistResponse = {
        type: 'quick_link_artist',
        message: '',
        timestamp: new Date(),
        data: {
          quickLink: {
            id: 'link1',
            slug: 'artist-name',
            title: 'Artist Name',
            description: 'Artist description',
            type: 'ARTIST',
            isPrerelease: false,
          },
          artist: {
            artistName: 'Artist Name',
            bio: null,
            profileImage: null,
            location: null,
            genre: null,
            slug: null,
            socialLinks: null,
            streamingLinks: null,
            topTracks: [],
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Here is the artist',
        data: mockResponse,
      });

      const request = createRequest('show me artist quick link');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      expect(body.data).toBeDefined();
      validateQuickLinkArtistResponse(body.data);
    });
  });

  describe('11. TextResponse (Fallback)', () => {
    it('should return text response when no structured data is available', async () => {
      routerAgent.route.mockResolvedValue({
        message:
          'I understand you want to explore music. Let me help you with that!',
        data: undefined,
      });

      const request = createRequest('hello');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      expect(body.data).toBeUndefined();
      expect(body.message).toBeDefined();
    });

    it('should return text response when agent returns text type', async () => {
      const mockResponse: TextResponse = {
        type: 'text',
        message: 'This is a text response',
        timestamp: new Date(),
      };

      routerAgent.route.mockResolvedValue({
        message: 'This is a text response',
        data: mockResponse,
      });

      const request = createRequest('general question');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      if (body.data) {
        validateTextResponse(body.data);
      }
    });
  });

  describe('Response Structure Validation', () => {
    it('should always include type field in structured responses', async () => {
      const mockResponse: TrackListResponse = {
        type: 'track_list',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: [],
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Response',
        data: mockResponse,
      });

      const request = createRequest('test query');
      const response = await POST(request);
      const body = await response.json();

      if (body.data && typeof body.data === 'object') {
        expect(body.data).toHaveProperty('type');
        expect(typeof body.data.type).toBe('string');
      }
    });

    it('should always include timestamp in structured responses', async () => {
      const mockResponse: TrackListResponse = {
        type: 'track_list',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: [],
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Response',
        data: mockResponse,
      });

      const request = createRequest('test query');
      const response = await POST(request);
      const body = await response.json();

      if (
        body.data &&
        typeof body.data === 'object' &&
        'timestamp' in body.data
      ) {
        expect(body.data.timestamp).toBeDefined();
      }
    });

    it('should preserve nested data structure for TrackListResponse', async () => {
      const mockResponse: TrackListResponse = {
        type: 'track_list',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: [
            {
              id: 'track1',
              title: 'Test Track',
              artist: 'Test Artist',
              genre: 'Amapiano',
              playCount: 1000,
              duration: 200,
              coverImageUrl: null,
              filePath: 'track1.mp3',
              artistProfileId: 'artist1',
              createdAt: new Date(),
              updatedAt: new Date(),
              albumArtwork: null,
              isDownloadable: false,
              artistProfile: null,
              fileUrl: 'https://example.com/track1.mp3',
            } as TrackWithArtist,
          ],
          metadata: {
            total: 1,
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Found tracks',
        data: mockResponse,
      });

      const request = createRequest('find tracks');
      const response = await POST(request);
      const body = await response.json();

      expect(body.data).toHaveProperty('type', 'track_list');
      expect(body.data).toHaveProperty('data');
      expect(body.data.data).toHaveProperty('tracks');
      expect(body.data.data).toHaveProperty('metadata');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty track list gracefully', async () => {
      const mockResponse: TrackListResponse = {
        type: 'track_list',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: [],
          metadata: {
            total: 0,
          },
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'No tracks found',
        data: mockResponse,
      });

      const request = createRequest('find nonexistent tracks');
      const response = await POST(request);
      const body = await response.json();

      validateTrackListResponse(body.data);
      expect(body.data.data.tracks).toHaveLength(0);
    });

    it('should handle missing optional fields', async () => {
      const mockResponse: TrackListResponse = {
        type: 'track_list',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: [],
          // No metadata, no other tracks
        },
      };

      routerAgent.route.mockResolvedValue({
        message: 'Response',
        data: mockResponse,
      });

      const request = createRequest('test query');
      const response = await POST(request);
      const body = await response.json();

      validateTrackListResponse(body.data);
      // Should not throw even if optional fields are missing
    });

    it('should handle response without data field', async () => {
      routerAgent.route.mockResolvedValue({
        message: 'Simple text response',
        data: undefined,
      });

      const request = createRequest('simple question');
      const response = await POST(request);
      const body = await response.json();

      validateBaseResponse(body);
      expect(body.data).toBeUndefined();
    });
  });
});
