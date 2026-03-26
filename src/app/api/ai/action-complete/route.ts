/**
 * Action Complete API Route
 *
 * POST /api/ai/action-complete
 * Called when an artist marks an action as completed.
 * Records the outcome and triggers a partial re-audit of the affected dimension.
 *
 * Body: { actionId: string; outcome: 'completed' | 'skipped' | 'in_progress'; notes?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  actionId: z.string().min(1, 'actionId is required'),
  selfReported: z.boolean().default(true),
  impactDelta: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { actionId, selfReported, impactDelta } = parsed.data;

    // Resolve artistProfileId
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

    // Verify action exists
    const action = await prisma.action.findUnique({
      where: { id: actionId },
      select: { id: true, capabilityId: true, dimension: true },
    });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Persist action outcome
    const actionOutcome = await prisma.actionOutcome.create({
      data: {
        artistProfileId: artistProfile.id,
        actionId,
        selfReported,
        impactDelta: impactDelta ?? null,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      outcomeId: actionOutcome.id,
      message:
        'Action marked as complete. Run your audit again to see your updated score.',
    });
  } catch (error) {
    console.error('[POST /api/ai/action-complete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to record action outcome' },
      { status: 500 }
    );
  }
}
