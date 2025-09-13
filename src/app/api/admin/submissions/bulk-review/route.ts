import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TrackSubmissionStatus } from '@/types/playlist';

// POST /api/admin/submissions/bulk-review - Bulk review submissions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submissionIds, action, comment } = body;

    if (
      !submissionIds ||
      !Array.isArray(submissionIds) ||
      submissionIds.length === 0
    ) {
      return NextResponse.json(
        { error: 'submissionIds is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!action || !['APPROVED', 'REJECTED', 'SHORTLISTED'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be APPROVED, REJECTED, or SHORTLISTED' },
        { status: 400 }
      );
    }

    // Get all submissions to review
    const submissions = await prisma.playlistSubmission.findMany({
      where: {
        id: { in: submissionIds },
        status: 'PENDING', // Only process pending submissions
      },
      include: {
        playlist: {
          include: {
            _count: { select: { tracks: true } },
          },
        },
        track: true,
      },
    });

    if (submissions.length === 0) {
      return NextResponse.json(
        { error: 'No pending submissions found' },
        { status: 400 }
      );
    }

    const results = {
      processed: 0,
      approved: 0,
      rejected: 0,
      shortlisted: 0,
      errors: [] as string[],
    };

    // Process each submission
    for (const submission of submissions) {
      try {
        // If approving, check if playlist has space
        if (action === 'APPROVED') {
          if (
            submission.playlist._count.tracks >= submission.playlist.maxTracks
          ) {
            results.errors.push(
              `Playlist "${submission.playlist.name}" is full. Cannot add track "${submission.track.title}".`
            );
            continue;
          }

          // Check if track is already in playlist
          const existingTrack = await prisma.playlistTrack.findUnique({
            where: {
              playlistId_trackId: {
                playlistId: submission.playlistId,
                trackId: submission.trackId,
              },
            },
          });

          if (existingTrack) {
            results.errors.push(
              `Track "${submission.track.title}" is already in playlist "${submission.playlist.name}".`
            );
            continue;
          }
        }

        // Update submission
        await prisma.playlistSubmission.update({
          where: { id: submission.id },
          data: {
            status: action as TrackSubmissionStatus,
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
            adminComment: comment,
          },
        });

        results.processed++;

        // If approved, add track to playlist
        if (action === 'APPROVED') {
          // Get next order number
          const lastTrack = await prisma.playlistTrack.findFirst({
            where: { playlistId: submission.playlistId },
            orderBy: { order: 'desc' },
          });
          const order = (lastTrack?.order || 0) + 1;

          // Add track to playlist
          await prisma.playlistTrack.create({
            data: {
              playlistId: submission.playlistId,
              trackId: submission.trackId,
              order,
              addedBy: session.user.id,
              submissionId: submission.id,
            },
          });

          // Update playlist track count
          await prisma.playlist.update({
            where: { id: submission.playlistId },
            data: {
              currentTracks: {
                increment: 1,
              },
            },
          });

          results.approved++;
        } else if (action === 'REJECTED') {
          results.rejected++;
        } else if (action === 'SHORTLISTED') {
          results.shortlisted++;
        }
      } catch (error) {
        console.error(`Error processing submission ${submission.id}:`, error);
        results.errors.push(
          `Failed to process submission for track "${submission.track.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      message: `Bulk review completed. Processed ${results.processed} submissions.`,
      results,
    });
  } catch (error) {
    console.error('Error in bulk review:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk review' },
      { status: 500 }
    );
  }
}
