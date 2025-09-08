import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PUT /api/artist-profile/social-links - Update social media links
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { socialLinks } = body;

    // Validate social links structure
    if (socialLinks && typeof socialLinks !== 'object') {
      return NextResponse.json(
        { error: 'Invalid social links format' },
        { status: 400 }
      );
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
