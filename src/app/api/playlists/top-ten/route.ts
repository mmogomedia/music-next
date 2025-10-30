import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PlaylistStatus } from '@/types/playlist';
import { constructFileUrl } from '@/lib/url-utils';

// GET /api/playlists/top-ten - Get top ten playlist
export async function GET() {
  try {
    // First find the "top-ten" playlist type
    const topTenType = await prisma.playlistTypeDefinition.findFirst({
      where: { slug: 'top-ten', isActive: true },
    });

    if (!topTenType) {
      return NextResponse.json(
        { error: 'Top ten playlist type not found' },
        { status: 404 }
      );
    }

    const topTenPlaylist = await prisma.playlist.findFirst({
      where: {
        playlistTypeId: topTenType.id,
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
                filePath: true,
                artistProfileId: true,
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

    // Construct full URLs from file paths
    const tracksWithUrls = topTenPlaylist.tracks.map(pt => ({
      ...pt.track,
      fileUrl: constructFileUrl(pt.track.filePath),
      coverImageUrl: pt.track.coverImageUrl
        ? constructFileUrl(pt.track.coverImageUrl)
        : pt.track.albumArtwork
          ? constructFileUrl(pt.track.albumArtwork)
          : null,
    }));

    return NextResponse.json({
      playlist: topTenPlaylist,
      tracks: tracksWithUrls,
    });
  } catch (error) {
    console.error('Error fetching top ten playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top ten playlist' },
      { status: 500 }
    );
  }
}
