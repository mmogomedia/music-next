/**
 * Artist Audit API Route
 *
 * GET  /api/ai/artist-audit  — returns latest audit + decision for the authenticated artist
 * POST /api/ai/artist-audit  — runs a fresh career audit (on-demand, not rate-limited in MVP)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  runCareerAudit,
  getLatestAuditResult,
} from '@/lib/ai/agents/audit-orchestrator-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── GET — latest audit ────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artistProfile = await prisma.artistProfile.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        artistType: true,
        careerStage: true,
        revenueModels: true,
        growthEngines: true,
        questionnaireResponses: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { id: true, submittedAt: true },
        },
      },
    });

    if (!artistProfile) {
      return NextResponse.json(
        { error: 'No artist profile found' },
        { status: 404 }
      );
    }

    const questionnaireCompleted =
      artistProfile.questionnaireResponses.length > 0;

    const result = await getLatestAuditResult(artistProfile.id);

    if (!result || !result.audit) {
      return NextResponse.json({
        audit: null,
        decision: null,
        profile: {
          artistType: artistProfile.artistType,
          careerStage: artistProfile.careerStage,
          questionnaireCompleted,
        },
      });
    }

    return NextResponse.json({
      audit: result.audit,
      decision: result.decision,
      profile: {
        artistType: artistProfile.artistType,
        careerStage: artistProfile.careerStage,
        questionnaireCompleted,
      },
    });
  } catch (error) {
    console.error('[GET /api/ai/artist-audit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit' },
      { status: 500 }
    );
  }
}

// ── DELETE — reset (wipe all audits for this artist) ─────────────────────────

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // deleteMany cascades to DecisionResult via the relation onDelete: Cascade
    await prisma.artistAudit.deleteMany({
      where: { artistProfileId: artistProfile.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/ai/artist-audit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reset audit' },
      { status: 500 }
    );
  }
}

// ── POST — run audit ──────────────────────────────────────────────────────────

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artistProfile = await prisma.artistProfile.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!artistProfile) {
      return NextResponse.json(
        {
          error: 'Artist profile not found. Set up your artist profile first.',
        },
        { status: 404 }
      );
    }

    const result = await runCareerAudit(artistProfile.id);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[POST /api/ai/artist-audit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to run career audit' },
      { status: 500 }
    );
  }
}
