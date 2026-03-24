import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Zod schemas for streaming platform link entries
const BaseStreamingLinkSchema = z.object({
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  verified: z.boolean().optional(),
});

const ArtistStreamingLinkSchema = BaseStreamingLinkSchema.extend({
  artistId: z.string().optional(),
  monthlyListeners: z.number().int().nonnegative().optional(),
});

const ChannelStreamingLinkSchema = BaseStreamingLinkSchema.extend({
  channelId: z.string().optional(),
  subscribers: z.number().int().nonnegative().optional(),
});

const StreamingLinksSchema = z
  .object({
    spotify: ArtistStreamingLinkSchema.optional(),
    appleMusic: ArtistStreamingLinkSchema.optional(),
    youtubeMusic: ChannelStreamingLinkSchema.optional(),
    amazonMusic: ArtistStreamingLinkSchema.optional(),
    deezer: ArtistStreamingLinkSchema.optional(),
    tidal: ArtistStreamingLinkSchema.optional(),
  })
  .optional();

const StreamingLinksRequestSchema = z.object({
  streamingLinks: StreamingLinksSchema,
});

// PUT /api/artist-profile/streaming-links - Update streaming platform links
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const parseResult = StreamingLinksRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid streaming links format',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { streamingLinks } = parseResult.data;

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

    const artistProfile = await prisma.artistProfile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        streamingLinks,
      },
    });

    return NextResponse.json({ artistProfile });
  } catch (error) {
    console.error('Error updating streaming links:', error);
    return NextResponse.json(
      { error: 'Failed to update streaming links' },
      { status: 500 }
    );
  }
}

// GET /api/artist-profile/streaming-links - Get streaming links
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artistProfile = await prisma.artistProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        streamingLinks: true,
      },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: 'Artist profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ streamingLinks: artistProfile.streamingLinks });
  } catch (error) {
    console.error('Error fetching streaming links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streaming links' },
      { status: 500 }
    );
  }
}
