/**
 * Playlist Service
 *
 * Provides access to playlist data through direct database queries.
 * This service is used by both API routes and AI agents.
 *
 * @module PlaylistService
 */

import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';
import type { Playlist, Track, ArtistProfile } from '@prisma/client';

/**
 * Playlist with tracks
 */
export interface PlaylistWithTracks extends Playlist {
  tracks: Array<{
    track: Track & {
      artistProfile: ArtistProfile | null;
      fileUrl: string;
      coverImageUrl: string | null;
    };
    order: number;
  }>;
}

/**
 * Simplified playlist information
 */
export interface PlaylistInfo extends Playlist {
  trackCount: number;
}

/**
 * Service for accessing playlist data
 */
export class PlaylistService {
  /**
   * Get a playlist by ID with its tracks
   *
   * @param id - Playlist ID
   * @returns Playlist with tracks or null
   */
  static async getPlaylistById(id: string): Promise<PlaylistWithTracks | null> {
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        tracks: {
          include: {
            track: {
              include: {
                artistProfile: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!playlist) {
      return null;
    }

    return this.transformPlaylistWithTracks(playlist);
  }

  /**
   * Get tracks for a specific playlist
   *
   * @param playlistId - Playlist ID
   * @returns Array of tracks in the playlist
   */
  static async getPlaylistTracks(
    playlistId: string
  ): Promise<Array<Track & { fileUrl: string; coverImageUrl: string | null }>> {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        tracks: {
          include: {
            track: {
              include: {
                artistProfile: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!playlist) {
      return [];
    }

    return playlist.tracks.map(pt => {
      const track = pt.track;
      const coverImageUrl = track.coverImageUrl || track.albumArtwork;

      return {
        ...track,
        artist:
          track.artistProfile?.artistName || track.artist || 'Unknown Artist',
        fileUrl: constructFileUrl(track.filePath),
        coverImageUrl: coverImageUrl ? constructFileUrl(coverImageUrl) : null,
      };
    });
  }

  /**
   * Get playlists by genre
   *
   * @param genre - Genre name
   * @param limit - Number of playlists to return
   * @returns Array of playlists
   */
  static async getPlaylistsByGenre(
    genre: string,
    limit: number = 20
  ): Promise<PlaylistInfo[]> {
    const playlists = await prisma.playlist.findMany({
      where: {
        status: 'ACTIVE',
        submissionStatus: 'OPEN',
        playlistType: {
          slug: genre,
          isActive: true,
        },
      },
      include: {
        _count: {
          select: {
            tracks: true,
          },
        },
      },
      orderBy: { order: 'asc' },
      take: limit,
    });

    return playlists.map(p => ({
      ...p,
      trackCount: p._count.tracks,
    })) as PlaylistInfo[];
  }

  /**
   * Get playlists by province
   *
   * @param province - Province name
   * @param limit - Number of playlists to return
   * @returns Array of playlists
   */
  static async getPlaylistsByProvince(
    province: string,
    limit: number = 20
  ): Promise<PlaylistInfo[]> {
    // Find playlists that have tracks from artists in the specified province
    const playlists = await prisma.playlist.findMany({
      where: {
        status: 'ACTIVE',
        tracks: {
          some: {
            track: {
              artistProfile: {
                location: { contains: province, mode: 'insensitive' },
              },
            },
          },
        },
      },
      include: {
        _count: {
          select: {
            tracks: true,
          },
        },
      },
      orderBy: { order: 'asc' },
      take: limit,
    });

    return playlists.map(p => ({
      ...p,
      trackCount: p._count.tracks,
    })) as PlaylistInfo[];
  }

  /**
   * Get top charts/trending playlists
   *
   * @param limit - Number of playlists to return
   * @returns Array of top playlists
   */
  static async getTopCharts(limit: number = 10): Promise<PlaylistInfo[]> {
    const playlists = await prisma.playlist.findMany({
      where: {
        status: 'ACTIVE',
        playlistType: {
          slug: 'top-ten',
          isActive: true,
        },
      },
      include: {
        _count: {
          select: {
            tracks: true,
          },
        },
      },
      orderBy: { order: 'asc' },
      take: limit,
    });

    return playlists.map(p => ({
      ...p,
      trackCount: p._count.tracks,
    })) as PlaylistInfo[];
  }

  /**
   * Get featured playlists
   *
   * @param limit - Number of playlists to return
   * @returns Array of featured playlists
   */
  static async getFeaturedPlaylists(
    limit: number = 10
  ): Promise<PlaylistInfo[]> {
    const playlists = await prisma.playlist.findMany({
      where: {
        status: 'ACTIVE',
        playlistType: {
          slug: 'featured',
          isActive: true,
        },
      },
      include: {
        _count: {
          select: {
            tracks: true,
          },
        },
      },
      orderBy: { order: 'asc' },
      take: limit,
    });

    return playlists.map(p => ({
      ...p,
      trackCount: p._count.tracks,
    })) as PlaylistInfo[];
  }

  /**
   * Transform playlist with tracks to include URLs
   */
  private static transformPlaylistWithTracks(
    playlist: any
  ): PlaylistWithTracks {
    return {
      ...playlist,
      tracks: playlist.tracks.map((pt: any) => {
        const track = pt.track;
        const coverImageUrl = track.coverImageUrl || track.albumArtwork;

        return {
          ...pt,
          track: {
            ...track,
            fileUrl: constructFileUrl(track.filePath),
            coverImageUrl: coverImageUrl
              ? constructFileUrl(coverImageUrl)
              : null,
          },
        };
      }),
    };
  }
}
