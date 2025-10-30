import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { constructFileUrl } from '@/lib/url-utils';
import { handleAuthError } from '@/lib/api-error-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/artist-profile - Get user's artist profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return handleAuthError();
    }

    const artistProfile = await prisma.artistProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        tracks: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!artistProfile) {
      return NextResponse.json({ artistProfile: null });
    }

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
    console.error('Error fetching artist profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist profile' },
      { status: 500 }
    );
  }
}

// POST /api/artist-profile - Create artist profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return handleAuthError();
    }

    const body = await request.json();
    const {
      artistName,
      bio,
      profileImage,
      coverImage,
      location,
      website,
      genre,
      slug,
      socialLinks,
      streamingLinks,
    } = body;

    // Check if user already has an artist profile
    const existingProfile = await prisma.artistProfile.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Artist profile already exists' },
        { status: 400 }
      );
    }

    // Check if artist name is already taken
    const nameExists = await prisma.artistProfile.findUnique({
      where: {
        artistName,
      },
    });

    if (nameExists) {
      return NextResponse.json(
        { error: 'Artist name already taken' },
        { status: 400 }
      );
    }

    // Check if slug is already taken (if provided)
    if (slug) {
      const slugExists = await prisma.artistProfile.findUnique({
        where: {
          slug,
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already taken' },
          { status: 400 }
        );
      }
    }

    // Create artist profile and update user role in a transaction
    const result = await prisma.$transaction(async tx => {
      // Create the artist profile
      const artistProfile = await tx.artistProfile.create({
        data: {
          userId: session.user.id,
          artistName,
          bio,
          profileImage,
          coverImage,
          location,
          website,
          genre,
          slug,
          socialLinks,
          streamingLinks,
        },
      });

      // Update user role to ARTIST
      await tx.user.update({
        where: { id: session.user.id },
        data: { role: 'ARTIST' },
      });

      return artistProfile;
    });

    return NextResponse.json({ artistProfile: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating artist profile:', error);
    return NextResponse.json(
      { error: 'Failed to create artist profile' },
      { status: 500 }
    );
  }
}

// PUT /api/artist-profile - Update artist profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return handleAuthError();
    }

    const body = await request.json();
    const {
      artistName,
      bio,
      profileImage,
      coverImage,
      location,
      website,
      genre,
      slug,
      socialLinks,
      streamingLinks,
      isPublic,
      isActive,
    } = body;

    // Check if artist profile exists
    const existingProfile = await prisma.artistProfile.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Artist profile not found' },
        { status: 404 }
      );
    }

    // Check if new artist name is already taken (if changing)
    if (artistName && artistName !== existingProfile.artistName) {
      const nameExists = await prisma.artistProfile.findUnique({
        where: {
          artistName,
        },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'Artist name already taken' },
          { status: 400 }
        );
      }
    }

    // Check if new slug is already taken (if changing)
    if (slug && slug !== existingProfile.slug) {
      const slugExists = await prisma.artistProfile.findUnique({
        where: {
          slug,
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already taken' },
          { status: 400 }
        );
      }
    }

    const artistProfile = await prisma.artistProfile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        artistName,
        bio,
        profileImage,
        coverImage,
        location,
        website,
        genre,
        slug,
        socialLinks,
        streamingLinks,
        isPublic,
        isActive,
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
    console.error('Error updating artist profile:', error);
    return NextResponse.json(
      { error: 'Failed to update artist profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/artist-profile - Delete artist profile
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return handleAuthError();
    }

    // Check if artist profile exists
    const existingProfile = await prisma.artistProfile.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Artist profile not found' },
        { status: 404 }
      );
    }

    await prisma.artistProfile.delete({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      message: 'Artist profile deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting artist profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete artist profile' },
      { status: 500 }
    );
  }
}
