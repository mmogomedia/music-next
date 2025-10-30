import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/playlists/available - Get playlists available for submission
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ARTIST') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Now expecting a slug instead of enum
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      submissionStatus: 'OPEN',
    };

    // If type is provided, find the playlist type by slug
    if (type) {
      const playlistType = await prisma.playlistTypeDefinition.findFirst({
        where: { slug: type, isActive: true },
      });

      if (playlistType) {
        where.playlistTypeId = playlistType.id;
      } else {
        // If type slug not found, return empty results
        return NextResponse.json({
          playlists: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
        });
      }
    }

    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where,
        include: {
          _count: {
            select: {
              tracks: true,
              submissions: {
                where: {
                  artistId: session.user.id,
                },
              },
            },
          },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.playlist.count({ where }),
    ]);

    // Add submission eligibility info
    const playlistsWithEligibility = playlists.map(playlist => ({
      ...playlist,
      canSubmit: playlist._count.tracks < playlist.maxTracks,
      remainingSubmissions: Math.max(
        0,
        playlist.maxSubmissionsPerArtist - playlist._count.submissions
      ),
      reason:
        playlist._count.tracks >= playlist.maxTracks
          ? 'Playlist is full'
          : playlist._count.submissions >= playlist.maxSubmissionsPerArtist
            ? 'You have reached the submission limit for this playlist'
            : null,
    }));

    return NextResponse.json({
      playlists: playlistsWithEligibility,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching available playlists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available playlists' },
      { status: 500 }
    );
  }
}
