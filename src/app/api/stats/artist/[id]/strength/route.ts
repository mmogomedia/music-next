import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { artistStrengthCalculator } from '@/lib/strength-scoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/stats/artist/[id]/strength
 * Get strength score for a specific artist
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: artistId } = await params;
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const forceRecalculate = searchParams.get('forceRecalculate') === 'true';

    // Validate timeRange
    const validTimeRanges = ['24h', '7d', '30d', '3m', '1y', 'all'];
    if (!validTimeRanges.includes(timeRange)) {
      return NextResponse.json(
        {
          error:
            'Invalid time range. Must be one of: ' + validTimeRanges.join(', '),
        },
        { status: 400 }
      );
    }

    console.log(`Getting strength score for artist ${artistId} (${timeRange})`);

    // Calculate or get cached strength score
    const strengthScore =
      await artistStrengthCalculator.calculateArtistStrengthScore(
        artistId,
        timeRange
      );

    return NextResponse.json({
      success: true,
      data: {
        artistId,
        timeRange,
        scores: strengthScore,
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching artist strength score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strength score' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stats/artist/[id]/strength
 * Force recalculation of strength score
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: artistId } = await params;
    const body = await request.json();
    const { timeRange = '7d' } = body;

    // Validate timeRange
    const validTimeRanges = ['24h', '7d', '30d', '3m', '1y', 'all'];
    if (!validTimeRanges.includes(timeRange)) {
      return NextResponse.json(
        {
          error:
            'Invalid time range. Must be one of: ' + validTimeRanges.join(', '),
        },
        { status: 400 }
      );
    }

    console.log(
      `Force recalculating strength score for artist ${artistId} (${timeRange})`
    );

    // Force recalculation
    const strengthScore =
      await artistStrengthCalculator.calculateArtistStrengthScore(
        artistId,
        timeRange
      );

    return NextResponse.json({
      success: true,
      data: {
        artistId,
        timeRange,
        scores: strengthScore,
        recalculatedAt: new Date().toISOString(),
      },
      message: 'Strength score recalculated successfully',
    });
  } catch (error) {
    console.error('Error recalculating artist strength score:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate strength score' },
      { status: 500 }
    );
  }
}
