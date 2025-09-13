import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/playlists/[id]/tracks - Get tracks for a specific playlist
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const playlistId = resolvedParams?.id;

    if (!playlistId) {
      return NextResponse.json(
        { error: 'Playlist ID is required' },
        { status: 400 }
      );
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        tracks: {
          include: {
            track: {
              include: {
                artistProfile: {
                  select: {
                    artistName: true,
                  },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    const tracks = playlist.tracks.map(pt => ({
      ...pt.track,
      artist: pt.track.artistProfile?.artistName || 'Unknown Artist',
    }));

    return NextResponse.json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        type: playlist.type,
        status: playlist.status,
      },
      tracks,
    });
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist tracks' },
      { status: 500 }
    );
  }
}
