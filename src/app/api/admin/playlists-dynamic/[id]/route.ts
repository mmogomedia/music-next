import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/admin/playlists-dynamic/[id] - Get single playlist
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
      include: {
        playlistType: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            submissions: {
              where: { status: 'PENDING' },
            },
            tracks: true,
          },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/playlists-dynamic/[id] - Update playlist
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      playlistTypeId,
      coverImage,
      maxTracks,
      maxSubmissionsPerArtist,
      province,
      status,
      submissionStatus,
    } = body;

    // Validate required fields
    if (
      !name ||
      !playlistTypeId ||
      !coverImage ||
      !maxTracks ||
      !maxSubmissionsPerArtist
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if playlist exists
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id: params.id },
      include: { playlistType: true },
    });

    if (!existingPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Get the playlist type definition
    const playlistType = await prisma.playlistTypeDefinition.findUnique({
      where: { id: playlistTypeId },
    });

    if (!playlistType) {
      return NextResponse.json(
        { error: 'Invalid playlist type' },
        { status: 400 }
      );
    }

    // Validate type-specific constraints
    if (playlistType.maxInstances !== -1) {
      const existingCount = await prisma.playlist.count({
        where: {
          playlistTypeId,
          status: 'ACTIVE',
          id: { not: params.id }, // Exclude current playlist
        },
      });

      if (existingCount >= playlistType.maxInstances) {
        return NextResponse.json(
          {
            error: `Maximum ${playlistType.maxInstances} active ${playlistType.name} playlist(s) allowed`,
          },
          { status: 400 }
        );
      }
    }

    if (playlistType.requiresProvince && province) {
      const existingProvince = await prisma.playlist.findFirst({
        where: {
          playlistTypeId,
          province,
          status: 'ACTIVE',
          id: { not: params.id }, // Exclude current playlist
        },
      });

      if (existingProvince) {
        return NextResponse.json(
          {
            error: `Only one ${province} ${playlistType.name} playlist can be active at a time`,
          },
          { status: 400 }
        );
      }
    }

    const playlist = await prisma.playlist.update({
      where: { id: params.id },
      data: {
        name,
        description,
        playlistTypeId,
        coverImage,
        maxTracks,
        maxSubmissionsPerArtist,
        province: playlistType.requiresProvince ? province : null,
        status: status || existingPlaylist.status,
        submissionStatus: submissionStatus || existingPlaylist.submissionStatus,
      },
      include: {
        playlistType: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            submissions: {
              where: { status: 'PENDING' },
            },
            tracks: true,
          },
        },
      },
    });

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/playlists-dynamic/[id] - Delete playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if playlist exists and has submissions/tracks
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            submissions: true,
            tracks: true,
          },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (playlist._count.submissions > 0 || playlist._count.tracks > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete playlist with submissions or tracks. Please remove them first.',
        },
        { status: 400 }
      );
    }

    await prisma.playlist.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}
