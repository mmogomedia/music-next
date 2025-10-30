/**
 * Analytics Service
 *
 * Provides access to analytics and trending data through direct database queries.
 * This service is used by both API routes and AI agents.
 *
 * @module AnalyticsService
 */

import { prisma } from '@/lib/db';
import type { Track } from '@prisma/client';

/**
 * Trending track with additional stats
 */
export interface TrendingTrack extends Track {
  artist?: string | null;
  stats: {
    playCount: number;
    likeCount: number;
    shareCount: number;
    trendingScore: number;
  };
}

/**
 * Genre statistics
 */
export interface GenreStats {
  genre: string;
  trackCount: number;
  totalPlays: number;
  topTrack?: {
    id: string;
    title: string;
    playCount: number;
  };
}

/**
 * Province statistics
 */
export interface ProvinceStats {
  province: string;
  artistCount: number;
  trackCount: number;
  totalPlays: number;
}

/**
 * Service for accessing analytics data
 */
export class AnalyticsService {
  /**
   * Get trending tracks
   *
   * @param limit - Number of tracks to return
   * @returns Array of trending tracks
   */
  static async getTrendingTracks(limit: number = 10): Promise<TrendingTrack[]> {
    // Get tracks with highest play counts in recent period
    const tracks = await prisma.track.findMany({
      where: {
        isPublic: true,
      },
      include: {
        artistProfile: {
          select: {
            artistName: true,
          },
        },
      },
      orderBy: {
        playCount: 'desc',
      },
      take: limit,
    });

    return tracks.map(track => {
      // Calculate trending score (simple algorithm based on plays and likes)
      const trendingScore = track.playCount * 0.7 + track.likeCount * 0.3;

      return {
        ...track,
        artist:
          track.artistProfile?.artistName || track.artist || 'Unknown Artist',
        stats: {
          playCount: track.playCount,
          likeCount: track.likeCount,
          shareCount: track.shareCount,
          trendingScore,
        },
      };
    });
  }

  /**
   * Get genre statistics
   *
   * @param genre - Genre name (optional, if not provided returns all genres)
   * @returns Genre statistics
   */
  static async getGenreStats(genre?: string): Promise<GenreStats[]> {
    if (genre) {
      // Get stats for specific genre
      const tracks = await prisma.track.findMany({
        where: {
          genre: { contains: genre, mode: 'insensitive' },
          isPublic: true,
        },
        orderBy: {
          playCount: 'desc',
        },
      });

      const topTrack =
        tracks.length > 0
          ? {
              id: tracks[0].id,
              title: tracks[0].title,
              playCount: tracks[0].playCount,
            }
          : undefined;

      return [
        {
          genre,
          trackCount: tracks.length,
          totalPlays: tracks.reduce((sum, t) => sum + t.playCount, 0),
          topTrack,
        },
      ];
    }

    // Get stats for all genres
    const allTracks = await prisma.track.findMany({
      where: {
        isPublic: true,
        genre: { not: null },
      },
      select: {
        genre: true,
        playCount: true,
      },
    });

    // Group by genre
    const genreMap = new Map<string, GenreStats>();

    allTracks.forEach(track => {
      if (!track.genre) return;

      const existing = genreMap.get(track.genre);
      if (existing) {
        existing.trackCount += 1;
        existing.totalPlays += track.playCount;
      } else {
        genreMap.set(track.genre, {
          genre: track.genre,
          trackCount: 1,
          totalPlays: track.playCount,
        });
      }
    });

    // Convert to array and get top track for each genre
    const genres = Array.from(genreMap.values());
    for (const genreStat of genres) {
      const topTrack = await prisma.track.findFirst({
        where: {
          genre: { contains: genreStat.genre, mode: 'insensitive' },
          isPublic: true,
        },
        orderBy: {
          playCount: 'desc',
        },
        select: {
          id: true,
          title: true,
          playCount: true,
        },
      });

      if (topTrack) {
        genreStat.topTrack = topTrack;
      }
    }

    return genres;
  }

  /**
   * Get province statistics
   *
   * @param province - Province name (optional, if not provided returns all provinces)
   * @returns Province statistics
   */
  static async getProvinceStats(province?: string): Promise<ProvinceStats[]> {
    if (province) {
      // Get stats for specific province
      const artists = await prisma.artistProfile.findMany({
        where: {
          location: { contains: province, mode: 'insensitive' },
          isPublic: true,
          isActive: true,
        },
        include: {
          tracks: {
            where: {
              isPublic: true,
            },
          },
        },
      });

      const totalPlays = artists.reduce(
        (sum, artist) =>
          sum +
          artist.tracks.reduce(
            (tracksum, track) => tracksum + track.playCount,
            0
          ),
        0
      );

      return [
        {
          province,
          artistCount: artists.length,
          trackCount: artists.reduce(
            (sum, artist) => sum + artist.tracks.length,
            0
          ),
          totalPlays,
        },
      ];
    }

    // Get stats for all provinces
    const allArtists = await prisma.artistProfile.findMany({
      where: {
        isPublic: true,
        isActive: true,
        location: { not: null },
      },
      include: {
        tracks: {
          where: {
            isPublic: true,
          },
        },
      },
    });

    // Group by province
    const provinceMap = new Map<string, ProvinceStats>();

    allArtists.forEach(artist => {
      if (!artist.location) return;

      const existing = provinceMap.get(artist.location);
      if (existing) {
        existing.artistCount += 1;
        existing.trackCount += artist.tracks.length;
        existing.totalPlays += artist.tracks.reduce(
          (sum, track) => sum + track.playCount,
          0
        );
      } else {
        provinceMap.set(artist.location, {
          province: artist.location,
          artistCount: 1,
          trackCount: artist.tracks.length,
          totalPlays: artist.tracks.reduce(
            (sum, track) => sum + track.playCount,
            0
          ),
        });
      }
    });

    return Array.from(provinceMap.values());
  }
}
