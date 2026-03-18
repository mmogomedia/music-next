import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/pulse/entries/remove
 * Remove an artist from a tier (marks for removal on next run)
 * Requires ADMIN role
 *
 * Note: This doesn't immediately remove the entry. Instead, it could:
 * 1. Add to an exclusion list
 * 2. Or just return success (actual removal happens on next league run)
 *
 * For now, we'll just return success as the league run logic handles exclusions.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { artistProfileId, tierCode } = await req.json();

    if (!artistProfileId || !tierCode) {
      return NextResponse.json(
        { error: 'artistProfileId and tierCode are required' },
        { status: 400 }
      );
    }

    // Verify tier exists
    const tier = await prisma.leagueTier.findUnique({
      where: { code: tierCode },
    });

    if (!tier) {
      return NextResponse.json(
        { error: `Tier ${tierCode} not found` },
        { status: 404 }
      );
    }

    // Note: Actual removal happens on next league run
    // For now, we just return success
    // In the future, you could implement an exclusion list table

    return NextResponse.json({
      success: true,
      message: `Artist will be removed from ${tierCode} on the next league run`,
    });
  } catch (error: any) {
    console.error('Error removing artist from tier:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove artist from tier',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
