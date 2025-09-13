import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TrackSubmissionStatus } from '@/types/playlist';

// PUT /api/admin/submissions/[id]/review - Review a submission
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
    const { status, comment } = body;

    if (!status || !['APPROVED', 'REJECTED', 'SHORTLISTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED, REJECTED, or SHORTLISTED' },
        { status: 400 }
      );
    }

    // Check if submission exists
    const existingSubmission = await prisma.playlistSubmission.findUnique({
      where: { id: params.id },
      include: {
        playlist: true,
        track: true,
      },
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // If approving, check if playlist has space
    if (status === 'APPROVED') {
      const playlist = await prisma.playlist.findUnique({
        where: { id: existingSubmission.playlistId },
        include: { _count: { select: { tracks: true } } },
      });

      if (!playlist) {
        return NextResponse.json(
          { error: 'Playlist not found' },
          { status: 404 }
        );
      }

      if (playlist._count.tracks >= playlist.maxTracks) {
        return NextResponse.json(
          { error: 'Playlist is full. Cannot add more tracks.' },
          { status: 400 }
        );
      }

      // Check if track is already in playlist
      const existingTrack = await prisma.playlistTrack.findUnique({
        where: {
          playlistId_trackId: {
            playlistId: existingSubmission.playlistId,
            trackId: existingSubmission.trackId,
          },
        },
      });

      if (existingTrack) {
        return NextResponse.json(
          { error: 'Track is already in this playlist' },
          { status: 400 }
        );
      }
    }

    // Update submission
    const submission = await prisma.playlistSubmission.update({
      where: { id: params.id },
      data: {
        status: status as TrackSubmissionStatus,
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        adminComment: comment,
      },
      include: {
        playlist: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
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
    });

    // If approved, add track to playlist
    if (status === 'APPROVED') {
      // Get next order number
      const lastTrack = await prisma.playlistTrack.findFirst({
        where: { playlistId: existingSubmission.playlistId },
        orderBy: { order: 'desc' },
      });
      const order = (lastTrack?.order || 0) + 1;

      // Add track to playlist
      await prisma.playlistTrack.create({
        data: {
          playlistId: existingSubmission.playlistId,
          trackId: existingSubmission.trackId,
          order,
          addedBy: session.user.id,
          submissionId: params.id,
        },
      });

      // Update playlist track count
      await prisma.playlist.update({
        where: { id: existingSubmission.playlistId },
        data: {
          currentTracks: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    return NextResponse.json(
      { error: 'Failed to review submission' },
      { status: 500 }
    );
  }
}
