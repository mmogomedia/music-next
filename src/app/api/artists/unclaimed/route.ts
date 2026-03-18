import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';

/**
 * GET /api/artists/unclaimed
 * Search for unclaimed artist profiles by name
 * Used in the profile claiming step of onboarding
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a profile
    const existingProfile = await prisma.artistProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        {
          error: 'You already have an artist profile',
          canClaim: false,
        },
        { status: 409 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Search for unclaimed profiles
    const unclaimedProfiles = await prisma.artistProfile
      .findMany({
        where: {
          isUnclaimed: true,
          ...(search
            ? {
                artistName: {
                  contains: search,
                  mode: 'insensitive',
                },
              }
            : {}),
        },
        select: {
          id: true,
          artistName: true,
          slug: true,
          profileImage: true,
          coverImage: true,
          totalPlays: true,
          totalLikes: true,
          totalFollowers: true,
          createdAt: true,
          _count: {
            select: {
              tracks: true,
            },
          },
          tracks: {
            take: 3,
            select: {
              id: true,
              title: true,
              coverImageUrl: true,
              playCount: true,
              likeCount: true,
            },
            orderBy: {
              playCount: 'desc',
            },
          },
        },
        orderBy: [{ totalPlays: 'desc' }, { createdAt: 'desc' }],
        take: 20, // Limit to 20 results
      })
      .catch(error => {
        console.error('Error fetching unclaimed profiles:', error);
        throw error;
      });

    return NextResponse.json({
      profiles: unclaimedProfiles.map(profile => ({
        id: profile.id,
        name: profile.artistName,
        slug: profile.slug,
        profileImage: profile.profileImage,
        coverImage: profile.coverImage,
        stats: {
          tracks: profile._count.tracks,
          plays: profile.totalPlays,
          likes: profile.totalLikes,
          followers: profile.totalFollowers,
        },
        tracks: profile.tracks.map(track => ({
          id: track.id,
          title: track.title,
          coverImage: track.coverImageUrl
            ? constructFileUrl(track.coverImageUrl)
            : null,
          playCount: track.playCount,
          likeCount: track.likeCount,
        })),
        createdAt: profile.createdAt,
      })),
      count: unclaimedProfiles.length,
    });
  } catch (error) {
    console.error('Error fetching unclaimed profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unclaimed profiles' },
      { status: 500 }
    );
  }
}
