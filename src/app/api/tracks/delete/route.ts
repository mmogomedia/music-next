import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trackId } = await request.json();

    if (!trackId) {
      return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });
    }

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

    // Delete the track (cascade will handle related records)
    await prisma.track.delete({
      where: { id: trackId },
    });

    return NextResponse.json({
      success: true,
      message: 'Track deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete track' },
      { status: 500 }
    );
  }
}
