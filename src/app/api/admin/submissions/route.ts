import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TrackSubmissionStatus } from '@/types/playlist';
import { constructFileUrl } from '@/lib/url-utils';

// GET /api/admin/submissions - Get all submissions with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as TrackSubmissionStatus | null;
    const playlistId = searchParams.get('playlistId');
    const artistId = searchParams.get('artistId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) where.status = status;
    if (playlistId) where.playlistId = playlistId;
    if (artistId) where.artistId = artistId;

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
              playCount: true,
              likeCount: true,
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
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.playlistSubmission.count({ where }),
    ]);

    // Construct full URLs from file paths
    const submissionsWithUrls = submissions.map(submission => ({
      ...submission,
      track: {
        ...submission.track,
        fileUrl: constructFileUrl(submission.track.filePath),
      },
    }));

    return NextResponse.json({
      submissions: submissionsWithUrls,
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
