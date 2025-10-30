import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { artistStrengthCalculator } from '@/lib/strength-scoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/stats/batch-calculate
 * Batch calculate strength scores for all artists
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { timeRange = '7d', artistIds } = body;

    // Validate timeRange
    const validTimeRanges = ['24h', '7d', '30d', '3m', '1y', 'all'];
    if (!validTimeRanges.includes(timeRange)) {
      return NextResponse.json(
        {
          error: `Invalid time range. Must be one of: ${validTimeRanges.join(', ')}`,
        },
        { status: 400 }
      );
    }

    console.log(`Starting batch calculation for ${timeRange}`);

    // Start batch calculation (this will run in background)
    const calculationPromise =
      artistStrengthCalculator.batchCalculateScores(timeRange);

    // Don't await the calculation - return immediately
    calculationPromise.catch(error => {
      console.error('Batch calculation failed:', error);
    });

    return NextResponse.json({
      success: true,
      message: `Batch calculation started for ${timeRange}`,
      data: {
        timeRange,
        status: 'started',
        startedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error starting batch calculation:', error);
    return NextResponse.json(
      { error: 'Failed to start batch calculation' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stats/batch-calculate
 * Get status of batch calculations
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';

    // Get latest calculation status from database
    const latestScores = await prisma.artistStrengthScore.findMany({
      where: { timeRange },
      orderBy: { calculatedAt: 'desc' },
      take: 1,
      select: { calculatedAt: true, artistId: true },
    });

    const totalArtists = await prisma.artistStrengthScore.count({
      where: { timeRange },
    });

    const totalActiveArtists = await prisma.artistProfile.count({
      where: { isActive: true },
    });

    const completionPercentage =
      totalActiveArtists > 0 ? (totalArtists / totalActiveArtists) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        timeRange,
        totalArtists,
        totalActiveArtists,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        lastCalculated: latestScores[0]?.calculatedAt || null,
        status: completionPercentage === 100 ? 'completed' : 'in_progress',
      },
    });
  } catch (error) {
    console.error('Error getting batch calculation status:', error);
    return NextResponse.json(
      { error: 'Failed to get batch calculation status' },
      { status: 500 }
    );
  }
}
