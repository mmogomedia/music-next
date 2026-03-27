/**
 * POST /api/ai/artist-audit/questionnaire
 *
 * Saves questionnaire answers, derives ArtistType / RevenueModels /
 * GrowthEngines / CareerStage, and updates ArtistProfile in one
 * transaction. Returns the derived values so the client can immediately
 * start the audit stream without a round-trip.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { mapAnswersToDerivedValues } from '@/lib/ai/agents/audit/questionnaire-mapper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Validation schema ─────────────────────────────────────────────────────────

const AnswersSchema = z.object({
  journeyType: z.enum([
    'independent',
    'session_producer',
    'signed_artist',
    'performer',
    'songwriter',
    'hybrid',
  ]),
  discoveryRanked: z
    .array(
      z.enum([
        'social_media',
        'playlists',
        'live_shows',
        'word_of_mouth',
        'collaborations',
        'press_media',
      ])
    )
    .min(1)
    .max(3),
  socialManaged: z.enum(['myself', 'team_helps', 'not_active']),
  incomeRanked: z
    .array(
      z.enum([
        'live_shows',
        'streaming',
        'production',
        'sync',
        'merch',
        'mixed',
      ])
    )
    .min(1)
    .max(3),
  primaryGoal: z.enum([
    'more_streams',
    'more_gigs',
    'get_signed',
    'production_career',
    'more_revenue',
  ]),
  trackCount: z.enum(['0_5', '6_20', '21_50', '50_plus']),
  collaborations: z.enum(['never', 'occasionally', 'regularly', 'central']),
});

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AnswersSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid answers', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const answers = parsed.data;

    // Resolve artist profile
    const artistProfile = await prisma.artistProfile.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: 'Artist profile not found' },
        { status: 404 }
      );
    }

    // Derive all values from raw answers
    const derived = mapAnswersToDerivedValues(answers);

    // Persist in a transaction: update profile + save raw answers
    await prisma.$transaction([
      // Update the profile with derived values
      prisma.artistProfile.update({
        where: { id: artistProfile.id },
        data: {
          artistType: derived.artistType,
          careerStage: derived.careerStage,
          revenueModels: derived.revenueModels,
          growthEngines: derived.growthEngines,
        },
      }),

      // Save the raw questionnaire answers for future reference
      prisma.artistQuestionnaireResponse.create({
        data: {
          artistProfileId: artistProfile.id,
          journeyType: answers.journeyType,
          discoveryRanked: answers.discoveryRanked,
          socialManaged: answers.socialManaged,
          incomeRanked: answers.incomeRanked,
          primaryGoal: answers.primaryGoal,
          trackCount: answers.trackCount,
          collaborations: answers.collaborations,
          derivedRevenueModels: derived.revenueModels,
          derivedGrowthEngines: derived.growthEngines,
          derivedCareerStage: derived.careerStage,
          derivedCollabBand: derived.collabBand,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      derived: {
        artistType: derived.artistType,
        careerStage: derived.careerStage,
        revenueModels: derived.revenueModels,
        growthEngines: derived.growthEngines,
      },
    });
  } catch (error) {
    console.error('[POST /api/ai/artist-audit/questionnaire] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save questionnaire' },
      { status: 500 }
    );
  }
}
