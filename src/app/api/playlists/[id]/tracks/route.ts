import { NextRequest, NextResponse } from 'next/server';
import { PlaylistService } from '@/lib/services';
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

    const playlistWithTracks =
      await PlaylistService.getPlaylistById(playlistId);

    if (!playlistWithTracks) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Get playlist type for response
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        playlistType: true,
      },
    });

    // Transform tracks to API response format
    const tracks = playlistWithTracks.tracks.map(pt => pt.track);

    return NextResponse.json({
      playlist: {
        id: playlistWithTracks.id,
        name: playlistWithTracks.name,
        description: playlistWithTracks.description,
        playlistType: playlist?.playlistType,
        status: playlistWithTracks.status,
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
