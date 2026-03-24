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
  minStrength?: number;
  excludeIds?: string[]; // Track IDs to exclude from results (for pagination)
}

/**
 * Options for thematic track search (by mood and attribute tags)
 */
export interface SearchByThemeOptions {
  /** Mood descriptors extracted from the user's query, e.g. ["Uplifting", "Romantic"] */
  moods?: string[];
  /** Theme/attribute tags extracted from the user's query, e.g. ["Women empowerment", "Family"] */
  attributes?: string[];
  /** Optional genre filter */
  genre?: string;
  /** Optional province filter */
  province?: string;
  limit?: number;
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
      excludeIds,
    } = options;

    // For multi-artist tracks (primaryArtistIds / featuredArtistIds), we need to pre-fetch
    // matching artist IDs since those fields store IDs, not names.
    const matchingArtistIds = await prisma.artistProfile
      .findMany({
        where: { artistName: { contains: query, mode: 'insensitive' } },
        select: { id: true },
      })
      .then(rows => rows.map(r => r.id));

    const textSearchConditions: any[] = [
      { title: { contains: query, mode: 'insensitive' } },
      { artist: { contains: query, mode: 'insensitive' } }, // legacy string field
      { description: { contains: query, mode: 'insensitive' } },
      // Legacy FK relation — covers tracks with artistProfileId set
      {
        artistProfile: { artistName: { contains: query, mode: 'insensitive' } },
      },
    ];

    // Modern multi-artist pattern — covers tracks using primaryArtistIds / featuredArtistIds
    if (matchingArtistIds.length > 0) {
      textSearchConditions.push({
        primaryArtistIds: { hasSome: matchingArtistIds },
      });
      textSearchConditions.push({
        featuredArtistIds: { hasSome: matchingArtistIds },
      });
    }

    const where: any = {
      isPublic: true,
      OR: textSearchConditions,
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

    // Exclude specific track IDs if provided (for pagination)
    if (excludeIds && Array.isArray(excludeIds) && excludeIds.length > 0) {
      if (!where.AND) where.AND = [];
      where.AND.push({
        id: { notIn: excludeIds },
      });
    }

    // Strength is used for ranking, not filtering. Higher strength = better quality.
    // strength=0 means not yet calculated and will sort last within each tier.
    let orderByClause: any[];
    switch (orderBy) {
      case 'popular':
        orderByClause = [{ strength: 'desc' }, { playCount: 'desc' }];
        break;
      case 'alphabetical':
        orderByClause = [{ title: 'asc' }];
        break;
      case 'recent':
      default:
        orderByClause = [{ strength: 'desc' }, { createdAt: 'desc' }];
    }

    const tracks = await prisma.track.findMany({
      where,
      include: {
        artistProfile: true,
        genreRef: true,
        smartLinks: { include: { platformLinks: true } },
      },
      orderBy: orderByClause,
      take: limit,
      skip: offset,
    });

    // Construct URLs and transform data
    return this.transformTracks(tracks);
  }

  /**
   * Search tracks by mood and attribute tags (thematic search).
   *
   * Unlike searchTracks() which matches against title/artist text, this method
   * matches against the structured mood[] and attributes[] arrays on each track.
   * It is the right tool for queries like "music that celebrates mothers",
   * "uplifting afropop", or "songs about self-love" because it works for ANY
   * artist — including new/unknown ones — as long as their tracks are tagged.
   *
   * @param options - Theme search options
   * @returns Array of tracks matching any of the provided moods or attributes
   */
  static async searchTracksByTheme(
    options: SearchByThemeOptions
  ): Promise<TrackWithArtist[]> {
    const {
      moods = [],
      attributes = [],
      genre,
      province,
      limit = 20,
    } = options;

    const allThemes = [...new Set([...moods, ...attributes])].filter(
      t => t.trim().length > 0
    );

    if (allThemes.length === 0) {
      return [];
    }

    // Generate case variants so we match regardless of how the DB stored the tag
    // e.g. "women empowerment" → ["women empowerment", "Women Empowerment", "women empowerment"]
    const themeVariants = [
      ...new Set(
        allThemes.flatMap(t => {
          const lower = t.toLowerCase().trim();
          const titleCase = lower
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          return [lower, titleCase, t.trim()];
        })
      ),
    ];

    const where: any = {
      isPublic: true,
      OR: [
        { mood: { hasSome: themeVariants } },
        { attributes: { hasSome: themeVariants } },
      ],
    };

    // Genre filter — reuse slug/alias resolution logic
    if (genre) {
      const normalizedGenre = genre.toLowerCase().trim();
      const slugVariations = [
        normalizedGenre,
        normalizedGenre.replace(/\s+/g, '-'),
        normalizedGenre.replace(/-/g, ''),
        normalizedGenre.replace(/\s+/g, ''),
      ];

      const allGenres = await prisma.genre.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, name: true, aliases: true },
      });

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

      const genreConditions: any[] = [];
      if (resolved) {
        genreConditions.push({ genreId: resolved.id });
        const genreName = allGenres.find(g => g.id === resolved!.id)?.name;
        const genreAliases =
          allGenres.find(g => g.id === resolved!.id)?.aliases || [];
        const genreStrings = [genre, normalizedGenre, ...slugVariations];
        if (genreName) genreStrings.push(genreName, genreName.toLowerCase());
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
          ...uniqueGenreStrings.map(gs => ({
            genre: { equals: gs, mode: 'insensitive' },
          }))
        );
      } else {
        genreConditions.push({
          genre: { contains: genre, mode: 'insensitive' },
        });
      }

      where.AND = [{ OR: genreConditions }];
    }

    if (province) {
      where.artistProfile = {
        location: { contains: province, mode: 'insensitive' },
      };
    }

    const tracks = await prisma.track.findMany({
      where,
      include: {
        artistProfile: true,
        genreRef: true,
        smartLinks: { include: { platformLinks: true } },
      },
      orderBy: [{ strength: 'desc' }, { playCount: 'desc' }],
      take: limit,
    });

    return this.transformTracks(tracks);
  }

  /**
   * Search tracks by semantic similarity using pgvector.
   *
   * Embeds the query text, then performs a cosine distance search against
   * pre-computed track embeddings. Works for any thematic or emotional query —
   * e.g. "I feel in love", "songs about heartbreak", "uplifting Monday music".
   *
   * Falls back to an empty array if no embeddings exist yet or on error.
   *
   * @param query - Free-form query string
   * @param options - Optional genre filter and result limit
   * @returns Array of tracks ordered by semantic similarity
   */
  static async searchTracksBySemantic(
    query: string,
    options: { limit?: number; genre?: string; minSimilarity?: number } = {}
  ): Promise<TrackWithArtist[]> {
    const { limit = 10, genre, minSimilarity = 0 } = options;
    // When a threshold is set, fetch extra rows so filtering doesn't leave us under limit
    const fetchLimit = minSimilarity > 0 ? Math.min(limit * 5, 100) : limit;

    // Lazy import to avoid build-time errors (OpenAI client is lazy-init)
    const { embedText } = await import('@/lib/ai/track-embedding-service');
    const queryVec = await embedText(query);

    // Build optional genre sub-clause
    // We do a two-step approach: raw SQL for IDs, then Prisma for full rows.
    type RawRow = { id: string; similarity: number };

    let rows: RawRow[];
    if (genre) {
      // Resolve genre ID so we can filter by genreId (most reliable)
      const normalizedGenre = genre.toLowerCase().trim();
      const allGenres = await prisma.genre.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, name: true, aliases: true },
      });
      let resolvedGenreId: string | null = null;
      for (const g of allGenres) {
        const slugVariations = [
          normalizedGenre,
          normalizedGenre.replace(/\s+/g, '-'),
          normalizedGenre.replace(/-/g, ''),
          normalizedGenre.replace(/\s+/g, ''),
        ];
        if (
          slugVariations.includes(g.slug.toLowerCase()) ||
          g.name.toLowerCase() === normalizedGenre
        ) {
          resolvedGenreId = g.id;
          break;
        }
        if (g.aliases && Array.isArray(g.aliases)) {
          const normAliases = g.aliases.map(a =>
            typeof a === 'string' ? a.toLowerCase() : ''
          );
          if (
            normAliases.includes(normalizedGenre) ||
            slugVariations.some(v => normAliases.includes(v))
          ) {
            resolvedGenreId = g.id;
            break;
          }
        }
      }

      if (resolvedGenreId) {
        rows = await prisma.$queryRaw<RawRow[]>`
          SELECT id,
                 1 - (embedding <=> ${queryVec}::vector(1536)) AS similarity
          FROM "tracks"
          WHERE embedding IS NOT NULL
            AND "isPublic" = true
            AND "genreId" = ${resolvedGenreId}
          ORDER BY embedding <=> ${queryVec}::vector(1536)
          LIMIT ${fetchLimit}
        `;
      } else {
        // Fallback: genre string match
        rows = await prisma.$queryRaw<RawRow[]>`
          SELECT id,
                 1 - (embedding <=> ${queryVec}::vector(1536)) AS similarity
          FROM "tracks"
          WHERE embedding IS NOT NULL
            AND "isPublic" = true
            AND genre ILIKE ${`%${genre}%`}
          ORDER BY embedding <=> ${queryVec}::vector(1536)
          LIMIT ${fetchLimit}
        `;
      }
    } else {
      rows = await prisma.$queryRaw<RawRow[]>`
        SELECT id,
               1 - (embedding <=> ${queryVec}::vector(1536)) AS similarity
        FROM "tracks"
        WHERE embedding IS NOT NULL
          AND "isPublic" = true
        ORDER BY embedding <=> ${queryVec}::vector(1536)
        LIMIT ${fetchLimit}
      `;
    }

    // Apply similarity threshold (post-filter — can't reference computed col in SQL WHERE)
    if (minSimilarity > 0) {
      rows = rows
        .filter(r => Number(r.similarity) >= minSimilarity)
        .slice(0, limit);
    }

    if (rows.length === 0) return [];

    // Preserve similarity order after Prisma fetch
    const idOrder = rows.map(r => r.id);
    const similarityMap = new Map(rows.map(r => [r.id, r.similarity]));

    const tracks = await prisma.track.findMany({
      where: { id: { in: idOrder } },
      include: {
        artistProfile: true,
        genreRef: true,
        smartLinks: { include: { platformLinks: true } },
      },
    });

    // Re-sort by similarity score (descending)
    tracks.sort(
      (a, b) => (similarityMap.get(b.id) ?? 0) - (similarityMap.get(a.id) ?? 0)
    );

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
        smartLinks: { include: { platformLinks: true } },
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
        smartLinks: { include: { platformLinks: true } },
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
        smartLinks: { include: { platformLinks: true } },
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
    limit: number = 20,
    _options: { minStrength?: number } = {}
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
      AND: [],
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
        smartLinks: { include: { platformLinks: true } },
      },
      orderBy: [{ strength: 'desc' }, { playCount: 'desc' }],
      take: limit,
    });

    return this.transformTracks(tracks);
  }

  /**
   * Transform a single track to include URLs
   */
  private static transformTrack(track: any): TrackWithArtist {
    const coverImageUrl = track.coverImageUrl || track.albumArtwork;

    // Collect streaming links from all SmartLinks, deduplicated by platform
    const seenPlatforms = new Set<string>();
    const streamingLinks: { platform: string; url: string }[] = [];
    for (const sl of track.smartLinks ?? []) {
      for (const pl of sl.platformLinks ?? []) {
        if (!seenPlatforms.has(pl.platform)) {
          seenPlatforms.add(pl.platform);
          streamingLinks.push({ platform: pl.platform, url: pl.url });
        }
      }
    }

    return {
      ...track,
      attributes: Array.isArray(track.attributes) ? track.attributes : [],
      mood: Array.isArray(track.mood) ? track.mood : [],
      strength:
        typeof track.strength === 'number'
          ? track.strength
          : track.completionPercentage || 0,
      fileUrl: constructFileUrl(track.filePath),
      coverImageUrl: coverImageUrl ? constructFileUrl(coverImageUrl) : null,
      streamingLinks: streamingLinks.length > 0 ? streamingLinks : undefined,
    };
  }

  /**
   * Transform an array of tracks to include URLs
   */
  private static transformTracks(tracks: any[]): TrackWithArtist[] {
    return tracks.map(track => this.transformTrack(track));
  }
}
