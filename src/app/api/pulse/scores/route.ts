import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pulse/scores
 * Get current artist's PULSE³ scores
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get artist profile
    const artistProfile = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!artistProfile) {
      return NextResponse.json({
        eligibilityScore: null,
        momentumScore: null,
        position: null,
        isActivelyMonitored: false,
        hasConnection: false,
      });
    }

    // Check for PULSE³ connections (TikTok, Spotify, YouTube)
    // Primary check: Account table (most reliable)
    const tiktokAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'tiktok',
      },
      select: { id: true, access_token: true },
    });

    // Secondary check: socialLinks (fallback)
    const profileWithLinks = await prisma.artistProfile.findUnique({
      where: { id: artistProfile.id },
      select: { socialLinks: true },
    });

    const socialLinks = profileWithLinks?.socialLinks as any;
    const hasSocialLink = !!(
      socialLinks &&
      typeof socialLinks === 'object' &&
      socialLinks.tiktok &&
      socialLinks.tiktok.connected !== false
    );

    // Connection exists if Account has token OR socialLinks has TikTok connection
    const hasConnection = !!tiktokAccount?.access_token || hasSocialLink;

    if (!hasConnection) {
      return NextResponse.json({
        eligibilityScore: null,
        momentumScore: null,
        position: null,
        isActivelyMonitored: false,
        hasConnection: false,
      });
    }

    // Get latest eligibility score with components
    const latestEligibility = await prisma.pulseEligibilityScore.findFirst({
      where: { artistProfileId: artistProfile.id },
      orderBy: { calculatedAt: 'desc' },
      select: {
        score: true,
        rank: true,
        calculatedAt: true,
        followerScore: true,
        engagementScore: true,
        consistencyScore: true,
        platformDiversityScore: true,
      },
    });

    // Get monitoring status
    const monitoringStatus = await prisma.pulseMonitoringStatus.findUnique({
      where: { artistProfileId: artistProfile.id },
      select: {
        isActivelyMonitored: true,
      },
    });

    const isActivelyMonitored = monitoringStatus?.isActivelyMonitored ?? false;

    // Note: Momentum score calculation is not yet implemented
    // Will return null until momentum calculation is added

    return NextResponse.json({
      eligibilityScore: latestEligibility?.score ?? null,
      eligibilityComponents: latestEligibility
        ? {
            followerScore: latestEligibility.followerScore ?? 0,
            engagementScore: latestEligibility.engagementScore ?? 0,
            consistencyScore: latestEligibility.consistencyScore ?? 0,
            platformDiversityScore:
              latestEligibility.platformDiversityScore ?? 0,
          }
        : null,
      momentumScore: null,
      position: null,
      isActivelyMonitored,
      hasConnection: true,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to fetch PULSE³ scores',
        details:
          process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
