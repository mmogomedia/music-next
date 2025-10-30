import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TrackSubmissionStatus } from '@/types/playlist';
import { constructFileUrl } from '@/lib/url-utils';

// PATCH /api/admin/submissions/[id]/review - Review a submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Await params to get the id
    const { id } = await params;

    // Check if submission exists
    const existingSubmission = await prisma.playlistSubmission.findUnique({
      where: { id },
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
      where: { id },
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
            playlistType: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
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
            filePath: true,
            artistProfileId: true,
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

    // Handle playlist track management based on status change
    if (status === 'APPROVED' && existingSubmission.status !== 'APPROVED') {
      // Adding track to playlist (status changed to APPROVED)

      // Check if track is already in playlist
      const existingPlaylistTrack = await prisma.playlistTrack.findFirst({
        where: {
          playlistId: existingSubmission.playlistId,
          trackId: existingSubmission.trackId,
        },
      });

      if (!existingPlaylistTrack) {
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
            submissionId: id,
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
      } else {
        // Track already exists in playlist, just update the submission reference
        await prisma.playlistTrack.update({
          where: { id: existingPlaylistTrack.id },
          data: {
            submissionId: id,
            addedBy: session.user.id,
            addedAt: new Date(),
          },
        });
      }
    } else if (
      existingSubmission.status === 'APPROVED' &&
      status === 'APPROVED'
    ) {
      // Status unchanged but submission updated - just update the playlist track reference
      const existingPlaylistTrack = await prisma.playlistTrack.findFirst({
        where: {
          playlistId: existingSubmission.playlistId,
          trackId: existingSubmission.trackId,
        },
      });

      if (existingPlaylistTrack) {
        // Update the submission reference
        await prisma.playlistTrack.update({
          where: { id: existingPlaylistTrack.id },
          data: {
            submissionId: id,
            addedBy: session.user.id,
            addedAt: new Date(),
          },
        });
      }
    } else if (
      existingSubmission.status === 'APPROVED' &&
      status !== 'APPROVED'
    ) {
      // Removing track from playlist (status changed from APPROVED to something else)

      // Check if there are other approved submissions for the same track in the same playlist
      const otherApprovedSubmissions = await prisma.playlistSubmission.findMany(
        {
          where: {
            playlistId: existingSubmission.playlistId,
            trackId: existingSubmission.trackId,
            status: 'APPROVED',
            id: { not: id }, // Exclude current submission
          },
        }
      );

      // Only remove track if no other approved submissions exist
      if (otherApprovedSubmissions.length === 0) {
        const playlistTrack = await prisma.playlistTrack.findFirst({
          where: {
            playlistId: existingSubmission.playlistId,
            trackId: existingSubmission.trackId,
          },
        });

        if (playlistTrack) {
          // Remove track from playlist
          await prisma.playlistTrack.delete({
            where: { id: playlistTrack.id },
          });

          // Update playlist track count
          await prisma.playlist.update({
            where: { id: existingSubmission.playlistId },
            data: {
              currentTracks: {
                decrement: 1,
              },
            },
          });
        }
      } else {
        // Just update the submission reference for the existing playlist track
        const playlistTrack = await prisma.playlistTrack.findFirst({
          where: {
            playlistId: existingSubmission.playlistId,
            trackId: existingSubmission.trackId,
          },
        });

        if (playlistTrack) {
          // Update to reference one of the other approved submissions
          const otherSubmission = otherApprovedSubmissions[0];
          await prisma.playlistTrack.update({
            where: { id: playlistTrack.id },
            data: {
              submissionId: otherSubmission.id,
              addedBy: session.user.id,
              addedAt: new Date(),
            },
          });
        }
      }
    }

    // Construct full URL from file path
    const submissionWithUrl = {
      ...submission,
      track: {
        ...submission.track,
        fileUrl: constructFileUrl(submission.track.filePath),
      },
    };

    return NextResponse.json({ submission: submissionWithUrl });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    return NextResponse.json(
      { error: 'Failed to review submission' },
      { status: 500 }
    );
  }
}
