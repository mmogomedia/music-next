import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/artist-profile/[slug] - Get public artist profile by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const artistProfile = await prisma.artistProfile.findFirst({
      where: {
        OR: [
          { slug: slug },
          { artistName: slug }, // Fallback to artist name if slug not found
        ],
        isPublic: true,
        isActive: true,
      },
      include: {
        tracks: {
          where: {
            // Only include tracks that are public (if we add that field later)
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: 'Artist profile not found' },
        { status: 404 }
      );
    }

    // Increment profile view count
    await prisma.artistProfile.update({
      where: {
        id: artistProfile.id,
      },
      data: {
        profileViews: {
          increment: 1,
        },
      },
    });

    // Construct full URLs from file paths for images
    const artistProfileWithUrls = {
      ...artistProfile,
      profileImage: artistProfile.profileImage
        ? constructFileUrl(artistProfile.profileImage)
        : null,
      coverImage: artistProfile.coverImage
        ? constructFileUrl(artistProfile.coverImage)
        : null,
    };

    return NextResponse.json({ artistProfile: artistProfileWithUrls });
  } catch (error) {
    console.error('Error fetching public artist profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist profile' },
      { status: 500 }
    );
  }
}
