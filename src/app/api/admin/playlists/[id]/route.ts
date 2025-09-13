import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
// import { PlaylistStatus, SubmissionStatus } from '@/types/playlist';

// GET /api/admin/playlists/[id] - Get playlist details
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
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
            addedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        submissions: {
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
              },
            },
            artist: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            reviewedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
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

// PUT /api/admin/playlists/[id] - Update playlist
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
      coverImage,
      maxTracks,
      maxSubmissionsPerArtist,
      status,
      submissionStatus,
      province,
      order,
    } = body;

    // Check if playlist exists
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id: params.id },
    });

    if (!existingPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Validate status changes
    if (status === 'ACTIVE') {
      if (existingPlaylist.type === 'FEATURED') {
        const otherFeatured = await prisma.playlist.findFirst({
          where: {
            type: 'FEATURED',
            status: 'ACTIVE',
            id: { not: params.id },
          },
        });
        if (otherFeatured) {
          return NextResponse.json(
            { error: 'Only one featured playlist can be active at a time' },
            { status: 400 }
          );
        }
      }

      if (existingPlaylist.type === 'TOP_TEN') {
        const otherTopTen = await prisma.playlist.findFirst({
          where: {
            type: 'TOP_TEN',
            status: 'ACTIVE',
            id: { not: params.id },
          },
        });
        if (otherTopTen) {
          return NextResponse.json(
            { error: 'Only one top ten playlist can be active at a time' },
            { status: 400 }
          );
        }
      }

      if (existingPlaylist.type === 'PROVINCE' && existingPlaylist.province) {
        const otherProvince = await prisma.playlist.findFirst({
          where: {
            type: 'PROVINCE',
            province: existingPlaylist.province,
            status: 'ACTIVE',
            id: { not: params.id },
          },
        });
        if (otherProvince) {
          return NextResponse.json(
            {
              error: `Only one ${existingPlaylist.province} playlist can be active at a time`,
            },
            { status: 400 }
          );
        }
      }
    }

    const playlist = await prisma.playlist.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(coverImage && { coverImage }),
        ...(maxTracks && { maxTracks }),
        ...(maxSubmissionsPerArtist && { maxSubmissionsPerArtist }),
        ...(status && { status }),
        ...(submissionStatus && { submissionStatus }),
        ...(province !== undefined && { province }),
        ...(order !== undefined && { order }),
      },
      include: {
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

// DELETE /api/admin/playlists/[id] - Delete playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if playlist exists
    const existingPlaylist = await prisma.playlist.findUnique({
      where: { id: params.id },
    });

    if (!existingPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Delete playlist (cascade will handle related records)
    await prisma.playlist.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}
