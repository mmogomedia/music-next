/**
 * Discovery Tools
 *
 * LangChain tools for music discovery operations using the service layer.
 * These tools enable AI agents to search and browse music on Flemoji.
 *
 * @module DiscoveryTools
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  MusicService,
  PlaylistService,
  ArtistService,
  AnalyticsService,
} from '@/lib/services';

/**
 * Search for tracks by query string
 */
export const searchTracksTool = new DynamicStructuredTool({
  name: 'search_tracks',
  description:
    'Search for music tracks by title, artist name, or description. Returns a list of matching tracks with metadata.',
  schema: z.object({
    query: z
      .string()
      .describe(
        'Search query string (track title, artist name, or description)'
      ),
    genre: z
      .string()
      .optional()
      .describe('Optional genre filter (e.g., Amapiano, Afrobeat)'),
    province: z
      .string()
      .optional()
      .describe('Optional province filter (e.g., Gauteng, Western Cape)'),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Maximum number of tracks to return (1-50)'),
    orderBy: z
      .enum(['recent', 'popular', 'alphabetical'])
      .optional()
      .default('recent')
      .describe(
        'Sort order: recent (newest first), popular (most plays), or alphabetical'
      ),
  }),
  func: async ({ query, genre, province, limit = 20, orderBy = 'recent' }) => {
    try {
      const tracks = await MusicService.searchTracks(query, {
        genre,
        province,
        limit: Math.min(limit, 50),
        offset: 0,
        orderBy,
      });

      return JSON.stringify({
        tracks: tracks.map(track => ({
          id: track.id,
          title: track.title,
          artist:
            track.artist || track.artistProfile?.artistName || 'Unknown Artist',
          genre: track.genre,
          duration: track.duration,
          playCount: track.playCount,
          likeCount: track.likeCount,
          coverImageUrl: track.coverImageUrl,
          uniqueUrl: track.uniqueUrl,
        })),
        count: tracks.length,
      });
    } catch (error) {
      console.error('Error in searchTracksTool:', error);
      return JSON.stringify({
        error: 'Failed to search tracks',
        tracks: [],
        count: 0,
      });
    }
  },
});

/**
 * Get a specific track by ID
 */
export const getTrackTool = new DynamicStructuredTool({
  name: 'get_track',
  description: 'Get detailed information about a specific track by its ID.',
  schema: z.object({
    trackId: z.string().describe('The unique ID of the track'),
  }),
  func: async ({ trackId }) => {
    try {
      const track = await MusicService.getTrackById(trackId);

      if (!track) {
        return JSON.stringify({ error: 'Track not found', track: null });
      }

      return JSON.stringify({
        track: {
          id: track.id,
          title: track.title,
          artist:
            track.artist || track.artistProfile?.artistName || 'Unknown Artist',
          genre: track.genre,
          album: track.album,
          duration: track.duration,
          description: track.description,
          playCount: track.playCount,
          likeCount: track.likeCount,
          shareCount: track.shareCount,
          coverImageUrl: track.coverImageUrl,
          uniqueUrl: track.uniqueUrl,
        },
      });
    } catch (error) {
      console.error('Error in getTrackTool:', error);
      return JSON.stringify({ error: 'Failed to get track', track: null });
    }
  },
});

/**
 * Get a playlist by ID
 */
export const getPlaylistTool = new DynamicStructuredTool({
  name: 'get_playlist',
  description: 'Get a playlist with all its tracks by playlist ID.',
  schema: z.object({
    playlistId: z.string().describe('The unique ID of the playlist'),
  }),
  func: async ({ playlistId }) => {
    try {
      const playlist = await PlaylistService.getPlaylistById(playlistId);

      if (!playlist) {
        return JSON.stringify({ error: 'Playlist not found', playlist: null });
      }

      return JSON.stringify({
        playlist: {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          trackCount: playlist.tracks.length,
          tracks: playlist.tracks.slice(0, 10).map(pt => ({
            id: pt.track.id,
            title: pt.track.title,
            artist:
              pt.track.artist ||
              pt.track.artistProfile?.artistName ||
              'Unknown Artist',
            genre: pt.track.genre,
            coverImageUrl: pt.track.coverImageUrl,
          })),
        },
      });
    } catch (error) {
      console.error('Error in getPlaylistTool:', error);
      return JSON.stringify({
        error: 'Failed to get playlist',
        playlist: null,
      });
    }
  },
});

/**
 * Get an artist profile by slug or name
 */
export const getArtistTool = new DynamicStructuredTool({
  name: 'get_artist',
  description:
    'Get an artist profile with their tracks by artist slug or name.',
  schema: z.object({
    artistIdentifier: z.string().describe('Artist slug or artist name'),
  }),
  func: async ({ artistIdentifier }) => {
    try {
      const artist = await ArtistService.getArtistBySlug(artistIdentifier);

      if (!artist) {
        return JSON.stringify({ error: 'Artist not found', artist: null });
      }

      return JSON.stringify({
        artist: {
          id: artist.id,
          artistName: artist.artistName,
          bio: artist.bio,
          genre: artist.genre,
          location: artist.location,
          totalPlays: artist.totalPlays,
          totalLikes: artist.totalLikes,
          profileViews: artist.profileViews,
          trackCount: artist.tracks.length,
          tracks: artist.tracks.slice(0, 10).map(track => ({
            id: track.id,
            title: track.title,
            genre: track.genre,
            playCount: track.playCount,
          })),
        },
      });
    } catch (error) {
      console.error('Error in getArtistTool:', error);
      return JSON.stringify({ error: 'Failed to get artist', artist: null });
    }
  },
});

/**
 * Get top charts/trending playlists
 */
export const getTopChartsTool = new DynamicStructuredTool({
  name: 'get_top_charts',
  description: 'Get the top charts/trending playlists on Flemoji.',
  schema: z.object({
    limit: z
      .number()
      .optional()
      .default(10)
      .describe('Number of playlists to return (1-20)'),
  }),
  func: async ({ limit = 10 }) => {
    try {
      const playlists = await PlaylistService.getTopCharts(Math.min(limit, 20));

      return JSON.stringify({
        playlists: playlists.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          trackCount: p.trackCount,
        })),
        count: playlists.length,
      });
    } catch (error) {
      console.error('Error in getTopChartsTool:', error);
      return JSON.stringify({
        error: 'Failed to get top charts',
        playlists: [],
        count: 0,
      });
    }
  },
});

/**
 * Get featured playlists
 */
export const getFeaturedPlaylistsTool = new DynamicStructuredTool({
  name: 'get_featured_playlists',
  description: 'Get featured playlists on Flemoji.',
  schema: z.object({
    limit: z
      .number()
      .optional()
      .default(10)
      .describe('Number of playlists to return (1-20)'),
  }),
  func: async ({ limit = 10 }) => {
    try {
      const playlists = await PlaylistService.getFeaturedPlaylists(
        Math.min(limit, 20)
      );

      return JSON.stringify({
        playlists: playlists.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          trackCount: p.trackCount,
        })),
        count: playlists.length,
      });
    } catch (error) {
      console.error('Error in getFeaturedPlaylistsTool:', error);
      return JSON.stringify({
        error: 'Failed to get featured playlists',
        playlists: [],
        count: 0,
      });
    }
  },
});

/**
 * Get trending tracks
 */
export const getTrendingTracksTool = new DynamicStructuredTool({
  name: 'get_trending_tracks',
  description:
    'Get currently trending tracks based on play count and engagement.',
  schema: z.object({
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Number of tracks to return (1-50)'),
  }),
  func: async ({ limit = 20 }) => {
    try {
      const tracks = await AnalyticsService.getTrendingTracks(
        Math.min(limit, 50)
      );

      return JSON.stringify({
        tracks: tracks.map(track => ({
          id: track.id,
          title: track.title,
          artist: track.artist || 'Unknown Artist',
          genre: track.genre,
          playCount: track.playCount,
          likeCount: track.likeCount,
          trendingScore: track.stats.trendingScore,
          coverImageUrl: track.coverImageUrl,
        })),
        count: tracks.length,
      });
    } catch (error) {
      console.error('Error in getTrendingTracksTool:', error);
      return JSON.stringify({
        error: 'Failed to get trending tracks',
        tracks: [],
        count: 0,
      });
    }
  },
});

/**
 * Get playlists by genre
 */
export const getPlaylistsByGenreTool = new DynamicStructuredTool({
  name: 'get_playlists_by_genre',
  description:
    'Get playlists filtered by genre (e.g., Amapiano, Afrobeat, House).',
  schema: z.object({
    genre: z.string().describe('Genre name to filter by'),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Number of playlists to return (1-20)'),
  }),
  func: async ({ genre, limit = 20 }) => {
    try {
      const playlists = await PlaylistService.getPlaylistsByGenre(
        genre,
        Math.min(limit, 20)
      );

      return JSON.stringify({
        playlists: playlists.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          trackCount: p.trackCount,
        })),
        count: playlists.length,
      });
    } catch (error) {
      console.error('Error in getPlaylistsByGenreTool:', error);
      return JSON.stringify({
        error: 'Failed to get playlists by genre',
        playlists: [],
        count: 0,
      });
    }
  },
});

/**
 * Get playlists by province
 */
export const getPlaylistsByProvinceTool = new DynamicStructuredTool({
  name: 'get_playlists_by_province',
  description:
    'Get playlists featuring music from artists in a specific province.',
  schema: z.object({
    province: z
      .string()
      .describe('Province name (e.g., Gauteng, Western Cape, KwaZulu-Natal)'),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Number of playlists to return (1-20)'),
  }),
  func: async ({ province, limit = 20 }) => {
    try {
      const playlists = await PlaylistService.getPlaylistsByProvince(
        province,
        Math.min(limit, 20)
      );

      return JSON.stringify({
        playlists: playlists.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          trackCount: p.trackCount,
        })),
        count: playlists.length,
      });
    } catch (error) {
      console.error('Error in getPlaylistsByProvinceTool:', error);
      return JSON.stringify({
        error: 'Failed to get playlists by province',
        playlists: [],
        count: 0,
      });
    }
  },
});

/**
 * Get tracks by genre
 */
export const getTracksByGenreTool = new DynamicStructuredTool({
  name: 'get_tracks_by_genre',
  description: 'Get popular tracks in a specific genre.',
  schema: z.object({
    genre: z.string().describe('Genre name to filter by'),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Number of tracks to return (1-50)'),
  }),
  func: async ({ genre, limit = 20 }) => {
    try {
      const tracks = await MusicService.getTracksByGenre(
        genre,
        Math.min(limit, 50)
      );

      return JSON.stringify({
        tracks: tracks.map(track => ({
          id: track.id,
          title: track.title,
          artist:
            track.artist || track.artistProfile?.artistName || 'Unknown Artist',
          genre: track.genre,
          playCount: track.playCount,
          likeCount: track.likeCount,
          coverImageUrl: track.coverImageUrl,
        })),
        count: tracks.length,
      });
    } catch (error) {
      console.error('Error in getTracksByGenreTool:', error);
      return JSON.stringify({
        error: 'Failed to get tracks by genre',
        tracks: [],
        count: 0,
      });
    }
  },
});

/**
 * Export all discovery tools as an array
 */
export const discoveryTools = [
  searchTracksTool,
  getTrackTool,
  getPlaylistTool,
  getArtistTool,
  getTopChartsTool,
  getFeaturedPlaylistsTool,
  getTrendingTracksTool,
  getPlaylistsByGenreTool,
  getPlaylistsByProvinceTool,
  getTracksByGenreTool,
];
