import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PlaylistStatus } from '@/types/playlist';

// GET /api/playlists/genre - Get genre playlists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');

    // First find the "genre" playlist type
    const genreType = await prisma.playlistTypeDefinition.findFirst({
      where: { slug: 'genre', isActive: true },
    });

    if (!genreType) {
      return NextResponse.json(
        { error: 'Genre playlist type not found' },
        { status: 404 }
      );
    }

    const genrePlaylists = await prisma.playlist.findMany({
      where: {
        playlistTypeId: genreType.id,
        status: PlaylistStatus.ACTIVE,
      },
      include: {
        _count: {
          select: {
            tracks: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return NextResponse.json({ playlists: genrePlaylists });
  } catch (error) {
    console.error('Error fetching genre playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch genre playlists' },
      { status: 500 }
    );
  }
}
