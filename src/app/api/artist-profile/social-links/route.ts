import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Zod schema for individual social platform entries (all optional fields)
const BaseSocialLinkSchema = z.object({
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  verified: z.boolean().optional(),
});

const UsernameSocialLinkSchema = BaseSocialLinkSchema.extend({
  username: z.string().optional(),
  followers: z.number().int().nonnegative().optional(),
});

const ChannelSocialLinkSchema = BaseSocialLinkSchema.extend({
  channelName: z.string().optional(),
  subscribers: z.number().int().nonnegative().optional(),
});

const PageSocialLinkSchema = BaseSocialLinkSchema.extend({
  pageName: z.string().optional(),
  followers: z.number().int().nonnegative().optional(),
});

const ArtistSocialLinkSchema = BaseSocialLinkSchema.extend({
  artistName: z.string().optional(),
  followers: z.number().int().nonnegative().optional(),
});

const SocialLinksSchema = z
  .object({
    instagram: UsernameSocialLinkSchema.optional(),
    twitter: UsernameSocialLinkSchema.optional(),
    tiktok: UsernameSocialLinkSchema.optional(),
    youtube: ChannelSocialLinkSchema.optional(),
    facebook: PageSocialLinkSchema.optional(),
    soundcloud: UsernameSocialLinkSchema.optional(),
    bandcamp: ArtistSocialLinkSchema.optional(),
  })
  .optional();

const SocialLinksRequestSchema = z.object({
  socialLinks: SocialLinksSchema,
});

// PUT /api/artist-profile/social-links - Update social media links
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const parseResult = SocialLinksRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid social links format',
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { socialLinks } = parseResult.data;

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
        socialLinks,
      },
    });

    return NextResponse.json({ artistProfile });
  } catch (error) {
    console.error('Error updating social links:', error);
    return NextResponse.json(
      { error: 'Failed to update social links' },
      { status: 500 }
    );
  }
}

// GET /api/artist-profile/social-links - Get social links
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
        socialLinks: true,
      },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: 'Artist profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ socialLinks: artistProfile.socialLinks });
  } catch (error) {
    console.error('Error fetching social links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social links' },
      { status: 500 }
    );
  }
}
