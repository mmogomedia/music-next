import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/artist-profile/[slug]/follow - Toggle follow for an artist profile
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const followerId = session.user.id;

    const artistProfile = await prisma.artistProfile.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isPublic: true,
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        totalFollowers: true,
      },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: 'Artist profile not found' },
        { status: 404 }
      );
    }

    if (!artistProfile.userId) {
      return NextResponse.json(
        { error: 'Artist profile has no associated user' },
        { status: 400 }
      );
    }

    const followingId = artistProfile.userId;

    // Prevent artists from following themselves
    if (followingId === followerId) {
      return NextResponse.json(
        { error: 'You cannot follow your own profile' },
        { status: 400 }
      );
    }

    // Check if a follow record already exists using TimelineFollow
    // We store artist follows using the artist's userId as the followingId
    const existingFollow = await prisma.timelineFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    let following: boolean;
    let followerCount: number;

    if (existingFollow) {
      // Unfollow: remove the record and decrement
      await prisma.$transaction(async tx => {
        await tx.timelineFollow.delete({
          where: {
            followerId_followingId: {
              followerId,
              followingId,
            },
          },
        });
        await tx.artistProfile.update({
          where: { id: artistProfile.id },
          data: { totalFollowers: { decrement: 1 } },
        });
      });
      followerCount = Math.max(0, artistProfile.totalFollowers - 1);
      following = false;
    } else {
      // Follow: create the record and increment
      await prisma.$transaction(async tx => {
        await tx.timelineFollow.create({
          data: {
            followerId,
            followingId,
          },
        });
        await tx.artistProfile.update({
          where: { id: artistProfile.id },
          data: { totalFollowers: { increment: 1 } },
        });
      });
      followerCount = artistProfile.totalFollowers + 1;
      following = true;
    }

    return NextResponse.json({ following, followerCount });
  } catch (error) {
    console.error('Error toggling follow:', error);
    return NextResponse.json(
      { error: 'Failed to update follow status' },
      { status: 500 }
    );
  }
}

// GET /api/artist-profile/[slug]/follow - Check if current user follows this artist
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ following: false, followerCount: 0 });
    }

    const followerId = session.user.id;

    const artistProfile = await prisma.artistProfile.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isPublic: true,
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        totalFollowers: true,
      },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: 'Artist profile not found' },
        { status: 404 }
      );
    }

    if (!artistProfile.userId) {
      return NextResponse.json({ following: false, followerCount: 0 });
    }

    const followingId = artistProfile.userId;

    const existingFollow = await prisma.timelineFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return NextResponse.json({
      following: !!existingFollow,
      followerCount: artistProfile.totalFollowers,
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}
