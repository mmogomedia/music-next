import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PlaylistType, PlaylistStatus } from '@/types/playlist';

// GET /api/playlists/top-ten - Get top ten playlist
export async function GET() {
  try {
    const topTenPlaylist = await prisma.playlist.findFirst({
      where: {
        type: PlaylistType.TOP_TEN,
        status: PlaylistStatus.ACTIVE,
      },
      include: {
        tracks: {
          include: {
            track: {
              select: {
                id: true,
                title: true,
                artist: true,
                duration: true,
                genre: true,
                coverImageUrl: true,
                albumArtwork: true,
                playCount: true,
                likeCount: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!topTenPlaylist) {
      return NextResponse.json(
        { error: 'No top ten playlist found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      playlist: topTenPlaylist,
      tracks: topTenPlaylist.tracks.map(pt => pt.track),
    });
  } catch (error) {
    console.error('Error fetching top ten playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top ten playlist' },
      { status: 500 }
    );
  }
}
