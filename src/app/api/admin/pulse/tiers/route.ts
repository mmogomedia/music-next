import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pulse/tiers
 * Get all league tiers
 * Requires ADMIN role
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tiers = await prisma.leagueTier.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        code: true,
        name: true,
      },
    });

    return NextResponse.json({ tiers });
  } catch (error: any) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch tiers',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
