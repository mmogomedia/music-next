import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/playlists/[id]/submit - Submit tracks to playlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ARTIST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trackIds, message } = body;

    if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
      return NextResponse.json(
        { error: 'trackIds is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Await params to get the id
    const { id } = await params;

    // Check if playlist exists and is open for submissions
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tracks: true,
            submissions: {
              where: {
                artistId: session.user.id,
                status: 'PENDING',
              },
            },
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

    if (playlist.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Playlist is not active' },
        { status: 400 }
      );
    }

    if (playlist.submissionStatus !== 'OPEN') {
      return NextResponse.json(
        { error: 'Playlist is not accepting submissions' },
        { status: 400 }
      );
    }

    if (playlist._count.tracks >= playlist.maxTracks) {
      return NextResponse.json({ error: 'Playlist is full' }, { status: 400 });
    }

    if (
      playlist._count.submissions + trackIds.length >
      playlist.maxSubmissionsPerArtist
    ) {
      return NextResponse.json(
        {
          error: `You can only submit ${playlist.maxSubmissionsPerArtist} tracks to this playlist. You have ${playlist._count.submissions} pending submissions.`,
        },
        { status: 400 }
      );
    }

    // Verify all tracks belong to the artist
    const artistTracks = await prisma.track.findMany({
      where: {
        id: { in: trackIds },
        userId: session.user.id,
      },
      select: { id: true, title: true },
    });

    if (artistTracks.length !== trackIds.length) {
      return NextResponse.json(
        { error: 'Some tracks do not belong to you' },
        { status: 400 }
      );
    }

    // Check if any tracks have already been submitted to this playlist (check submissions first)
    const existingSubmissions = await prisma.playlistSubmission.findMany({
      where: {
        playlistId: id,
        trackId: { in: trackIds },
      },
      include: {
        track: {
          select: { title: true },
        },
      },
    });

    if (existingSubmissions.length > 0) {
      const duplicateTracks = existingSubmissions.map(es => es.track.title);
      return NextResponse.json(
        {
          error: `The following tracks have already been submitted to this playlist: ${duplicateTracks.join(', ')}. Each track can only be submitted once per playlist.`,
        },
        { status: 400 }
      );
    }

    // Check if any tracks are already in the playlist (approved tracks)
    const existingTracks = await prisma.playlistTrack.findMany({
      where: {
        playlistId: id,
        trackId: { in: trackIds },
      },
      select: { trackId: true },
    });

    if (existingTracks.length > 0) {
      const existingTrackIds = existingTracks.map(et => et.trackId);
      const duplicateTracks = artistTracks.filter(t =>
        existingTrackIds.includes(t.id)
      );
      return NextResponse.json(
        {
          error: `The following tracks are already in this playlist: ${duplicateTracks.map(t => t.title).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create submissions
    const submissions = await prisma.playlistSubmission.createMany({
      data: trackIds.map(trackId => ({
        playlistId: id,
        trackId,
        artistId: session.user.id,
        artistComment: message,
      })),
    });

    return NextResponse.json({
      message: `Successfully submitted ${trackIds.length} track(s) for review`,
      submissions: submissions.count,
    });
  } catch (error) {
    console.error('Error submitting tracks:', error);
    return NextResponse.json(
      { error: 'Failed to submit tracks' },
      { status: 500 }
    );
  }
}
