import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PlaylistType, PlaylistStatus } from '@/types/playlist';

// GET /api/playlists/featured - Get featured playlist
export async function GET() {
  try {
    const featuredPlaylist = await prisma.playlist.findFirst({
      where: {
        type: PlaylistType.FEATURED,
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

    if (!featuredPlaylist) {
      return NextResponse.json(
        { error: 'No featured playlist found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      playlist: featuredPlaylist,
      tracks: featuredPlaylist.tracks.map(pt => pt.track),
    });
  } catch (error) {
    console.error('Error fetching featured playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured playlist' },
      { status: 500 }
    );
  }
}
