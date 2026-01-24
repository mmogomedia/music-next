import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PulseLeagueService } from '@/lib/services/pulse-league-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pulse/scores
 * Get all eligibility scores with artist names
 * Requires ADMIN role
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get latest scores using the optimized service method
    const latestScores = await PulseLeagueService.getLatestEligibilityScores();

    // Get artist names and images
    const artistProfileIds = latestScores.map(s => s.artistProfileId);
    const artistProfiles = await prisma.artistProfile.findMany({
      where: { id: { in: artistProfileIds } },
      select: { id: true, artistName: true, profileImage: true },
    });

    const artistMap = new Map(
      artistProfiles.map(p => [
        p.id,
        { name: p.artistName, image: p.profileImage },
      ])
    );

    // Sort by score descending and add rank
    const sortedScores = latestScores
      .sort((a, b) => b.score - a.score)
      .map((score, index) => {
        const artist = artistMap.get(score.artistProfileId) || {
          name: 'Unknown',
          image: null,
        };
        return {
          artistProfileId: score.artistProfileId,
          artistName: artist.name,
          profileImage: artist.image,
          score: score.score,
          rank: index + 1,
          followerScore: score.followerScore ?? 0,
          engagementScore: score.engagementScore ?? 0,
          consistencyScore: score.consistencyScore ?? 0,
          platformDiversityScore: score.platformDiversityScore ?? 0,
          calculatedAt: new Date().toISOString(), // Note: This is approximate
        };
      });

    // Get actual calculatedAt dates
    const scoreDates = await prisma.pulseEligibilityScore.findMany({
      where: { artistProfileId: { in: artistProfileIds } },
      select: {
        artistProfileId: true,
        calculatedAt: true,
      },
      orderBy: { calculatedAt: 'desc' },
      distinct: ['artistProfileId'],
    });

    const dateMap = new Map(
      scoreDates.map(s => [s.artistProfileId, s.calculatedAt.toISOString()])
    );

    const scoresWithDates = sortedScores.map(score => ({
      ...score,
      calculatedAt: dateMap.get(score.artistProfileId) || score.calculatedAt,
    }));

    return NextResponse.json({ scores: scoresWithDates });
  } catch (error: any) {
    console.error('Error fetching scores:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch scores',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
