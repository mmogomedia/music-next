import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PlaylistStatus } from '@/types/playlist';
import { constructFileUrl } from '@/lib/url-utils';

// GET /api/playlists/featured - Get featured playlist
export async function GET() {
  try {
    // First find the "featured" playlist type
    const featuredType = await prisma.playlistTypeDefinition.findFirst({
      where: { slug: 'featured', isActive: true },
    });

    if (!featuredType) {
      return NextResponse.json(
        { error: 'Featured playlist type not found' },
        { status: 404 }
      );
    }

    const featuredPlaylist = await prisma.playlist.findFirst({
      where: {
        playlistTypeId: featuredType.id,
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
                userId: true,
                createdAt: true,
                updatedAt: true,
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

    // Construct full URLs from file paths
    const tracksWithUrls = featuredPlaylist.tracks.map(pt => ({
      ...pt.track,
      fileUrl: constructFileUrl(pt.track.filePath),
      coverImageUrl: pt.track.coverImageUrl
        ? constructFileUrl(pt.track.coverImageUrl)
        : pt.track.albumArtwork
          ? constructFileUrl(pt.track.albumArtwork)
          : null,
    }));

    return NextResponse.json({
      playlist: featuredPlaylist,
      tracks: tracksWithUrls,
    });
  } catch (error) {
    console.error('Error fetching featured playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured playlist' },
      { status: 500 }
    );
  }
}
