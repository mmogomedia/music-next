import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { constructFileUrl } from '@/lib/url-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const collaboratorSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  percentage: z.number(),
});

const saveSchema = z.object({
  name: z.string().default('Untitled'),
  songTitle: z.string().default(''),
  songDate: z.string().default(''),
  masterSplits: z.array(collaboratorSchema),
  publishingSplits: z.array(collaboratorSchema),
  trackId: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sheets = await prisma.splitSheet.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        songTitle: true,
        songDate: true,
        masterSplits: true,
        publishingSplits: true,
        trackId: true,
        updatedAt: true,
        track: {
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
            albumArtwork: true,
            artist: true,
          },
        },
      },
    });
    // Resolve stored paths to full public URLs (same as MusicService.searchTracks)
    const sheetsWithUrls = sheets.map(s => ({
      ...s,
      track: s.track
        ? {
            ...s.track,
            coverImageUrl: s.track.coverImageUrl
              ? constructFileUrl(s.track.coverImageUrl)
              : null,
            albumArtwork: s.track.albumArtwork
              ? constructFileUrl(s.track.albumArtwork)
              : null,
          }
        : null,
    }));

    return NextResponse.json({ sheets: sheetsWithUrls });
  } catch (error) {
    console.error('Error fetching split sheets:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const {
      name,
      songTitle,
      songDate,
      masterSplits,
      publishingSplits,
      trackId,
    } = parsed.data;

    // Upsert: one sheet per user per song title (by name key)
    const existing = await prisma.splitSheet.findFirst({
      where: { userId: session.user.id, name },
    });

    const sheet = existing
      ? await prisma.splitSheet.update({
          where: { id: existing.id },
          data: {
            songTitle,
            songDate,
            masterSplits,
            publishingSplits,
            trackId: trackId ?? null,
            updatedAt: new Date(),
          },
        })
      : await prisma.splitSheet.create({
          data: {
            userId: session.user.id,
            name,
            songTitle,
            songDate,
            masterSplits,
            publishingSplits,
            trackId: trackId ?? null,
          },
        });

    return NextResponse.json({ sheet });
  } catch (error) {
    console.error('Error saving split sheet:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
