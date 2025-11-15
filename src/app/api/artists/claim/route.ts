import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/artists/claim
 * Claim an unclaimed artist profile
 * User must not already have an artist profile
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { artistId } = body;

    if (!artistId) {
      return NextResponse.json(
        { error: 'Artist ID is required' },
        { status: 400 }
      );
    }

    // Check if user already has an artist profile
    const existingProfile = await prisma.artistProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        {
          error: 'You already have an artist profile',
          artistProfile: {
            id: existingProfile.id,
            name: existingProfile.artistName,
          },
        },
        { status: 409 }
      );
    }

    // Check if artist profile exists and is unclaimed
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { id: artistId },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: 'Artist profile not found' },
        { status: 404 }
      );
    }

    if (!artistProfile.isUnclaimed) {
      return NextResponse.json(
        { error: 'This artist profile is already claimed' },
        { status: 409 }
      );
    }

    // Claim the profile
    const claimedProfile = await prisma.artistProfile.update({
      where: { id: artistId },
      data: {
        userId: session.user.id,
        isUnclaimed: false,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        artistName: true,
        slug: true,
        profileImage: true,
        coverImage: true,
        isUnclaimed: true,
        userId: true,
      },
    });

    logger.info('Artist profile claimed', {
      artistId: claimedProfile.id,
      artistName: claimedProfile.artistName,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      artistProfile: claimedProfile,
    });
  } catch (error) {
    logger.error('Error claiming artist profile:', error);
    return NextResponse.json(
      { error: 'Failed to claim artist profile' },
      { status: 500 }
    );
  }
}
