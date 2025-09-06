import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tracks = await prisma.track.findMany({
      where: {
        artistId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Construct full URLs from file paths
    const tracksWithUrls = tracks.map(track => ({
      ...track,
      fileUrl: constructFileUrl(track.filePath),
    }));

    return NextResponse.json({ tracks: tracksWithUrls });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
