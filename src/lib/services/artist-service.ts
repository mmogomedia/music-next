/**
 * Artist Service
 *
 * Provides access to artist profile data through direct database queries.
 * This service is used by both API routes and AI agents.
 *
 * @module ArtistService
 */

import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';
import type { ArtistProfile, Track, User } from '@prisma/client';

/**
 * Artist profile with tracks
 */
export interface ArtistWithTracks extends ArtistProfile {
  tracks: Track[];
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  fileUrl?: string;
  coverImageUrl?: string | null;
}

/**
 * Complete artist profile for display
 */
export interface ArtistProfileComplete extends ArtistProfile {
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  socialLinks: Record<string, string> | null;
  streamingLinks: Record<string, string> | null;
}

/**
 * Service for accessing artist data
 */
export class ArtistService {
  /**
   * Get artist by slug
   *
   * @param slug - Artist slug
   * @returns Artist profile with tracks and user info
   */
  static async getArtistBySlug(slug: string): Promise<ArtistWithTracks | null> {
    const artist = await prisma.artistProfile.findFirst({
      where: {
        OR: [{ slug }, { artistName: slug }],
        isPublic: true,
        isActive: true,
      },
      include: {
        tracks: {
          where: {
            isPublic: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!artist) {
      return null;
    }

    // Increment profile view count
    await prisma.artistProfile.update({
      where: { id: artist.id },
      data: {
        profileViews: {
          increment: 1,
        },
      },
    });

    return this.transformArtist(artist);
  }

  /**
   * Get artist profile by ID
   *
   * @param id - Artist profile ID
   * @returns Complete artist profile
   */
  static async getArtistProfile(
    id: string
  ): Promise<ArtistProfileComplete | null> {
    const artist = await prisma.artistProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!artist) {
      return null;
    }

    return this.transformArtistProfile(artist);
  }

  /**
   * Get artist tracks
   *
   * @param artistId - Artist profile ID
   * @param limit - Number of tracks to return
   * @returns Array of tracks
   */
  static async getArtistTracks(
    artistId: string,
    limit: number = 20
  ): Promise<Track[]> {
    const tracks = await prisma.track.findMany({
      where: {
        artistProfileId: artistId,
        isPublic: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return tracks;
  }

  /**
   * Get artist by name (fuzzy search)
   *
   * @param artistName - Artist name
   * @returns Artist profile or null
   */
  static async getArtistByName(
    artistName: string
  ): Promise<ArtistProfileComplete | null> {
    const artist = await prisma.artistProfile.findFirst({
      where: {
        artistName: { contains: artistName, mode: 'insensitive' },
        isPublic: true,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!artist) {
      return null;
    }

    return this.transformArtistProfile(artist);
  }

  /**
   * Search for artists by name
   *
   * @param query - Search query
   * @param limit - Number of results
   * @returns Array of artist profiles
   */
  static async searchArtists(
    query: string,
    limit: number = 10
  ): Promise<ArtistProfileComplete[]> {
    const artists = await prisma.artistProfile.findMany({
      where: {
        OR: [
          { artistName: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
          { genre: { contains: query, mode: 'insensitive' } },
        ],
        isPublic: true,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        totalPlays: 'desc',
      },
      take: limit,
    });

    return artists.map(this.transformArtistProfile);
  }

  /**
   * Transform artist to include URLs
   */
  private static transformArtist(artist: any): ArtistWithTracks {
    return {
      ...artist,
      fileUrl: artist.profileImage
        ? constructFileUrl(artist.profileImage)
        : undefined,
      coverImageUrl: artist.coverImage
        ? constructFileUrl(artist.coverImage)
        : null,
    };
  }

  /**
   * Transform artist profile to include URLs and parsed JSON fields
   */
  private static transformArtistProfile(artist: any): ArtistProfileComplete {
    return {
      ...artist,
      profileImageUrl: artist.profileImage
        ? constructFileUrl(artist.profileImage)
        : null,
      coverImageUrl: artist.coverImage
        ? constructFileUrl(artist.coverImage)
        : null,
      socialLinks: artist.socialLinks as Record<string, string> | null,
      streamingLinks: artist.streamingLinks as Record<string, string> | null,
    };
  }
}
