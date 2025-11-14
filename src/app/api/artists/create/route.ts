import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/artists/create
 * Create a new unclaimed artist profile
 * Generates UUID, creates unique slug from name
 *
 * Use case: When an artist uploads a track with collaborators who don't have profiles yet,
 * they can create unclaimed profiles for those collaborators. The collaborators can later
 * claim these profiles when they sign up. The creator cannot claim profiles they create
 * for others (they can only claim if they don't already have a profile).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Artist name is required' },
        { status: 400 }
      );
    }

    const artistName = name.trim();

    // Check if artist already exists (by name or slug)
    const existing = await prisma.artistProfile.findFirst({
      where: {
        OR: [
          { artistName: { equals: artistName, mode: 'insensitive' } },
          { slug: { equals: artistName.toLowerCase().replace(/\s+/g, '-') } },
        ],
      },
    });

    if (existing) {
      // If it's unclaimed, suggest claiming it
      if (existing.isUnclaimed) {
        return NextResponse.json(
          {
            error: 'An unclaimed artist profile with this name already exists',
            canClaim: true,
            artist: {
              id: existing.id,
              name: existing.artistName,
              slug: existing.slug,
              isUnclaimed: existing.isUnclaimed,
            },
          },
          { status: 409 }
        );
      }

      // If it's claimed, return error
      return NextResponse.json(
        {
          error: 'Artist profile already exists',
          canClaim: false,
          artist: {
            id: existing.id,
            name: existing.artistName,
            slug: existing.slug,
            isUnclaimed: existing.isUnclaimed,
          },
        },
        { status: 409 }
      );
    }

    // Generate unique slug
    const baseSlug = artistName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const slugExists = await prisma.artistProfile.findUnique({
        where: { slug },
      });
      if (!slugExists) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create unclaimed artist profile
    const artist = await prisma.artistProfile.create({
      data: {
        artistName,
        slug,
        isUnclaimed: true,
        isActive: true,
        isPublic: true,
        // userId is null for unclaimed profiles
      },
      select: {
        id: true,
        artistName: true,
        slug: true,
        profileImage: true,
        coverImage: true,
        isUnclaimed: true,
        createdAt: true,
      },
    });

    logger.info('Created unclaimed artist profile', {
      artistId: artist.id,
      artistName: artist.artistName,
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        success: true,
        artist: {
          id: artist.id,
          name: artist.artistName,
          slug: artist.slug,
          profileImage: artist.profileImage,
          coverImage: artist.coverImage,
          isUnclaimed: artist.isUnclaimed,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating artist profile:', error);
    return NextResponse.json(
      { error: 'Failed to create artist profile' },
      { status: 500 }
    );
  }
}
