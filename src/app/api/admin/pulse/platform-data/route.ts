import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pulse/platform-data
 * Get platform connection data (TikTok, etc.)
 * Requires ADMIN role
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get TikTok accounts with access tokens
    const tiktokAccounts = await prisma.account.findMany({
      where: {
        provider: 'tiktok',
        access_token: { not: null },
      },
      include: {
        user: {
          include: {
            artistProfile: {
              select: { id: true, artistName: true, profileImage: true },
            },
          },
        },
      },
    });

    // Get platform data for these artists
    const artistProfileIds = tiktokAccounts
      .map(acc => acc.user?.artistProfile?.id)
      .filter((id): id is string => !!id);

    const platformData = await prisma.pulsePlatformData.findMany({
      where: {
        artistProfileId: { in: artistProfileIds },
        platform: 'tiktok',
      },
      orderBy: { fetchedAt: 'desc' },
      distinct: ['artistProfileId'],
    });

    const dataMap = new Map(
      platformData.map(p => [
        p.artistProfileId,
        {
          followerCount: (p.data as any)?.follower_count ?? null,
          videoCount: (p.data as any)?.video_count ?? null,
          fetchedAt: p.fetchedAt.toISOString(),
        },
      ])
    );

    const connections = tiktokAccounts
      .filter(acc => acc.user?.artistProfile)
      .map(acc => {
        const profile = acc.user!.artistProfile!;
        const data = dataMap.get(profile.id);

        return {
          artistProfileId: profile.id,
          artistName: profile.artistName,
          profileImage: profile.profileImage,
          platform: 'tiktok',
          followerCount: data?.followerCount ?? null,
          videoCount: data?.videoCount ?? null,
          fetchedAt: data?.fetchedAt ?? new Date().toISOString(),
          isConnected: !!acc.access_token,
        };
      });

    return NextResponse.json({ connections });
  } catch (error: any) {
    console.error('Error fetching platform data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch platform data',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
