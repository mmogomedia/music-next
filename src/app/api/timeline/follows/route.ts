import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const followSchema = z.object({
  followingId: z.string().min(1),
});

/**
 * POST /api/timeline/follows
 * Follow a user/artist
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = followSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { followingId } = validationResult.data;

    // Can't follow yourself
    if (followingId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if already following
    const existing = await prisma.timelineFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, alreadyFollowing: true });
    }

    // Create follow relationship
    await prisma.timelineFollow.create({
      data: {
        followerId: session.user.id,
        followingId,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error('Error following user:', error);
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/timeline/follows
 * Get following and followers list
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'following' | 'followers' | null (both)

    if (type === 'following') {
      const following = await prisma.timelineFollow.findMany({
        where: { followerId: session.user.id },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json({
        following: following.map(f => f.following),
      });
    } else if (type === 'followers') {
      const followers = await prisma.timelineFollow.findMany({
        where: { followingId: session.user.id },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json({
        followers: followers.map(f => f.follower),
      });
    } else {
      // Return both
      const [following, followers] = await Promise.all([
        prisma.timelineFollow.findMany({
          where: { followerId: session.user.id },
          include: {
            following: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        }),
        prisma.timelineFollow.findMany({
          where: { followingId: session.user.id },
          include: {
            follower: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        }),
      ]);

      return NextResponse.json({
        following: following.map(f => f.following),
        followers: followers.map(f => f.follower),
      });
    }
  } catch (error) {
    logger.error('Error fetching follows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follows' },
      { status: 500 }
    );
  }
}
