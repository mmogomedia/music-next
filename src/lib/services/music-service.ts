/**
 * Music Service
 *
 * Provides access to track data through direct database queries.
 * This service is used by both API routes and AI agents.
 *
 * @module MusicService
 */

import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';
import type { Track, ArtistProfile } from '@prisma/client';

/**
 * Track with full artist profile information
 */
export interface TrackWithArtist extends Track {
  artistProfile: ArtistProfile | null;
  fileUrl: string;
  coverImageUrl: string | null;
}

/**
 * Search options for track queries
 */
export interface SearchTracksOptions {
  genre?: string;
  province?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'recent' | 'popular' | 'alphabetical';
}

/**
 * Track metadata with enriched information
 */
export interface TrackMetadata extends TrackWithArtist {
  stats?: {
    totalPlays: number;
    totalLikes: number;
    totalShares: number;
  };
}

/**
 * Service for accessing track data
 */
export class MusicService {
  /**
   * Search tracks by title, artist name, or genre
   *
   * @param query - Search query string
   * @param options - Additional search filters
   * @returns Array of tracks with artist information
   */
  static async searchTracks(
    query: string,
    options: SearchTracksOptions = {}
  ): Promise<TrackWithArtist[]> {
    const {
      genre,
      province,
      limit = 20,
      offset = 0,
      orderBy = 'recent',
    } = options;

    const where: any = {
      isPublic: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { artist: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Add genre filter if provided
    if (genre) {
      where.genre = { contains: genre, mode: 'insensitive' };
    }

    // Add artist profile filters for province
    if (province) {
      where.artistProfile = {
        location: { contains: province, mode: 'insensitive' },
      };
    }

    // Define order by
    let orderByClause: any = {};
    switch (orderBy) {
      case 'popular':
        orderByClause = { playCount: 'desc' };
        break;
      case 'alphabetical':
        orderByClause = { title: 'asc' };
        break;
      case 'recent':
      default:
        orderByClause = { createdAt: 'desc' };
    }

    const tracks = await prisma.track.findMany({
      where,
      include: {
        artistProfile: true,
      },
      orderBy: orderByClause,
      take: limit,
      skip: offset,
    });

    // Construct URLs and transform data
    return this.transformTracks(tracks);
  }

  /**
   * Get a specific track by ID
   *
   * @param id - Track ID
   * @returns Track with artist information or null
   */
  static async getTrackById(id: string): Promise<TrackWithArtist | null> {
    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        artistProfile: true,
      },
    });

    if (!track) {
      return null;
    }

    return this.transformTrack(track);
  }

  /**
   * Get a track by unique URL
   *
   * @param uniqueUrl - Track's unique URL
   * @returns Track with artist information or null
   */
  static async getTrackByUrl(
    uniqueUrl: string
  ): Promise<TrackWithArtist | null> {
    const track = await prisma.track.findUnique({
      where: { uniqueUrl },
      include: {
        artistProfile: true,
      },
    });

    if (!track) {
      return null;
    }

    return this.transformTrack(track);
  }

  /**
   * Get enhanced track metadata including statistics
   *
   * @param id - Track ID
   * @returns Enhanced track metadata
   */
  static async getTrackMetadata(id: string): Promise<TrackMetadata | null> {
    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        artistProfile: true,
        _count: {
          select: {
            playEvents: true,
            likeEvents: true,
            shareEvents: true,
          },
        },
      },
    });

    if (!track) {
      return null;
    }

    const transformed = this.transformTrack(track);

    return {
      ...transformed,
      stats: {
        totalPlays: track._count.playEvents,
        totalLikes: track._count.likeEvents,
        totalShares: track._count.shareEvents,
      },
    };
  }

  /**
   * Get tracks by genre
   *
   * @param genre - Genre name
   * @param limit - Number of tracks to return
   * @returns Array of tracks in the genre
   */
  static async getTracksByGenre(
    genre: string,
    limit: number = 20
  ): Promise<TrackWithArtist[]> {
    const tracks = await prisma.track.findMany({
      where: {
        genre: { contains: genre, mode: 'insensitive' },
        isPublic: true,
      },
      include: {
        artistProfile: true,
      },
      orderBy: { playCount: 'desc' },
      take: limit,
    });

    return this.transformTracks(tracks);
  }

  /**
   * Transform a single track to include URLs
   */
  private static transformTrack(track: any): TrackWithArtist {
    const coverImageUrl = track.coverImageUrl || track.albumArtwork;

    return {
      ...track,
      fileUrl: constructFileUrl(track.filePath),
      coverImageUrl: coverImageUrl ? constructFileUrl(coverImageUrl) : null,
    };
  }

  /**
   * Transform an array of tracks to include URLs
   */
  private static transformTracks(tracks: any[]): TrackWithArtist[] {
    return tracks.map(track => this.transformTrack(track));
  }
}
