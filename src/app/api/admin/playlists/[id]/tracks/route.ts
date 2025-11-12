import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PlaylistStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { trackIds } = await request.json();

    if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return NextResponse.json(
        { error: 'Track IDs are required' },
        { status: 400 }
      );
    }

    // Check if playlist exists and is active
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        maxTracks: true,
        currentTracks: true,
        tracks: {
          select: { trackId: true },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (playlist.status !== PlaylistStatus.ACTIVE) {
      return NextResponse.json(
        { error: 'Playlist is not active' },
        { status: 400 }
      );
    }

    // Check if adding tracks would exceed max capacity
    const existingTrackIds = playlist.tracks.map(pt => pt.trackId);
    const newTrackIds = trackIds.filter(
      trackId => !existingTrackIds.includes(trackId)
    );

    if (playlist.currentTracks + newTrackIds.length > playlist.maxTracks) {
      return NextResponse.json(
        {
          error: `Adding ${newTrackIds.length} tracks would exceed playlist capacity. Current: ${playlist.currentTracks}/${playlist.maxTracks}`,
        },
        { status: 400 }
      );
    }

    // Verify all tracks exist
    const existingTracks = await prisma.track.findMany({
      where: {
        id: { in: trackIds },
      },
      select: { id: true, title: true },
    });

    if (existingTracks.length !== trackIds.length) {
      const foundIds = existingTracks.map(t => t.id);
      const missingIds = trackIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { error: `Some tracks not found: ${missingIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Add tracks to playlist using transaction
    const result = await prisma.$transaction(async tx => {
      // Create playlist track entries
      const playlistTracks = await Promise.all(
        newTrackIds.map(async (trackId, index) => {
          return tx.playlistTrack.create({
            data: {
              playlistId: id,
              trackId,
              order: playlist.currentTracks + index + 1,
              addedBy: session.user.id,
              addedAt: new Date(),
            },
          });
        })
      );

      // Update playlist track count
      await tx.playlist.update({
        where: { id },
        data: {
          currentTracks: playlist.currentTracks + newTrackIds.length,
        },
      });

      return playlistTracks;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ${newTrackIds.length} tracks to playlist "${playlist.name}"`,
      addedTracks: result.length,
      playlistId: id,
    });
  } catch (error) {
    console.error('Error adding tracks to playlist:', error);
    return NextResponse.json(
      { error: 'Failed to add tracks to playlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { trackIds } = await request.json();

    if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return NextResponse.json(
        { error: 'Track IDs are required' },
        { status: 400 }
      );
    }

    // Check if playlist exists
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      select: { id: true, name: true, currentTracks: true },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Remove tracks from playlist using transaction
    const result = await prisma.$transaction(async tx => {
      // Delete playlist track entries
      const deletedTracks = await tx.playlistTrack.deleteMany({
        where: {
          playlistId: id,
          trackId: { in: trackIds },
        },
      });

      // Update playlist track count
      await tx.playlist.update({
        where: { id },
        data: {
          currentTracks: Math.max(
            0,
            playlist.currentTracks - deletedTracks.count
          ),
        },
      });

      return deletedTracks.count;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${result} tracks from playlist "${playlist.name}"`,
      removedTracks: result,
      playlistId: id,
    });
  } catch (error) {
    console.error('Error removing tracks from playlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove tracks from playlist' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { trackIds } = await request.json();

    if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return NextResponse.json(
        { error: 'Track IDs array is required' },
        { status: 400 }
      );
    }

    // Check if playlist exists
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        tracks: {
          select: { id: true, trackId: true },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    // Verify all track IDs exist in the playlist
    const existingTrackIds = playlist.tracks.map(pt => pt.trackId);
    const missingTracks = trackIds.filter(
      trackId => !existingTrackIds.includes(trackId)
    );

    if (missingTracks.length > 0) {
      return NextResponse.json(
        {
          error: `Some tracks not found in playlist: ${missingTracks.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Reorder tracks
    await prisma.$transaction(async tx => {
      for (let i = 0; i < trackIds.length; i++) {
        const trackId = trackIds[i];
        const playlistTrack = playlist.tracks.find(
          pt => pt.trackId === trackId
        );
        if (playlistTrack) {
          await tx.playlistTrack.update({
            where: { id: playlistTrack.id },
            data: { order: i + 1 },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reordered tracks in playlist "${playlist.name}"`,
      playlistId: id,
    });
  } catch (error) {
    console.error('Error reordering tracks:', error);
    return NextResponse.json(
      { error: 'Failed to reorder tracks' },
      { status: 500 }
    );
  }
}
