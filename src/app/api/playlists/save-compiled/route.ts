import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/playlists/save-compiled
 * Save a compiled AI playlist to the database
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      coverImage,
      tracks,
      genre,
    }: {
      name: string;
      description?: string;
      coverImage?: string;
      tracks: Array<{ trackId: string; order: number }>;
      genre?: string;
    } = body;

    if (!name || !tracks || tracks.length === 0) {
      return NextResponse.json(
        { error: 'Name and tracks are required' },
        { status: 400 }
      );
    }

    // Find Genre playlist type
    const genrePlaylistType = await prisma.playlistTypeDefinition.findFirst({
      where: { slug: 'genre', isActive: true },
    });

    if (!genrePlaylistType) {
      return NextResponse.json(
        { error: 'Genre playlist type not found' },
        { status: 404 }
      );
    }

    // Get next order number
    const lastPlaylist = await prisma.playlist.findFirst({
      where: { playlistTypeId: genrePlaylistType.id },
      orderBy: { order: 'desc' },
    });
    const order = (lastPlaylist?.order || 0) + 1;

    // Create playlist
    const playlist = await prisma.playlist.create({
      data: {
        name,
        description:
          description || `A curated ${genre || ''} playlist compiled by AI`,
        playlistTypeId: genrePlaylistType.id,
        coverImage: coverImage || '',
        maxTracks: 50,
        currentTracks: tracks.length,
        status: 'ACTIVE',
        submissionStatus: 'CLOSED',
        maxSubmissionsPerArtist: 1,
        createdBy: session.user.id,
        order,
      },
    });

    // Add tracks to playlist
    if (tracks.length > 0) {
      await prisma.playlistTrack.createMany({
        data: tracks.map(({ trackId, order: trackOrder }) => ({
          playlistId: playlist.id,
          trackId,
          order: trackOrder,
          addedBy: session.user.id,
        })),
      });
    }

    logger.info('Compiled playlist saved', {
      playlistId: playlist.id,
      userId: session.user.id,
      trackCount: tracks.length,
    });

    return NextResponse.json(
      {
        success: true,
        playlist: {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          trackCount: tracks.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error saving compiled playlist:', error);
    return NextResponse.json(
      { error: 'Failed to save playlist' },
      { status: 500 }
    );
  }
}
