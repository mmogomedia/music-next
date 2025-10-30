import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TrackSubmissionStatus } from '@/types/playlist';

// GET /api/playlists/submissions - Get artist's submissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ARTIST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TrackSubmissionStatus | null;
    const playlistId = searchParams.get('playlistId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      artistId: session.user.id,
    };

    if (status) where.status = status;
    if (playlistId) where.playlistId = playlistId;

    const [submissions, total] = await Promise.all([
      prisma.playlistSubmission.findMany({
        where,
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
              coverImage: true,
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
          reviewedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.playlistSubmission.count({ where }),
    ]);

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
