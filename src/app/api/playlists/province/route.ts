import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PlaylistType, PlaylistStatus } from '@/types/playlist';

// GET /api/playlists/province - Get province playlists
export async function GET() {
  try {
    const provincePlaylists = await prisma.playlist.findMany({
      where: {
        type: PlaylistType.PROVINCE,
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
