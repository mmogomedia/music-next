import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pulse/logs/eligibility
 * Get eligibility recalculation logs
 * Requires ADMIN role
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    const logs = await prisma.pulseEligibilityRecalcLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        status: true,
        artistsProcessed: true,
        successCount: true,
        errorCount: true,
        totalDurationMs: true,
        errorMessage: true,
      },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Error fetching eligibility logs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch eligibility logs',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
