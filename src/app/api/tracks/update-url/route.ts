import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { extractFilePath } from '@/lib/url-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trackId, newFileUrl } = await request.json();

    if (!trackId || !newFileUrl) {
      return NextResponse.json(
        { error: 'Missing trackId or newFileUrl' },
        { status: 400 }
      );
    }

    // Extract file path from the URL
    const filePath = extractFilePath(newFileUrl);

    // Verify the track belongs to the user
    const track = await prisma.track.findFirst({
      where: {
        id: trackId,
        userId: session.user.id,
      },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Update the file path
    const updatedTrack = await prisma.track.update({
      where: { id: trackId },
      data: { filePath: filePath },
    });

    return NextResponse.json({
      success: true,
      track: updatedTrack,
    });
  } catch (error) {
    console.error('Error updating track URL:', error);
    return NextResponse.json(
      { error: 'Failed to update track URL' },
      { status: 500 }
    );
  }
}
