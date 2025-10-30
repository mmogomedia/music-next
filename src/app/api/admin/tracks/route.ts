import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
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

    const tracks = await prisma.track.findMany({
      include: {
        artistProfile: {
          select: {
            artistName: true,
            profileImage: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Construct full URLs for file paths
    const tracksWithUrls = tracks.map(track => ({
      ...track,
      fileUrl: constructFileUrl(track.filePath),
      coverImageUrl: track.coverImageUrl
        ? constructFileUrl(track.coverImageUrl)
        : track.albumArtwork
          ? constructFileUrl(track.albumArtwork)
          : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        tracks: tracksWithUrls,
        total: tracksWithUrls.length,
      },
    });
  } catch (error) {
    console.error('Error fetching all tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
