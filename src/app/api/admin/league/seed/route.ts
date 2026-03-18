import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/league/seed
 * Seed league tiers (TIER1 and TIER2)
 * Requires admin authentication or CRON_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    // Check for admin auth OR cron secret
    const session = await getServerSession(authOptions);
    const cronSecret = process.env.CRON_SECRET;

    // Check cron secret
    const authHeader = req.headers.get('authorization');
    const bearerSecret = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;
    const headerSecret = req.headers.get('x-cron-secret');
    const querySecret = req.nextUrl.searchParams.get('secret');
    const providedSecret = bearerSecret || headerSecret || querySecret;

    const isAuthorized =
      session?.user?.role === 'ADMIN' ||
      (cronSecret && providedSecret === cronSecret);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const defaultTiers = [
      {
        code: 'TIER1',
        name: 'Top 20',
        targetSize: 20,
        minScore: 70,
        maxScore: null,
        refreshIntervalHours: 24,
        isActive: true,
        sortOrder: 1,
      },
      {
        code: 'TIER2',
        name: 'Watchlist',
        targetSize: 100,
        minScore: 50,
        maxScore: 70,
        refreshIntervalHours: 12,
        isActive: true,
        sortOrder: 2,
      },
    ];

    const results = [];

    for (const tierData of defaultTiers) {
      const existing = await prisma.leagueTier.findUnique({
        where: { code: tierData.code },
      });

      if (existing) {
        const updated = await prisma.leagueTier.update({
          where: { code: tierData.code },
          data: tierData,
        });
        results.push({
          code: tierData.code,
          action: 'updated',
          tier: updated,
        });
      } else {
        const created = await prisma.leagueTier.create({
          data: tierData,
        });
        results.push({
          code: tierData.code,
          action: 'created',
          tier: created,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'League tiers seeded successfully',
      results,
    });
  } catch (error: any) {
    console.error('Error seeding league tiers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed league tiers',
        message: error?.message || String(error),
        stack:
          process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
