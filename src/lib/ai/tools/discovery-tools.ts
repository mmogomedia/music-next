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
import { constructFileUrl } from '@/lib/url-utils';
import {
  SearchTracksOutputSchema,
  SearchTracksByThemeOutputSchema,
  GetTracksByGenreOutputSchema,
  GetTrendingTracksOutputSchema,
  GetTrackOutputSchema,
  GetPlaylistsByGenreOutputSchema,
  GetPlaylistsByProvinceOutputSchema,
  GetTopChartsOutputSchema,
  GetFeaturedPlaylistsOutputSchema,
  GetArtistOutputSchema,
  GetGenresOutputSchema,
} from './output-schemas';

/**
 * Search for tracks by query string
 */
export const searchTracksTool = new DynamicStructuredTool({
  name: 'search_tracks',
  description:
    'Search for music tracks by title, artist name, or description. Returns a maximum of 10 tracks per call. IMPORTANT: When searching for tracks with multiple artists (e.g., "Caeser x MLT zA"), you should also search for each individual artist separately to find all their tracks. Split multi-artist names by "x", "&", "feat", "ft", "featuring", or commas. If you need more tracks, use the excludeIds parameter to exclude already-returned track IDs and call the tool again.',
  schema: z.object({
    query: z
      .string()
      .describe(
        'Search query string (track title, artist name, or description). For multi-artist tracks, search for each artist individually as well.'
      ),
    genre: z
      .string()
      .optional()
      .describe('Optional genre filter (e.g., Amapiano, Afrobeat)'),
    province: z
      .string()
      .optional()
      .describe('Optional province filter (e.g., Gauteng, Western Cape)'),
    excludeIds: z
      .array(z.string())
      .optional()
      .describe(
        'Array of track IDs to exclude from results. Use this to get the next batch of tracks (pagination).'
      ),
    orderBy: z
      .enum(['recent', 'popular', 'alphabetical'])
      .optional()
      .default('recent')
      .describe(
        'Sort order: recent (newest first), popular (most plays), or alphabetical'
      ),
  }),
  func: async ({ query, genre, province, excludeIds, orderBy = 'recent' }) => {
    // eslint-disable-next-line no-console
    console.log('[search_tracks Tool] ===== TOOL CALLED =====');
    // eslint-disable-next-line no-console
    console.log('[search_tracks Tool] Parameters:', {
      query,
      genre,
      province,
      excludeIds,
      orderBy,
      excludeIdsCount: excludeIds?.length || 0,
    });

    try {
      // Hard limit: Always return maximum 10 tracks
      const tracks = await MusicService.searchTracks(query, {
        genre,
        province,
        limit: 10, // Hard limit - never more than 10
        offset: 0,
        orderBy,
        excludeIds, // Exclude already-returned tracks for pagination
      });

      // eslint-disable-next-line no-console
      console.log('[search_tracks Tool] Results:', {
        tracksFound: tracks.length,
        firstTrackTitle: tracks[0]?.title || 'N/A',
        firstTrackGenre: tracks[0]?.genre || 'N/A',
        firstTrackStrength: tracks[0]?.strength || 'N/A',
      });

      const result = {
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
          filePath: track.filePath,
          fileUrl: track.fileUrl,
          artistId: track.artistProfileId,
          artistProfileId: track.artistProfileId,
          userId: track.userId,
          createdAt: track.createdAt,
          updatedAt: track.updatedAt,
          albumArtwork: track.albumArtwork,
          isDownloadable: track.isDownloadable,
          description: track.description,
          attributes: track.attributes || [],
          mood: track.mood || [],
          downloadCount: track.downloadCount || 0,
          shareCount: track.shareCount ?? undefined,
          strength: track.strength || 0,
          // Extended metadata
          bpm: track.bpm ?? undefined,
          year: track.year ?? undefined,
          language: track.language ?? undefined,
          lyrics: track.lyrics ?? undefined,
          isExplicit: track.isExplicit ?? false,
          isPublic: track.isPublic ?? true,
          album: track.album ?? undefined,
          composer: track.composer ?? undefined,
          isrc: track.isrc ?? undefined,
          copyrightInfo: track.copyrightInfo ?? undefined,
          streamingLinks: track.streamingLinks ?? [],
          artistProfile: track.artistProfile
            ? {
                id: track.artistProfile.id,
                artistName: track.artistProfile.artistName,
                bio: track.artistProfile.bio ?? null,
                isVerified: track.artistProfile.isVerified ?? false,
                location: track.artistProfile.location ?? null,
                profileImage: track.artistProfile.profileImage ?? null,
                socialLinks: track.artistProfile.socialLinks ?? null,
                streamingLinks: track.artistProfile.streamingLinks ?? null,
              }
            : undefined,
        })),
        count: tracks.length,
      };
      const validated = SearchTracksOutputSchema.parse(result);
      return JSON.stringify(validated);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('Error in searchTracksTool:', errorMessage);
      return JSON.stringify({
        error: 'Failed to search tracks',
        errorDetail: errorMessage, // visible in LangSmith traces for debugging
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
        const validated = GetTrackOutputSchema.parse({ track: null });
        return JSON.stringify(validated);
      }

      const result = {
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
          shareCount: track.shareCount ?? undefined,
          coverImageUrl: track.coverImageUrl,
          uniqueUrl: track.uniqueUrl,
          filePath: track.filePath,
          fileUrl: track.fileUrl,
          isDownloadable: track.isDownloadable,
          isExplicit: track.isExplicit ?? false,
          isPublic: track.isPublic ?? true,
          bpm: track.bpm ?? undefined,
          year: track.year ?? undefined,
          language: track.language ?? undefined,
          lyrics: track.lyrics ?? undefined,
          composer: track.composer ?? undefined,
          isrc: track.isrc ?? undefined,
          copyrightInfo: track.copyrightInfo ?? undefined,
          artistId: track.artistProfileId,
          artistProfileId: track.artistProfileId,
          userId: track.userId,
          createdAt: track.createdAt,
          updatedAt: track.updatedAt,
          albumArtwork: track.albumArtwork,
          attributes: track.attributes || [],
          mood: track.mood || [],
          downloadCount: track.downloadCount || 0,
          strength: track.strength || 0,
          streamingLinks: track.streamingLinks ?? [],
          artistProfile: track.artistProfile
            ? {
                id: track.artistProfile.id,
                artistName: track.artistProfile.artistName,
                bio: track.artistProfile.bio ?? null,
                isVerified: track.artistProfile.isVerified ?? false,
                location: track.artistProfile.location ?? null,
                profileImage: track.artistProfile.profileImage ?? null,
                socialLinks: track.artistProfile.socialLinks ?? null,
                streamingLinks: track.artistProfile.streamingLinks ?? null,
              }
            : undefined,
        },
      };
      const validated = GetTrackOutputSchema.parse(result);
      return JSON.stringify(validated);
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
          tracks: playlist.tracks.map(pt => ({
            id: pt.track.id,
            title: pt.track.title,
            artist:
              pt.track.artist ||
              pt.track.artistProfile?.artistName ||
              'Unknown Artist',
            genre: pt.track.genre,
            coverImageUrl: pt.track.coverImageUrl,
            albumArtwork: pt.track.albumArtwork,
            album: pt.track.album,
            description: pt.track.description,
            duration: pt.track.duration,
            playCount: pt.track.playCount || 0,
            likeCount: pt.track.likeCount || 0,
            filePath: pt.track.filePath,
            fileUrl: pt.track.fileUrl,
            artistId: pt.track.artistProfileId || undefined,
            artistProfileId: pt.track.artistProfileId,
            userId: pt.track.userId,
            createdAt: pt.track.createdAt?.toISOString(),
            updatedAt: pt.track.updatedAt?.toISOString(),
            isDownloadable: pt.track.isDownloadable ?? false,
            composer: pt.track.composer,
            year: pt.track.year,
            releaseDate: pt.track.releaseDate,
            bpm: pt.track.bpm,
            isrc: pt.track.isrc,
            attributes: pt.track.attributes || [],
            mood: pt.track.mood || [],
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
        const validated = GetArtistOutputSchema.parse({ artist: null });
        return JSON.stringify(validated);
      }

      const result = {
        artist: {
          id: artist.id,
          artistName: artist.artistName,
          bio: artist.bio,
          genre: artist.genre,
          location: artist.location,
          profileImageUrl: artist.profileImage ?? undefined,
          isVerified: artist.isVerified ?? false,
          totalPlays: artist.totalPlays ?? 0,
          totalLikes: artist.totalLikes ?? 0,
          profileViews: artist.profileViews ?? 0,
          trackCount: artist.tracks.length,
          socialLinks: artist.socialLinks ?? null,
          streamingLinks: artist.streamingLinks ?? null,
          tracks: artist.tracks.slice(0, 10).map(track => ({
            id: track.id,
            title: track.title,
            genre: track.genre ?? undefined,
            playCount: track.playCount ?? 0,
          })),
        },
      };
      const validated = GetArtistOutputSchema.parse(result);
      return JSON.stringify(validated);
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
  description:
    'Get the top charts/trending playlists on Flemoji. This includes the top ten playlist. Use limit: 1 to get just the top ten playlist.',
  schema: z.object({
    limit: z
      .number()
      .optional()
      .default(10)
      .describe(
        'Number of playlists to return (1-20). Use 1 to get the top ten playlist.'
      ),
  }),
  func: async ({ limit = 10 }) => {
    try {
      const playlists = await PlaylistService.getTopCharts(Math.min(limit, 20));

      const result = {
        playlists: playlists.map(p => {
          const coverImage = p.coverImage;
          const coverImageUrl = coverImage
            ? coverImage.startsWith('http://') ||
              coverImage.startsWith('https://') ||
              coverImage.startsWith('//')
              ? coverImage
              : constructFileUrl(coverImage)
            : undefined;

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            trackCount: p.trackCount,
            coverImage: coverImageUrl,
          };
        }),
        count: playlists.length,
      };
      const validated = GetTopChartsOutputSchema.parse(result);
      return JSON.stringify(validated);
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

      const result = {
        playlists: playlists.map(p => {
          const coverImage = p.coverImage;
          const coverImageUrl = coverImage
            ? coverImage.startsWith('http://') ||
              coverImage.startsWith('https://') ||
              coverImage.startsWith('//')
              ? coverImage
              : constructFileUrl(coverImage)
            : undefined;

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            trackCount: p.trackCount,
            coverImage: coverImageUrl,
          };
        }),
        count: playlists.length,
      };
      const validated = GetFeaturedPlaylistsOutputSchema.parse(result);
      return JSON.stringify(validated);
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
    // eslint-disable-next-line no-console
    console.log('[get_trending_tracks Tool] ===== TOOL CALLED =====');
    // eslint-disable-next-line no-console
    console.log('[get_trending_tracks Tool] Parameters:', {
      limit,
      effectiveLimit: Math.min(limit, 50),
    });

    try {
      const tracks = await AnalyticsService.getTrendingTracks(
        Math.min(limit, 50)
      );

      // eslint-disable-next-line no-console
      console.log('[get_trending_tracks Tool] Results:', {
        tracksFound: tracks.length,
        firstTrackTitle: tracks[0]?.title || 'N/A',
        firstTrackGenre: tracks[0]?.genre || 'N/A',
      });

      const result = {
        tracks: tracks.map(rawTrack => {
          // TrendingTrack extends Prisma Track which may have artistProfile via include
          const track = rawTrack as typeof rawTrack & {
            artistProfile?: {
              id?: string;
              artistName?: string;
              bio?: string | null;
              isVerified?: boolean;
              location?: string | null;
              profileImage?: string | null;
              socialLinks?: unknown;
              streamingLinks?: unknown;
            } | null;
          };
          return {
            id: track.id,
            title: track.title,
            artist:
              track.artist ||
              track.artistProfile?.artistName ||
              'Unknown Artist',
            genre: track.genre,
            playCount: track.playCount,
            likeCount: track.likeCount,
            coverImageUrl: track.coverImageUrl,
            duration: track.duration,
            filePath: track.filePath,
            fileUrl: constructFileUrl(track.filePath),
            artistId: track.artistProfileId,
            artistProfileId: track.artistProfileId,
            userId: track.userId,
            createdAt: track.createdAt,
            updatedAt: track.updatedAt,
            albumArtwork: track.albumArtwork,
            isDownloadable: track.isDownloadable,
            strength: track.strength || 0,
            // Extended metadata
            bpm: track.bpm ?? undefined,
            year: track.year ?? undefined,
            language: track.language ?? undefined,
            lyrics: track.lyrics ?? undefined,
            isExplicit: track.isExplicit ?? false,
            isPublic: track.isPublic ?? true,
            album: track.album ?? undefined,
            composer: track.composer ?? undefined,
            isrc: track.isrc ?? undefined,
            copyrightInfo: track.copyrightInfo ?? undefined,
            shareCount: track.shareCount ?? undefined,
            downloadCount: track.downloadCount || 0,
            attributes: (track as any).attributes || [],
            mood: (track as any).mood || [],
            streamingLinks: (track as any).streamingLinks ?? [],
            artistProfile: track.artistProfile?.id
              ? {
                  id: track.artistProfile.id,
                  artistName: track.artistProfile.artistName ?? '',
                  bio: track.artistProfile.bio ?? null,
                  isVerified: track.artistProfile.isVerified ?? false,
                  location: track.artistProfile.location ?? null,
                  profileImage: track.artistProfile.profileImage ?? null,
                  socialLinks: track.artistProfile.socialLinks ?? null,
                  streamingLinks: track.artistProfile.streamingLinks ?? null,
                }
              : undefined,
          };
        }),
        count: tracks.length,
      };
      const validated = GetTrendingTracksOutputSchema.parse(result);
      return JSON.stringify(validated);
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

      const result = {
        playlists: playlists.map(p => {
          const coverImage = p.coverImage;
          const coverImageUrl = coverImage
            ? coverImage.startsWith('http://') ||
              coverImage.startsWith('https://') ||
              coverImage.startsWith('//')
              ? coverImage
              : constructFileUrl(coverImage)
            : undefined;

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            trackCount: p.trackCount,
            coverImage: coverImageUrl,
            genre,
          };
        }),
        genre,
        count: playlists.length,
      };
      const validated = GetPlaylistsByGenreOutputSchema.parse(result);
      return JSON.stringify(validated);
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

      const result = {
        playlists: playlists.map(p => {
          const coverImage = p.coverImage;
          const coverImageUrl = coverImage
            ? coverImage.startsWith('http://') ||
              coverImage.startsWith('https://') ||
              coverImage.startsWith('//')
              ? coverImage
              : constructFileUrl(coverImage)
            : undefined;

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            trackCount: p.trackCount,
            coverImage: coverImageUrl,
            province,
          };
        }),
        province,
        count: playlists.length,
      };
      const validated = GetPlaylistsByProvinceOutputSchema.parse(result);
      return JSON.stringify(validated);
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
  description:
    'Get popular tracks in a specific genre. Can search by genre name (e.g., "3 Step", "Afro Pop", "Amapiano"), slug, or alias. The system will automatically match the genre name to the correct genre in the database.',
  schema: z.object({
    genre: z
      .string()
      .describe(
        'Genre name, slug, or alias to filter by (e.g., "3 Step", "Afro Pop", "Amapiano", "amapiano")'
      ),
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

      const result = {
        tracks: tracks.map(track => ({
          id: track.id,
          title: track.title,
          artist:
            track.artist || track.artistProfile?.artistName || 'Unknown Artist',
          genre: track.genre,
          playCount: track.playCount,
          likeCount: track.likeCount,
          coverImageUrl: track.coverImageUrl,
          duration: track.duration,
          filePath: track.filePath,
          fileUrl: track.fileUrl,
          artistId: track.artistProfileId,
          artistProfileId: track.artistProfileId,
          userId: track.userId,
          createdAt: track.createdAt,
          updatedAt: track.updatedAt,
          albumArtwork: track.albumArtwork,
          isDownloadable: track.isDownloadable,
          description: track.description,
          attributes: track.attributes || [],
          mood: track.mood || [],
          downloadCount: track.downloadCount || 0,
          shareCount: track.shareCount ?? undefined,
          strength: track.strength || 0,
          // Extended metadata
          bpm: track.bpm ?? undefined,
          year: track.year ?? undefined,
          language: track.language ?? undefined,
          lyrics: track.lyrics ?? undefined,
          isExplicit: track.isExplicit ?? false,
          isPublic: track.isPublic ?? true,
          album: track.album ?? undefined,
          composer: track.composer ?? undefined,
          isrc: track.isrc ?? undefined,
          copyrightInfo: track.copyrightInfo ?? undefined,
          streamingLinks: track.streamingLinks ?? [],
          artistProfile: track.artistProfile
            ? {
                id: track.artistProfile.id,
                artistName: track.artistProfile.artistName,
                bio: track.artistProfile.bio ?? null,
                isVerified: track.artistProfile.isVerified ?? false,
                location: track.artistProfile.location ?? null,
                profileImage: track.artistProfile.profileImage ?? null,
                socialLinks: track.artistProfile.socialLinks ?? null,
                streamingLinks: track.artistProfile.streamingLinks ?? null,
              }
            : undefined,
        })),
        genre,
        count: tracks.length,
      };
      const validated = GetTracksByGenreOutputSchema.parse(result);
      return JSON.stringify(validated);
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
 * Search tracks by mood and theme/attribute tags (thematic search)
 *
 * Use this tool when the user's query is thematic or mood-based rather than
 * searching for a specific title or artist — e.g.:
 *   "music that celebrates mothers"
 *   "uplifting afropop songs"
 *   "songs about self-love"
 *   "heartbreak music"
 *   "music for women empowerment"
 *
 * Extract the relevant moods and themes from the user's message and pass them
 * as arrays. The system matches them against the mood and attribute tags that
 * artists attach to their tracks at upload time — so this works for ANY artist,
 * including new or unknown ones.
 *
 * Common mood values: Uplifting, Romantic, Melancholic, Energetic, Calm, Joyful,
 *   Emotional, Empowering, Sensual, Spiritual, Nostalgic, Aggressive, Playful
 *
 * Common attribute/theme values: Women empowerment, Self-love, Heartbreak, Love,
 *   Faith, Family, Celebration, Heritage, Liberation, Street life, Unity, Freedom,
 *   Hustle, Party, Dance, Protest, Resilience
 */
export const searchTracksByThemeTool = new DynamicStructuredTool({
  name: 'search_tracks_by_theme',
  description:
    'Search for tracks by mood and thematic tags. Use this for queries like "uplifting music", "songs about mothers", "women empowerment tracks", or "heartbreak songs". Pass the moods and themes you extract from the user\'s query as arrays.',
  schema: z.object({
    moods: z
      .array(z.string())
      .optional()
      .describe(
        'Mood descriptors extracted from the query. E.g. ["Uplifting", "Romantic", "Joyful"] for "music that celebrates mothers". Use title-case.'
      ),
    attributes: z
      .array(z.string())
      .optional()
      .describe(
        'Theme or attribute tags extracted from the query. E.g. ["Women empowerment", "Family", "Love"] for "music that celebrates mothers". Use title-case.'
      ),
    genre: z
      .string()
      .optional()
      .describe('Optional genre filter (e.g., Afropop, Amapiano, House)'),
    province: z
      .string()
      .optional()
      .describe('Optional province filter (e.g., Gauteng, Western Cape)'),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe('Number of tracks to return (1-30)'),
  }),
  func: async ({
    moods = [],
    attributes = [],
    genre,
    province,
    limit = 20,
  }) => {
    // eslint-disable-next-line no-console
    console.log('[search_tracks_by_theme Tool] ===== TOOL CALLED =====');
    // eslint-disable-next-line no-console
    console.log('[search_tracks_by_theme Tool] Parameters:', {
      moods,
      attributes,
      genre,
      province,
      limit,
    });

    try {
      const tracks = await MusicService.searchTracksByTheme({
        moods,
        attributes,
        genre,
        province,
        limit: Math.min(limit, 30),
      });

      // eslint-disable-next-line no-console
      console.log('[search_tracks_by_theme Tool] Results:', {
        tracksFound: tracks.length,
        firstTrackTitle: tracks[0]?.title || 'N/A',
      });

      const result = {
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
          filePath: track.filePath,
          fileUrl: track.fileUrl,
          artistId: track.artistProfileId,
          artistProfileId: track.artistProfileId,
          userId: track.userId,
          createdAt: track.createdAt,
          updatedAt: track.updatedAt,
          albumArtwork: track.albumArtwork,
          isDownloadable: track.isDownloadable,
          description: track.description,
          attributes: track.attributes || [],
          mood: track.mood || [],
          downloadCount: track.downloadCount || 0,
          shareCount: track.shareCount ?? undefined,
          strength: track.strength || 0,
          // Extended metadata
          bpm: track.bpm ?? undefined,
          year: track.year ?? undefined,
          language: track.language ?? undefined,
          lyrics: track.lyrics ?? undefined,
          isExplicit: track.isExplicit ?? false,
          isPublic: track.isPublic ?? true,
          album: track.album ?? undefined,
          composer: track.composer ?? undefined,
          isrc: track.isrc ?? undefined,
          copyrightInfo: track.copyrightInfo ?? undefined,
          streamingLinks: track.streamingLinks ?? [],
          artistProfile: track.artistProfile
            ? {
                id: track.artistProfile.id,
                artistName: track.artistProfile.artistName,
                bio: track.artistProfile.bio ?? null,
                isVerified: track.artistProfile.isVerified ?? false,
                location: track.artistProfile.location ?? null,
                profileImage: track.artistProfile.profileImage ?? null,
                socialLinks: track.artistProfile.socialLinks ?? null,
                streamingLinks: track.artistProfile.streamingLinks ?? null,
              }
            : undefined,
        })),
        count: tracks.length,
        searchedMoods: moods,
        searchedAttributes: attributes,
      };
      const validated = SearchTracksByThemeOutputSchema.parse(result);
      return JSON.stringify(validated);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('Error in searchTracksByThemeTool:', errorMessage);
      return JSON.stringify({
        error: 'Failed to search tracks by theme',
        errorDetail: errorMessage,
        tracks: [],
        count: 0,
      });
    }
  },
});

/**
 * Get available genres
 */
export const getGenresTool = new DynamicStructuredTool({
  name: 'get_genres',
  description:
    'Get a list of all available music genres on the platform. Use this when users ask about available genres, what genres exist, or want to browse genres.',
  schema: z.object({
    limit: z
      .number()
      .optional()
      .default(50)
      .describe('Maximum number of genres to return (1-100)'),
    includeInactive: z
      .boolean()
      .optional()
      .default(false)
      .describe('Include inactive genres in results'),
  }),
  func: async ({ limit = 50, includeInactive = false }) => {
    try {
      const { prisma } = await import('@/lib/db');
      const genres = await prisma.genre.findMany({
        where: {
          isActive: includeInactive ? undefined : true,
        },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        take: Math.min(limit, 100),
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          colorHex: true,
          icon: true,
          _count: {
            select: {
              tracks: true,
            },
          },
        },
      });

      const result = {
        genres: genres.map(genre => ({
          id: genre.id,
          name: genre.name,
          slug: genre.slug,
          description: genre.description,
          colorHex: genre.colorHex,
          icon: genre.icon,
          trackCount: genre._count.tracks,
        })),
        count: genres.length,
      };
      const validated = GetGenresOutputSchema.parse(result);
      return JSON.stringify(validated);
    } catch (error) {
      console.error('Error in getGenresTool:', error);
      return JSON.stringify({
        error: 'Failed to get genres',
        genres: [],
        count: 0,
      });
    }
  },
});

/**
 * Search tracks by semantic meaning — mood, feeling, emotion, or theme.
 * Uses pgvector cosine similarity against pre-computed track embeddings.
 */
export const searchTracksSemanticTool = new DynamicStructuredTool({
  name: 'search_tracks_semantic',
  description:
    'Search tracks by semantic meaning — mood, feeling, emotion, or theme. Use for: "songs about love", "uplifting music", "heartbreak vibes", "chill Sunday music", "I feel in love", "when you\'re feeling sad". Returns tracks ranked by semantic similarity to the query.',
  schema: z.object({
    query: z
      .string()
      .describe(
        'Free-form query describing the mood, feeling, theme, or emotion (e.g. "in love", "heartbreak and sadness", "uplifting motivation")'
      ),
    genre: z
      .string()
      .optional()
      .describe('Optional genre filter (e.g., Amapiano, Afrobeat)'),
    limit: z.number().optional().default(10).describe('Number of results'),
  }),
  func: async ({ query, genre, limit = 10 }) => {
    try {
      const tracks = await MusicService.searchTracksBySemantic(query, {
        limit,
        genre,
      });

      const result = {
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
          filePath: track.filePath,
          fileUrl: track.fileUrl,
          artistId: track.artistProfileId,
          artistProfileId: track.artistProfileId,
          userId: track.userId,
          createdAt: track.createdAt,
          updatedAt: track.updatedAt,
          albumArtwork: track.albumArtwork,
          isDownloadable: track.isDownloadable,
          description: track.description,
          attributes: track.attributes || [],
          mood: track.mood || [],
          downloadCount: track.downloadCount || 0,
          shareCount: track.shareCount ?? undefined,
          strength: track.strength || 0,
          bpm: track.bpm ?? undefined,
          year: track.year ?? undefined,
          language: track.language ?? undefined,
          lyrics: track.lyrics ?? undefined,
          isExplicit: track.isExplicit ?? false,
          isPublic: track.isPublic ?? true,
          album: track.album ?? undefined,
          composer: track.composer ?? undefined,
          isrc: track.isrc ?? undefined,
          copyrightInfo: track.copyrightInfo ?? undefined,
          streamingLinks: track.streamingLinks ?? [],
          artistProfile: track.artistProfile
            ? {
                id: track.artistProfile.id,
                artistName: track.artistProfile.artistName,
                bio: track.artistProfile.bio ?? null,
                isVerified: track.artistProfile.isVerified ?? false,
                location: track.artistProfile.location ?? null,
                profileImage: track.artistProfile.profileImage ?? null,
                socialLinks: track.artistProfile.socialLinks ?? null,
                streamingLinks: track.artistProfile.streamingLinks ?? null,
              }
            : undefined,
        })),
        count: tracks.length,
      };

      const validated = SearchTracksOutputSchema.parse(result);
      return JSON.stringify(validated);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('Error in searchTracksSemanticTool:', errorMessage);
      return JSON.stringify({
        error: 'Failed to search tracks semantically',
        errorDetail: errorMessage,
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
  searchTracksByThemeTool,
  searchTracksSemanticTool,
  getTrackTool,
  getPlaylistTool,
  getArtistTool,
  getTopChartsTool,
  getFeaturedPlaylistsTool,
  getTrendingTracksTool,
  getPlaylistsByGenreTool,
  getPlaylistsByProvinceTool,
  getTracksByGenreTool,
  getGenresTool,
];
