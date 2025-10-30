import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PlaylistStatus } from '@/types/playlist';

// GET /api/playlists/province - Get province playlists
export async function GET() {
  try {
    // First find the "province" playlist type
    const provinceType = await prisma.playlistTypeDefinition.findFirst({
      where: { slug: 'province', isActive: true },
    });

    if (!provinceType) {
      return NextResponse.json(
        { error: 'Province playlist type not found' },
        { status: 404 }
      );
    }

    const provincePlaylists = await prisma.playlist.findMany({
      where: {
        playlistTypeId: provinceType.id,
        status: PlaylistStatus.ACTIVE,
      },
      include: {
        _count: {
          select: {
            tracks: true,
          },
        },
      },
      orderBy: [{ province: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json({ playlists: provincePlaylists });
  } catch (error) {
    console.error('Error fetching province playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch province playlists' },
      { status: 500 }
    );
  }
}
