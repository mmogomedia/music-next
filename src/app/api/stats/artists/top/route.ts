import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { artistStrengthCalculator } from '@/lib/strength-scoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/stats/artists/top
 * Get top artists by strength score
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const minScore = parseFloat(searchParams.get('minScore') || '0');

    // Validate parameters
    const validTimeRanges = ['24h', '7d', '30d', '3m', '1y', 'all'];
    if (!validTimeRanges.includes(timeRange)) {
      return NextResponse.json(
        {
          error: `Invalid time range. Must be one of: ${validTimeRanges.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    console.log(
      `Getting top artists for ${timeRange} (limit: ${limit}, minScore: ${minScore})`
    );

    // Get top artists
    const topArtists = await artistStrengthCalculator.getTopArtists(
      timeRange,
      limit
    );

    // Filter by minimum score
    const filteredArtists = topArtists.filter(
      artist => artist.overallScore >= minScore
    );

    // Add ranking
    const rankedArtists = filteredArtists.map((artist, index) => ({
      ...artist,
      rank: index + 1,
      scoreCategory: getScoreCategory(artist.overallScore),
    }));

    return NextResponse.json({
      success: true,
      data: {
        artists: rankedArtists,
        timeRange,
        total: rankedArtists.length,
        minScore,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching top artists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top artists' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to categorize scores
 */
function getScoreCategory(score: number): string {
  if (score >= 90) return 'Superstar Potential';
  if (score >= 80) return 'Strong Commercial Viability';
  if (score >= 70) return 'Solid Artist with Good Potential';
  if (score >= 60) return 'Developing Artist with Promise';
  if (score >= 50) return 'Early Stage, Needs Development';
  return 'Requires Significant Improvement';
}
