import { NextResponse } from 'next/server';
import { PlaylistService } from '@/lib/services';

// GET /api/playlists/featured - Get featured playlist (first one)
export async function GET() {
  try {
    const playlists = await PlaylistService.getFeaturedPlaylists(1);

    if (!playlists || playlists.length === 0) {
      return NextResponse.json(
        { error: 'No featured playlist found' },
        { status: 404 }
      );
    }

    const featuredPlaylist = playlists[0];
    const playlistWithTracks = await PlaylistService.getPlaylistById(
      featuredPlaylist.id
    );

    if (!playlistWithTracks) {
      return NextResponse.json(
        { error: 'No featured playlist found' },
        { status: 404 }
      );
    }

    // Get playlist type for response
    const tracks = playlistWithTracks.tracks.map(pt => pt.track);

    return NextResponse.json({
      playlist: {
        id: playlistWithTracks.id,
        name: playlistWithTracks.name,
        description: playlistWithTracks.description,
        playlistType: playlistWithTracks.playlistType,
        status: playlistWithTracks.status,
      },
      tracks,
    });
  } catch (error) {
    console.error('Error fetching featured playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured playlist' },
      { status: 500 }
    );
  }
}
