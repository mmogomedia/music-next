/**
 * Tests for Discovery Tools
 *
 * Tests all LangChain discovery tools including:
 * - searchTracksTool
 * - getTrackTool
 * - getPlaylistTool
 * - getArtistTool
 * - getTopChartsTool
 * - getFeaturedPlaylistsTool
 * - getTrendingTracksTool
 * - getPlaylistsByGenreTool
 * - getPlaylistsByProvinceTool
 * - getTracksByGenreTool
 * - getGenresTool
 */

import {
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
  getGenresTool,
} from '../discovery-tools';
import {
  MusicService,
  PlaylistService,
  ArtistService,
  AnalyticsService,
} from '@/lib/services';
import { constructFileUrl } from '@/lib/url-utils';

// Mock services
jest.mock('@/lib/services', () => ({
  MusicService: {
    searchTracks: jest.fn(),
    getTrackById: jest.fn(),
    getTracksByGenre: jest.fn(),
  },
  PlaylistService: {
    getPlaylistById: jest.fn(),
    getTopCharts: jest.fn(),
    getFeaturedPlaylists: jest.fn(),
    getPlaylistsByGenre: jest.fn(),
    getPlaylistsByProvince: jest.fn(),
  },
  ArtistService: {
    getArtistBySlug: jest.fn(),
  },
  AnalyticsService: {
    getTrendingTracks: jest.fn(),
  },
}));

jest.mock('@/lib/url-utils', () => ({
  constructFileUrl: jest.fn(
    (path: string) => `https://asset.flemoji.com/${path}`
  ),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    genre: {
      findMany: jest.fn(),
    },
  },
}));

describe('Discovery Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchTracksTool', () => {
    const mockTrack = {
      id: 'track-1',
      title: 'Test Track',
      artist: 'Test Artist',
      artistProfile: null,
      genre: 'Amapiano',
      duration: 180,
      playCount: 1000,
      likeCount: 50,
      coverImageUrl: 'https://example.com/cover.jpg',
      uniqueUrl: 'test-track',
      filePath: 'audio/test.mp3',
      fileUrl: 'https://asset.flemoji.com/audio/test.mp3',
      artistProfileId: 'artist-1',
      userId: 'user-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      albumArtwork: null,
      isDownloadable: true,
      description: 'A test track',
      attributes: ['dance', 'upbeat'],
      mood: ['energetic'],
      downloadCount: 100,
      strength: 85,
    };

    it('should search tracks successfully', async () => {
      (MusicService.searchTracks as jest.Mock).mockResolvedValue([mockTrack]);

      const result = await searchTracksTool.func({
        query: 'test',
        orderBy: 'recent',
      });

      const parsed = JSON.parse(result);
      expect(parsed.tracks).toHaveLength(1);
      expect(parsed.tracks[0]).toMatchObject({
        id: 'track-1',
        title: 'Test Track',
        artist: 'Test Artist',
        genre: 'Amapiano',
        description: 'A test track',
        attributes: ['dance', 'upbeat'],
        mood: ['energetic'],
        downloadCount: 100,
        strength: 85,
      });
      expect(parsed.count).toBe(1);
      expect(MusicService.searchTracks).toHaveBeenCalledWith('test', {
        genre: undefined,
        province: undefined,
        limit: 10, // Hard limit of 10
        offset: 0,
        orderBy: 'recent',
        minStrength: 70,
        excludeIds: undefined,
      });
    });

    it('should handle genre and province filters', async () => {
      (MusicService.searchTracks as jest.Mock).mockResolvedValue([mockTrack]);

      await searchTracksTool.func({
        query: 'test',
        genre: 'Amapiano',
        province: 'Gauteng',
        orderBy: 'popular',
      });

      expect(MusicService.searchTracks).toHaveBeenCalledWith('test', {
        genre: 'Amapiano',
        province: 'Gauteng',
        limit: 10, // Hard limit of 10
        offset: 0,
        orderBy: 'popular',
        minStrength: 70,
        excludeIds: undefined,
      });
    });

    it('should always limit results to 10 maximum', async () => {
      (MusicService.searchTracks as jest.Mock).mockResolvedValue([]);

      await searchTracksTool.func({
        query: 'test',
      });

      expect(MusicService.searchTracks).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          limit: 10, // Hard limit of 10, regardless of any limit parameter
        })
      );
    });

    it('should support excludeIds for pagination', async () => {
      (MusicService.searchTracks as jest.Mock).mockResolvedValue([mockTrack]);

      await searchTracksTool.func({
        query: 'test',
        excludeIds: ['track-1', 'track-2', 'track-3'],
      });

      expect(MusicService.searchTracks).toHaveBeenCalledWith('test', {
        genre: undefined,
        province: undefined,
        limit: 10,
        offset: 0,
        orderBy: 'recent',
        minStrength: 70,
        excludeIds: ['track-1', 'track-2', 'track-3'],
      });
    });

    it('should handle errors gracefully', async () => {
      (MusicService.searchTracks as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await searchTracksTool.func({
        query: 'test',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Failed to search tracks');
      expect(parsed.tracks).toEqual([]);
      expect(parsed.count).toBe(0);
    });

    it('should handle tracks without optional fields', async () => {
      const minimalTrack = {
        ...mockTrack,
        description: null,
        attributes: null,
        mood: null,
        downloadCount: null,
        strength: null,
      };
      (MusicService.searchTracks as jest.Mock).mockResolvedValue([
        minimalTrack,
      ]);

      const result = await searchTracksTool.func({
        query: 'test',
      });

      const parsed = JSON.parse(result);
      expect(parsed.tracks[0].attributes).toEqual([]);
      expect(parsed.tracks[0].mood).toEqual([]);
      expect(parsed.tracks[0].downloadCount).toBe(0);
      expect(parsed.tracks[0].strength).toBe(0);
    });
  });

  describe('getTrackTool', () => {
    const mockTrack = {
      id: 'track-1',
      title: 'Test Track',
      artist: 'Test Artist',
      artistProfile: null,
      genre: 'Amapiano',
      album: 'Test Album',
      duration: 180,
      description: 'A test track',
      playCount: 1000,
      likeCount: 50,
      shareCount: 25,
      coverImageUrl: 'https://example.com/cover.jpg',
      uniqueUrl: 'test-track',
      isDownloadable: true,
    };

    it('should get track by ID successfully', async () => {
      (MusicService.getTrackById as jest.Mock).mockResolvedValue(mockTrack);

      const result = await getTrackTool.func({
        trackId: 'track-1',
      });

      const parsed = JSON.parse(result);
      expect(parsed.track).toMatchObject({
        id: 'track-1',
        title: 'Test Track',
        artist: 'Test Artist',
        genre: 'Amapiano',
        album: 'Test Album',
        duration: 180,
        description: 'A test track',
        playCount: 1000,
        likeCount: 50,
        shareCount: 25,
      });
      expect(MusicService.getTrackById).toHaveBeenCalledWith('track-1');
    });

    it('should handle track not found', async () => {
      (MusicService.getTrackById as jest.Mock).mockResolvedValue(null);

      const result = await getTrackTool.func({
        trackId: 'non-existent',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Track not found');
      expect(parsed.track).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (MusicService.getTrackById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await getTrackTool.func({
        trackId: 'track-1',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Failed to get track');
      expect(parsed.track).toBeNull();
    });
  });

  describe('getPlaylistTool', () => {
    const mockPlaylist = {
      id: 'playlist-1',
      name: 'Test Playlist',
      description: 'A test playlist',
      tracks: [
        {
          track: {
            id: 'track-1',
            title: 'Track 1',
            artist: 'Artist 1',
            artistProfile: null,
            genre: 'Amapiano',
            coverImageUrl: 'https://example.com/cover1.jpg',
          },
        },
        {
          track: {
            id: 'track-2',
            title: 'Track 2',
            artist: 'Artist 2',
            artistProfile: null,
            genre: 'Afrobeat',
            coverImageUrl: 'https://example.com/cover2.jpg',
          },
        },
      ],
    };

    it('should get playlist by ID successfully', async () => {
      (PlaylistService.getPlaylistById as jest.Mock).mockResolvedValue(
        mockPlaylist
      );

      const result = await getPlaylistTool.func({
        playlistId: 'playlist-1',
      });

      const parsed = JSON.parse(result);
      expect(parsed.playlist).toMatchObject({
        id: 'playlist-1',
        name: 'Test Playlist',
        description: 'A test playlist',
        trackCount: 2,
      });
      expect(parsed.playlist.tracks).toHaveLength(2);
      expect(parsed.playlist.tracks[0]).toMatchObject({
        id: 'track-1',
        title: 'Track 1',
        artist: 'Artist 1',
        genre: 'Amapiano',
      });
    });

    it('should limit tracks to 10', async () => {
      const largePlaylist = {
        ...mockPlaylist,
        tracks: Array.from({ length: 15 }, (_, i) => ({
          track: {
            id: `track-${i}`,
            title: `Track ${i}`,
            artist: `Artist ${i}`,
            artistProfile: null,
            genre: 'Amapiano',
            coverImageUrl: `https://example.com/cover${i}.jpg`,
          },
        })),
      };
      (PlaylistService.getPlaylistById as jest.Mock).mockResolvedValue(
        largePlaylist
      );

      const result = await getPlaylistTool.func({
        playlistId: 'playlist-1',
      });

      const parsed = JSON.parse(result);
      expect(parsed.playlist.tracks).toHaveLength(10);
    });

    it('should handle playlist not found', async () => {
      (PlaylistService.getPlaylistById as jest.Mock).mockResolvedValue(null);

      const result = await getPlaylistTool.func({
        playlistId: 'non-existent',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Playlist not found');
      expect(parsed.playlist).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (PlaylistService.getPlaylistById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await getPlaylistTool.func({
        playlistId: 'playlist-1',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Failed to get playlist');
      expect(parsed.playlist).toBeNull();
    });
  });

  describe('getArtistTool', () => {
    const mockArtist = {
      id: 'artist-1',
      artistName: 'Test Artist',
      bio: 'A test artist',
      genre: 'Amapiano',
      location: 'Johannesburg',
      totalPlays: 5000,
      totalLikes: 200,
      profileViews: 1000,
      tracks: [
        {
          id: 'track-1',
          title: 'Track 1',
          genre: 'Amapiano',
          playCount: 1000,
        },
        {
          id: 'track-2',
          title: 'Track 2',
          genre: 'Amapiano',
          playCount: 500,
        },
      ],
    };

    it('should get artist by slug successfully', async () => {
      (ArtistService.getArtistBySlug as jest.Mock).mockResolvedValue(
        mockArtist
      );

      const result = await getArtistTool.func({
        artistIdentifier: 'test-artist',
      });

      const parsed = JSON.parse(result);
      expect(parsed.artist).toMatchObject({
        id: 'artist-1',
        artistName: 'Test Artist',
        bio: 'A test artist',
        genre: 'Amapiano',
        location: 'Johannesburg',
        totalPlays: 5000,
        totalLikes: 200,
        profileViews: 1000,
        trackCount: 2,
      });
      expect(parsed.artist.tracks).toHaveLength(2);
      expect(ArtistService.getArtistBySlug).toHaveBeenCalledWith('test-artist');
    });

    it('should limit tracks to 10', async () => {
      const artistWithManyTracks = {
        ...mockArtist,
        tracks: Array.from({ length: 15 }, (_, i) => ({
          id: `track-${i}`,
          title: `Track ${i}`,
          genre: 'Amapiano',
          playCount: 100,
        })),
      };
      (ArtistService.getArtistBySlug as jest.Mock).mockResolvedValue(
        artistWithManyTracks
      );

      const result = await getArtistTool.func({
        artistIdentifier: 'test-artist',
      });

      const parsed = JSON.parse(result);
      expect(parsed.artist.tracks).toHaveLength(10);
    });

    it('should handle artist not found', async () => {
      (ArtistService.getArtistBySlug as jest.Mock).mockResolvedValue(null);

      const result = await getArtistTool.func({
        artistIdentifier: 'non-existent',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Artist not found');
      expect(parsed.artist).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (ArtistService.getArtistBySlug as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await getArtistTool.func({
        artistIdentifier: 'test-artist',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Failed to get artist');
      expect(parsed.artist).toBeNull();
    });
  });

  describe('getTopChartsTool', () => {
    const mockPlaylists = [
      {
        id: 'playlist-1',
        name: 'Top Charts 1',
        description: 'Chart 1',
        trackCount: 20,
      },
      {
        id: 'playlist-2',
        name: 'Top Charts 2',
        description: 'Chart 2',
        trackCount: 15,
      },
    ];

    it('should get top charts successfully', async () => {
      (PlaylistService.getTopCharts as jest.Mock).mockResolvedValue(
        mockPlaylists
      );

      const result = await getTopChartsTool.func({
        limit: 10,
      });

      const parsed = JSON.parse(result);
      expect(parsed.playlists).toHaveLength(2);
      expect(parsed.playlists[0]).toMatchObject({
        id: 'playlist-1',
        name: 'Top Charts 1',
        description: 'Chart 1',
        trackCount: 20,
      });
      expect(parsed.count).toBe(2);
      expect(PlaylistService.getTopCharts).toHaveBeenCalledWith(10);
    });

    it('should limit results to 20 maximum', async () => {
      (PlaylistService.getTopCharts as jest.Mock).mockResolvedValue([]);

      await getTopChartsTool.func({
        limit: 50, // Should be capped at 20
      });

      expect(PlaylistService.getTopCharts).toHaveBeenCalledWith(20);
    });

    it('should use default limit of 10', async () => {
      (PlaylistService.getTopCharts as jest.Mock).mockResolvedValue([]);

      await getTopChartsTool.func({});

      expect(PlaylistService.getTopCharts).toHaveBeenCalledWith(10);
    });

    it('should handle errors gracefully', async () => {
      (PlaylistService.getTopCharts as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await getTopChartsTool.func({});

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Failed to get top charts');
      expect(parsed.playlists).toEqual([]);
      expect(parsed.count).toBe(0);
    });
  });

  describe('getFeaturedPlaylistsTool', () => {
    const mockPlaylists = [
      {
        id: 'playlist-1',
        name: 'Featured 1',
        description: 'Featured playlist 1',
        trackCount: 25,
      },
    ];

    it('should get featured playlists successfully', async () => {
      (PlaylistService.getFeaturedPlaylists as jest.Mock).mockResolvedValue(
        mockPlaylists
      );

      const result = await getFeaturedPlaylistsTool.func({
        limit: 10,
      });

      const parsed = JSON.parse(result);
      expect(parsed.playlists).toHaveLength(1);
      expect(parsed.playlists[0]).toMatchObject({
        id: 'playlist-1',
        name: 'Featured 1',
        description: 'Featured playlist 1',
        trackCount: 25,
      });
      expect(parsed.count).toBe(1);
    });

    it('should handle errors gracefully', async () => {
      (PlaylistService.getFeaturedPlaylists as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await getFeaturedPlaylistsTool.func({});

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Failed to get featured playlists');
      expect(parsed.playlists).toEqual([]);
      expect(parsed.count).toBe(0);
    });
  });

  describe('getTrendingTracksTool', () => {
    const mockTrack = {
      id: 'track-1',
      title: 'Trending Track',
      artist: 'Trending Artist',
      genre: 'Amapiano',
      playCount: 5000,
      likeCount: 200,
      stats: {
        trendingScore: 95,
      },
      coverImageUrl: 'https://example.com/cover.jpg',
      duration: 180,
      filePath: 'audio/trending.mp3',
      artistProfileId: 'artist-1',
      userId: 'user-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      albumArtwork: null,
      isDownloadable: true,
      strength: 90,
    };

    it('should get trending tracks successfully', async () => {
      (AnalyticsService.getTrendingTracks as jest.Mock).mockResolvedValue([
        mockTrack,
      ]);

      const result = await getTrendingTracksTool.func({
        limit: 20,
      });

      const parsed = JSON.parse(result);
      expect(parsed.tracks).toHaveLength(1);
      expect(parsed.tracks[0]).toMatchObject({
        id: 'track-1',
        title: 'Trending Track',
        artist: 'Trending Artist',
        genre: 'Amapiano',
        playCount: 5000,
        likeCount: 200,
        trendingScore: 95,
        strength: 90,
      });
      expect(parsed.tracks[0].fileUrl).toBe(
        'https://asset.flemoji.com/audio/trending.mp3'
      );
      expect(parsed.count).toBe(1);
      expect(AnalyticsService.getTrendingTracks).toHaveBeenCalledWith(20);
    });

    it('should construct fileUrl using constructFileUrl', async () => {
      (AnalyticsService.getTrendingTracks as jest.Mock).mockResolvedValue([
        mockTrack,
      ]);

      const result = await getTrendingTracksTool.func({});
      const parsed = JSON.parse(result);

      expect(constructFileUrl).toHaveBeenCalledWith('audio/trending.mp3');
      expect(parsed.tracks[0].fileUrl).toBe(
        'https://asset.flemoji.com/audio/trending.mp3'
      );
    });

    it('should limit results to 50 maximum', async () => {
      (AnalyticsService.getTrendingTracks as jest.Mock).mockResolvedValue([]);

      await getTrendingTracksTool.func({
        limit: 100, // Should be capped at 50
      });

      expect(AnalyticsService.getTrendingTracks).toHaveBeenCalledWith(50);
    });

    it('should handle errors gracefully', async () => {
      (AnalyticsService.getTrendingTracks as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await getTrendingTracksTool.func({});

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Failed to get trending tracks');
      expect(parsed.tracks).toEqual([]);
      expect(parsed.count).toBe(0);
    });
  });

  describe('getPlaylistsByGenreTool', () => {
    const mockPlaylists = [
      {
        id: 'playlist-1',
        name: 'Amapiano Playlist',
        description: 'Amapiano tracks',
        trackCount: 30,
      },
    ];

    it('should get playlists by genre successfully', async () => {
      (PlaylistService.getPlaylistsByGenre as jest.Mock).mockResolvedValue(
        mockPlaylists
      );

      const result = await getPlaylistsByGenreTool.func({
        genre: 'Amapiano',
        limit: 20,
      });

      const parsed = JSON.parse(result);
      expect(parsed.playlists).toHaveLength(1);
      expect(parsed.playlists[0]).toMatchObject({
        id: 'playlist-1',
        name: 'Amapiano Playlist',
        description: 'Amapiano tracks',
        trackCount: 30,
      });
      expect(parsed.count).toBe(1);
      expect(PlaylistService.getPlaylistsByGenre).toHaveBeenCalledWith(
        'Amapiano',
        20
      );
    });

    it('should limit results to 20 maximum', async () => {
      (PlaylistService.getPlaylistsByGenre as jest.Mock).mockResolvedValue([]);

      await getPlaylistsByGenreTool.func({
        genre: 'Amapiano',
        limit: 50, // Should be capped at 20
      });

      expect(PlaylistService.getPlaylistsByGenre).toHaveBeenCalledWith(
        'Amapiano',
        20
      );
    });

    it('should handle errors gracefully', async () => {
      (PlaylistService.getPlaylistsByGenre as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await getPlaylistsByGenreTool.func({
        genre: 'Amapiano',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Failed to get playlists by genre');
      expect(parsed.playlists).toEqual([]);
      expect(parsed.count).toBe(0);
    });
  });

  describe('getPlaylistsByProvinceTool', () => {
    const mockPlaylists = [
      {
        id: 'playlist-1',
        name: 'Gauteng Playlist',
        description: 'Gauteng tracks',
        trackCount: 25,
      },
    ];

    it('should get playlists by province successfully', async () => {
      (PlaylistService.getPlaylistsByProvince as jest.Mock).mockResolvedValue(
        mockPlaylists
      );

      const result = await getPlaylistsByProvinceTool.func({
        province: 'Gauteng',
        limit: 20,
      });

      const parsed = JSON.parse(result);
      expect(parsed.playlists).toHaveLength(1);
      expect(parsed.playlists[0]).toMatchObject({
        id: 'playlist-1',
        name: 'Gauteng Playlist',
        description: 'Gauteng tracks',
        trackCount: 25,
      });
      expect(parsed.count).toBe(1);
      expect(PlaylistService.getPlaylistsByProvince).toHaveBeenCalledWith(
        'Gauteng',
        20
      );
    });

    it('should handle errors gracefully', async () => {
      (PlaylistService.getPlaylistsByProvince as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await getPlaylistsByProvinceTool.func({
        province: 'Gauteng',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Failed to get playlists by province');
      expect(parsed.playlists).toEqual([]);
      expect(parsed.count).toBe(0);
    });
  });

  describe('getTracksByGenreTool', () => {
    const mockTrack = {
      id: 'track-1',
      title: 'Genre Track',
      artist: 'Genre Artist',
      artistProfile: null,
      genre: 'Amapiano',
      playCount: 2000,
      likeCount: 100,
      coverImageUrl: 'https://example.com/cover.jpg',
      duration: 200,
      filePath: 'audio/genre.mp3',
      fileUrl: 'https://asset.flemoji.com/audio/genre.mp3',
      artistProfileId: 'artist-1',
      userId: 'user-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      albumArtwork: null,
      isDownloadable: true,
      description: 'A genre track',
      attributes: ['dance'],
      mood: ['happy'],
      downloadCount: 50,
      strength: 80,
    };

    it('should get tracks by genre successfully', async () => {
      (MusicService.getTracksByGenre as jest.Mock).mockResolvedValue([
        mockTrack,
      ]);

      const result = await getTracksByGenreTool.func({
        genre: 'Amapiano',
        limit: 20,
      });

      const parsed = JSON.parse(result);
      expect(parsed.tracks).toHaveLength(1);
      expect(parsed.tracks[0]).toMatchObject({
        id: 'track-1',
        title: 'Genre Track',
        artist: 'Genre Artist',
        genre: 'Amapiano',
        description: 'A genre track',
        attributes: ['dance'],
        mood: ['happy'],
        downloadCount: 50,
        strength: 80,
      });
      expect(parsed.count).toBe(1);
      expect(MusicService.getTracksByGenre).toHaveBeenCalledWith(
        'Amapiano',
        20,
        { minStrength: 70 }
      );
    });

    it('should limit results to 50 maximum', async () => {
      (MusicService.getTracksByGenre as jest.Mock).mockResolvedValue([]);

      await getTracksByGenreTool.func({
        genre: 'Amapiano',
        limit: 100, // Should be capped at 50
      });

      expect(MusicService.getTracksByGenre).toHaveBeenCalledWith(
        'Amapiano',
        50,
        { minStrength: 70 }
      );
    });

    it('should handle errors gracefully', async () => {
      (MusicService.getTracksByGenre as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await getTracksByGenreTool.func({
        genre: 'Amapiano',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Failed to get tracks by genre');
      expect(parsed.tracks).toEqual([]);
      expect(parsed.count).toBe(0);
    });
  });

  describe('getGenresTool', () => {
    const mockGenres = [
      {
        id: 'genre-1',
        name: 'Amapiano',
        slug: 'amapiano',
        description: 'Amapiano genre',
        colorHex: '#FF5733',
        icon: '🎵',
        _count: {
          tracks: 100,
        },
      },
      {
        id: 'genre-2',
        name: 'Afrobeat',
        slug: 'afrobeat',
        description: 'Afrobeat genre',
        colorHex: '#33FF57',
        icon: '🎶',
        _count: {
          tracks: 50,
        },
      },
    ];

    it('should get genres successfully', async () => {
      const { prisma } = await import('@/lib/db');
      (prisma.genre.findMany as jest.Mock).mockResolvedValue(mockGenres);

      const result = await getGenresTool.func({
        limit: 50,
        includeInactive: false,
      });

      const parsed = JSON.parse(result);
      expect(parsed.genres).toHaveLength(2);
      expect(parsed.genres[0]).toMatchObject({
        id: 'genre-1',
        name: 'Amapiano',
        slug: 'amapiano',
        description: 'Amapiano genre',
        colorHex: '#FF5733',
        icon: '🎵',
        trackCount: 100,
      });
      expect(parsed.count).toBe(2);
      expect(prisma.genre.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        take: 50,
        select: expect.any(Object),
      });
    });

    it('should include inactive genres when requested', async () => {
      const { prisma } = await import('@/lib/db');
      (prisma.genre.findMany as jest.Mock).mockResolvedValue(mockGenres);

      await getGenresTool.func({
        limit: 50,
        includeInactive: true,
      });

      expect(prisma.genre.findMany).toHaveBeenCalledWith({
        where: {
          isActive: undefined,
        },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        take: 50,
        select: expect.any(Object),
      });
    });

    it('should limit results to 100 maximum', async () => {
      const { prisma } = await import('@/lib/db');
      (prisma.genre.findMany as jest.Mock).mockResolvedValue([]);

      await getGenresTool.func({
        limit: 200, // Should be capped at 100
      });

      expect(prisma.genre.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const { prisma } = await import('@/lib/db');
      (prisma.genre.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await getGenresTool.func({});

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Failed to get genres');
      expect(parsed.genres).toEqual([]);
      expect(parsed.count).toBe(0);
    });
  });
});
