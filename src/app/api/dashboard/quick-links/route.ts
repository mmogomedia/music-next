import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { QuickLinkType, UserRole } from '@prisma/client';
import {
  createQuickLink,
  ensureUniqueSlug,
} from '@/lib/services/quick-link-service';

const createQuickLinkSchema = z.object({
  type: z.nativeEnum(QuickLinkType),
  trackId: z.string().optional(),
  artistProfileId: z.string().optional(),
  albumArtistId: z.string().optional(),
  albumName: z.string().optional(),
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(512).optional(),
  slug: z.string().min(3).max(120).optional(),
  isPrerelease: z.boolean().optional(),
});

const listQuerySchema = z.object({
  type: z.nativeEnum(QuickLinkType).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const parseResult = listQuerySchema.safeParse(
      Object.fromEntries(searchParams)
    );

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const filters = parseResult.data;

    const baseWhere = { createdByUserId: userId };

    const quickLinks = await prisma.quickLink.findMany({
      where: {
        ...baseWhere,
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.status ? { isActive: filters.status === 'active' } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            artist: true,
            coverImageUrl: true,
            albumArtwork: true,
            album: true,
            isPublic: true,
          },
        },
        artistProfile: {
          select: {
            id: true,
            artistName: true,
            profileImage: true,
            slug: true,
          },
        },
        albumArtist: {
          select: {
            id: true,
            artistName: true,
            profileImage: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: quickLinks });
  } catch (error) {
    console.error('Error fetching quick links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quick links' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role as UserRole | undefined;

    const payload = await request.json();
    const parsed = createQuickLinkSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Ownership & eligibility checks
    if (data.type === QuickLinkType.TRACK && data.trackId) {
      const track = await prisma.track.findUnique({
        where: { id: data.trackId },
        select: {
          id: true,
          userId: true,
          isPublic: true,
          album: true,
          artistProfileId: true,
          title: true,
        },
      });

      if (!track) {
        return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      }

      if (!track.isPublic) {
        return NextResponse.json(
          { error: 'Track must be public before creating a quick link' },
          { status: 400 }
        );
      }

      if (userRole !== UserRole.ADMIN && track.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (data.type === QuickLinkType.ARTIST && data.artistProfileId) {
      const profile = await prisma.artistProfile.findUnique({
        where: { id: data.artistProfileId },
        select: { userId: true },
      });

      if (!profile) {
        return NextResponse.json(
          { error: 'Artist profile not found' },
          { status: 404 }
        );
      }

      if (userRole !== UserRole.ADMIN && profile.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (data.type === QuickLinkType.ALBUM) {
      if (!data.albumName || !data.albumArtistId) {
        return NextResponse.json(
          { error: 'Album quick links require albumName and albumArtistId' },
          { status: 400 }
        );
      }

      const profile = await prisma.artistProfile.findUnique({
        where: { id: data.albumArtistId },
        select: { userId: true, artistName: true },
      });

      if (!profile) {
        return NextResponse.json(
          { error: 'Artist profile not found' },
          { status: 404 }
        );
      }

      if (userRole !== UserRole.ADMIN && profile.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Ensure album exists via tracks
      const albumTracks = await prisma.track.count({
        where: {
          userId: profile.userId,
          artistProfileId: data.albumArtistId,
          album: { equals: data.albumName, mode: 'insensitive' },
          isPublic: true,
        },
      });

      if (albumTracks === 0) {
        return NextResponse.json(
          { error: 'No public tracks found for this album' },
          { status: 400 }
        );
      }
    }

    let desiredSlug = data.slug;
    if (desiredSlug) {
      desiredSlug = await ensureUniqueSlug(desiredSlug);
    }

    const quickLink = await createQuickLink({
      type: data.type,
      trackId: data.trackId,
      artistProfileId: data.artistProfileId,
      albumArtistId: data.albumArtistId,
      albumName: data.albumName?.trim(),
      title: data.title?.trim(),
      description: data.description?.trim(),
      slug: desiredSlug,
      createdByUserId: userId,
      isPrerelease: data.isPrerelease,
    });

    return NextResponse.json(
      { success: true, data: quickLink },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quick link:', error);
    return NextResponse.json(
      { error: 'Failed to create quick link' },
      { status: 500 }
    );
  }
}
