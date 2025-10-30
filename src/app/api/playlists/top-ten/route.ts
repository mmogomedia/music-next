import { NextResponse } from 'next/server';
import { PlaylistService } from '@/lib/services';

// GET /api/playlists/top-ten - Get top ten playlist
export async function GET() {
  try {
    const playlists = await PlaylistService.getTopCharts(1);

    if (!playlists || playlists.length === 0) {
      return NextResponse.json(
        { error: 'No top ten playlist found' },
        { status: 404 }
      );
    }

    const topTenPlaylist = playlists[0];
    const playlistWithTracks = await PlaylistService.getPlaylistById(
      topTenPlaylist.id
    );

    if (!playlistWithTracks) {
      return NextResponse.json(
        { error: 'No top ten playlist found' },
        { status: 404 }
      );
    }

    // Transform to API response format
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
    console.error('Error fetching top ten playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top ten playlist' },
      { status: 500 }
    );
  }
}
