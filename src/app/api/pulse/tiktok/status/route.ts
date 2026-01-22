import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pulse/tiktok/status
 * Simple endpoint to check if TikTok is connected (without fetching user info)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if TikTok account exists in database
    const tiktokAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'tiktok',
      },
      select: {
        id: true,
        providerAccountId: true,
        access_token: true,
        scope: true,
      },
    });

    if (!tiktokAccount || !tiktokAccount.access_token) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    // Also check if it's saved in artist profile socialLinks
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { socialLinks: true },
    });

    const hasSocialLink =
      artistProfile?.socialLinks &&
      typeof artistProfile.socialLinks === 'object' &&
      artistProfile.socialLinks !== null &&
      'tiktok' in artistProfile.socialLinks &&
      artistProfile.socialLinks.tiktok !== null;

    return NextResponse.json({
      connected: true,
      openId: tiktokAccount.providerAccountId,
      scope: tiktokAccount.scope,
      hasSocialLink,
    });
  } catch (error) {
    console.error('Error checking TikTok status:', error);
    return NextResponse.json(
      { error: 'Failed to check TikTok status', connected: false },
      { status: 500 }
    );
  }
}
