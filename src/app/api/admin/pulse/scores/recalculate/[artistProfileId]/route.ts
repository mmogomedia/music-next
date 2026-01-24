import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PulseScoringService } from '@/lib/services/pulse-scoring-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/pulse/scores/recalculate/[artistProfileId]
 * Manually recalculate eligibility score for a specific artist
 * Requires ADMIN role
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ artistProfileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { artistProfileId } = await params;

    // Calculate eligibility score
    const eligibilityResult =
      await PulseScoringService.calculateEligibilityScore(artistProfileId);

    // Save eligibility score
    await PulseScoringService.saveEligibilityScore(
      artistProfileId,
      eligibilityResult.score,
      eligibilityResult.components
    );

    return NextResponse.json({
      success: true,
      score: eligibilityResult.score,
      rank: eligibilityResult.rank,
      components: eligibilityResult.components,
    });
  } catch (error: any) {
    console.error('Error recalculating score:', error);
    return NextResponse.json(
      {
        error: 'Failed to recalculate score',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
