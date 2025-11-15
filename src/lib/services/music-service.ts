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

    // Add genre filter if provided (check both genreId and legacy genre field)
    if (genre) {
      // Normalize the genre input
      const normalizedGenre = genre.toLowerCase().trim();
      const slugVariations = [
        normalizedGenre,
        normalizedGenre.replace(/\s+/g, '-'),
        normalizedGenre.replace(/-/g, ''),
        normalizedGenre.replace(/\s+/g, ''),
      ];

      // Get all active genres to check aliases manually
      const allGenres = await prisma.genre.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, name: true, aliases: true },
      });

      // Find matching genre
      let resolved: { id: string } | null = null;
      for (const g of allGenres) {
        if (slugVariations.includes(g.slug.toLowerCase())) {
          resolved = { id: g.id };
          break;
        }
        if (g.name.toLowerCase() === normalizedGenre) {
          resolved = { id: g.id };
          break;
        }
        if (g.aliases && Array.isArray(g.aliases)) {
          const normalizedAliases = g.aliases.map(a =>
            typeof a === 'string' ? a.toLowerCase() : ''
          );
          if (
            normalizedAliases.includes(normalizedGenre) ||
            slugVariations.some(v => normalizedAliases.includes(v))
          ) {
            resolved = { id: g.id };
            break;
          }
        }
      }

      // Build OR conditions for genre filtering
      const genreConditions: any[] = [];

      if (resolved) {
        // Check tracks with genreId (new schema)
        genreConditions.push({ genreId: resolved.id });

        // Also check legacy genre string field
        const genreName = allGenres.find(g => g.id === resolved!.id)?.name;
        const genreAliases =
          allGenres.find(g => g.id === resolved!.id)?.aliases || [];

        const genreStrings = [genre, normalizedGenre, ...slugVariations];
        if (genreName) {
          genreStrings.push(genreName, genreName.toLowerCase());
        }
        if (genreAliases && Array.isArray(genreAliases)) {
          genreStrings.push(
            ...genreAliases,
            ...genreAliases.map(a =>
              typeof a === 'string' ? a.toLowerCase() : ''
            )
          );
        }

        const uniqueGenreStrings = Array.from(
          new Set(genreStrings.filter(s => s && s.length > 0))
        );

        genreConditions.push(
          ...uniqueGenreStrings.map(genreStr => ({
            genre: { equals: genreStr, mode: 'insensitive' },
          }))
        );
      } else {
        // Fallback to legacy genre field only
        genreConditions.push({
          genre: { contains: genre, mode: 'insensitive' },
        });
      }

      // Add genre filter to where clause
      if (genreConditions.length > 0) {
        where.AND = [{ OR: genreConditions }];
      }
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
        genreRef: true,
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
   * @param genre - Genre name, slug, or alias (e.g., "3 Step", "Afro Pop", "amapiano")
   * @param limit - Number of tracks to return
   * @returns Array of tracks in the genre
   */
  static async getTracksByGenre(
    genre: string,
    limit: number = 20
  ): Promise<TrackWithArtist[]> {
    // Normalize the genre input: lowercase, handle variations
    const normalizedGenre = genre.toLowerCase().trim();
    // Try multiple slug variations: "afropop", "afro-pop", "afro pop"
    const slugVariations = [
      normalizedGenre,
      normalizedGenre.replace(/\s+/g, '-'), // "afro pop" -> "afro-pop"
      normalizedGenre.replace(/-/g, ''), // "afro-pop" -> "afropop"
      normalizedGenre.replace(/\s+/g, ''), // "afro pop" -> "afropop"
    ];

    // Get all active genres to check aliases manually (Prisma hasSome is case-sensitive)
    const allGenres = await prisma.genre.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, aliases: true },
    });

    // Find matching genre by checking slug, name, and aliases (case-insensitive)
    let resolved: { id: string } | null = null;
    for (const g of allGenres) {
      // Check slug variations
      if (slugVariations.includes(g.slug.toLowerCase())) {
        resolved = { id: g.id };
        break;
      }
      // Check name (case-insensitive)
      if (g.name.toLowerCase() === normalizedGenre) {
        resolved = { id: g.id };
        break;
      }
      // Check aliases (case-insensitive)
      if (g.aliases && Array.isArray(g.aliases)) {
        const normalizedAliases = g.aliases.map(a =>
          typeof a === 'string' ? a.toLowerCase() : ''
        );
        if (
          normalizedAliases.includes(normalizedGenre) ||
          slugVariations.some(v => normalizedAliases.includes(v))
        ) {
          resolved = { id: g.id };
          break;
        }
      }
    }

    const where: any = {
      isPublic: true,
      OR: [],
    };

    if (resolved) {
      // Check tracks with genreId (new schema)
      where.OR.push({ genreId: resolved.id });
    }

    // Also check legacy genre string field (case-insensitive)
    // Match against genre name, aliases, and variations
    const genreName = resolved
      ? allGenres.find(g => g.id === resolved.id)?.name
      : null;
    const genreAliases = resolved
      ? allGenres.find(g => g.id === resolved.id)?.aliases || []
      : [];

    // Build list of genre strings to match
    const genreStrings = [genre, normalizedGenre, ...slugVariations];

    if (genreName) {
      genreStrings.push(genreName, genreName.toLowerCase());
    }

    if (genreAliases && Array.isArray(genreAliases)) {
      genreStrings.push(
        ...genreAliases,
        ...genreAliases.map(a => (typeof a === 'string' ? a.toLowerCase() : ''))
      );
    }

    // Remove duplicates and empty strings
    const uniqueGenreStrings = Array.from(
      new Set(genreStrings.filter(s => s && s.length > 0))
    );

    // Add OR conditions for legacy genre field
    if (uniqueGenreStrings.length > 0) {
      where.OR.push(
        ...uniqueGenreStrings.map(genreStr => ({
          genre: { equals: genreStr, mode: 'insensitive' },
        }))
      );
    }

    // If no genre was resolved and no genre strings, fallback to contains match
    if (where.OR.length === 0) {
      where.OR.push({ genre: { contains: genre, mode: 'insensitive' } });
    }

    const tracks = await prisma.track.findMany({
      where,
      include: {
        artistProfile: true,
        genreRef: true,
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
