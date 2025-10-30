import { NextResponse } from 'next/server';
import { PlaylistService } from '@/lib/services';

// GET /api/playlists/featured - Get featured playlists
export async function GET() {
  try {
    const playlists = await PlaylistService.getFeaturedPlaylists(10);

    // Transform to API response format
    const playlistsWithDetails = await Promise.all(
      playlists.map(async playlist => {
        const withTracks = await PlaylistService.getPlaylistById(playlist.id);
        return {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          playlistType: playlist.playlistType,
          status: playlist.status,
          tracks: withTracks ? withTracks.tracks.map(pt => pt.track) : [],
        };
      })
    );

    return NextResponse.json({
      playlists: playlistsWithDetails,
    });
  } catch (error) {
    console.error('Error fetching featured playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured playlists' },
      { status: 500 }
    );
  }
}
