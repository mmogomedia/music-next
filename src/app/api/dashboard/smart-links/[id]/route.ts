import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import {
  deleteQuickLink,
  ensureUniqueSlug,
  updateQuickLink,
} from '@/lib/services/quick-link-service';

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(512).optional(),
  slug: z.string().min(3).max(120).optional(),
  isActive: z.boolean().optional(),
  isPrerelease: z.boolean().optional(),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const quickLink = await prisma.quickLink.findUnique({
      where: { id },
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

    if (!quickLink) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (
      session.user.role !== UserRole.ADMIN &&
      quickLink.createdByUserId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: quickLink });
  } catch (error) {
    console.error('Error fetching quick link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quick link' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const quickLink = await prisma.quickLink.findUnique({
      where: { id },
      select: { createdByUserId: true },
    });

    if (!quickLink) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (
      session.user.role !== UserRole.ADMIN &&
      quickLink.createdByUserId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates = { ...parsed.data };

    if (updates.slug) {
      updates.slug = await ensureUniqueSlug(updates.slug, id);
    }

    const updated = await updateQuickLink({ id, ...updates });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating quick link:', error);
    return NextResponse.json(
      { error: 'Failed to update quick link' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await deleteQuickLink(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quick link:', error);

    if (error instanceof Error && error.message === 'Quick link not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete quick link' },
      { status: 500 }
    );
  }
}
