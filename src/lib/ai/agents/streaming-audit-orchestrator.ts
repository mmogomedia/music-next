/**
 * Streaming Audit Orchestrator
 *
 * A streaming variant of runCareerAudit that emits SSE events as each
 * phase completes. Sub-agents run sequentially (not parallel) so the UI
 * can show each phase's checks appearing in order.
 *
 * Key differences from runCareerAudit:
 *  - Sequential phases (emit phase_start → check_result × N → phase_complete)
 *  - LLM narrative streamed token-by-token (anthropic.messages.stream)
 *  - Same DB persistence as the non-streaming path
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import type { ArtistProfile, ArtistType } from '@prisma/client';
import type {
  AuditResult,
  DecisionEngineResult,
  PersonalisedAction,
} from '@/types/career-intelligence';
import type { AuditSSEEvent, AuditDimension } from '@/types/audit-stream';
import { runProfileAudit } from './audit/profile-audit-agent';
import { runPlatformAudit } from './audit/platform-audit-agent';
import { runReleasePlanningAudit } from './audit/release-planning-agent';
import { runBusinessReadinessAudit } from './audit/business-readiness-agent';
import { buildAuditResult } from './audit/score-aggregator';
import {
  resolveCapabilitiesFromGaps,
  resolveBlockedRevenue,
  persistArtistCapabilities,
} from '@/lib/services/capability-service';
import {
  fetchAndRankActions,
  computeRevenueUnlockPath,
} from '@/lib/services/action-service';

const anthropic = new Anthropic();
const TOP_ACTIONS_LIMIT = 5;
const COACHING_MODEL = 'claude-sonnet-4-6';
const NARRATIVE_MODEL = 'claude-opus-4-6';

export type AuditStreamEmitter = (_event: AuditSSEEvent) => void;

function ts() {
  return new Date().toISOString();
}

/** Yield to the event loop so the SSE controller flushes between events. */
async function flush() {
  await new Promise<void>(resolve => setImmediate(resolve));
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function streamCareerAudit(
  artistProfileId: string,
  emit: AuditStreamEmitter
): Promise<void> {
  // ── Batch data fetch ──────────────────────────────────────────────────────
  const profile = await prisma.artistProfile.findUniqueOrThrow({
    where: { id: artistProfileId },
    include: { user: { select: { emailVerified: true } } },
  });

  const [tracks, platformData, smartLinks, splitSheets] = await Promise.all([
    prisma.track.findMany({
      where: {
        OR: [
          { artistProfileId },
          { primaryArtistIds: { has: artistProfileId } },
        ],
      },
      select: {
        id: true,
        title: true,
        genre: true,
        genreId: true,
        coverImageUrl: true,
        albumArtwork: true,
        streamingLinks: true,
        isrc: true,
        createdAt: true,
        updatedAt: true,
        artistProfileId: true,
        primaryArtistIds: true,
        featuredArtistIds: true,
        filePath: true,
        uniqueUrl: true,
        userId: true,
      },
    }),
    prisma.pulsePlatformData.findMany({
      where: { artistProfileId },
      orderBy: { fetchedAt: 'desc' },
    }),
    prisma.smartLink.findMany({
      where: {
        track: {
          OR: [
            { artistProfileId },
            { primaryArtistIds: { has: artistProfileId } },
          ],
        },
      },
      select: {
        id: true,
        trackId: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        clickCount: true,
      },
    }),
    profile.userId
      ? prisma.splitSheet.findMany({
          where: { userId: profile.userId },
          select: {
            id: true,
            trackId: true,
            masterSplits: true,
            publishingSplits: true,
            userId: true,
            name: true,
            songTitle: true,
            songDate: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  emit({ type: 'audit_start', timestamp: ts() });
  await flush();

  // ── Phase runners — sequential so events stream in order ──────────────────

  const dimensionResults: {
    profile: ReturnType<typeof runProfileAudit>;
    platform: ReturnType<typeof runPlatformAudit>;
    release: ReturnType<typeof runReleasePlanningAudit>;
    business: ReturnType<typeof runBusinessReadinessAudit>;
  } = {} as never;

  const phases: Array<{
    id: AuditDimension;
    label: string;
    run: () => ReturnType<typeof runProfileAudit>;
  }> = [
    {
      id: 'profile',
      label: 'Profile Analysis',
      run: () => runProfileAudit({ profile, tracks: tracks as never[] }),
    },
    {
      id: 'platform',
      label: 'Platform Connections',
      run: () => runPlatformAudit({ profile, platformData }),
    },
    {
      id: 'release',
      label: 'Release Planning',
      run: () =>
        runReleasePlanningAudit({
          tracks: tracks as never[],
          smartLinks: smartLinks as never[],
        }),
    },
    {
      id: 'business',
      label: 'Business Readiness',
      run: () =>
        runBusinessReadinessAudit({
          artistType: profile.artistType as ArtistType,
          user: profile.user ?? null,
          tracks: tracks as never[],
          splitSheets: splitSheets as never[],
        }),
    },
  ];

  // Collect per-dimension coaching as phases complete
  const coachingByPhase: Record<AuditDimension, string> = {
    profile: '',
    platform: '',
    release: '',
    business: '',
  };

  for (const phase of phases) {
    emit({
      type: 'phase_start',
      phase: phase.id,
      label: phase.label,
      timestamp: ts(),
    });
    await flush();

    const result = phase.run();
    dimensionResults[phase.id] = result as never;

    for (const checkItem of result.checks) {
      emit({
        type: 'check_result',
        phase: phase.id,
        check: checkItem,
        timestamp: ts(),
      });
      await flush();
    }

    emit({
      type: 'phase_complete',
      phase: phase.id,
      score: result.score,
      timestamp: ts(),
    });
    await flush();

    // ── AI coaching for this dimension ─────────────────────────────────────
    coachingByPhase[phase.id] = await streamDimensionCoaching(
      phase.id,
      result.checks,
      result.score,
      profile as ArtistProfile,
      emit
    );
  }

  // ── Aggregate scores + persist ArtistAudit ────────────────────────────────
  const auditResult: AuditResult = buildAuditResult(
    artistProfileId,
    profile.artistType as ArtistType,
    {
      profile: dimensionResults.profile,
      platform: dimensionResults.platform,
      release: dimensionResults.release,
      business: dimensionResults.business,
    }
  );

  const savedAudit = await prisma.artistAudit.create({
    data: {
      artistProfileId,
      overallScore: auditResult.overallScore,
      tier: auditResult.tier,
      profileScore: auditResult.profileScore,
      platformScore: auditResult.platformScore,
      releaseScore: auditResult.releaseScore,
      businessScore: auditResult.businessScore,
      gaps: auditResult.gaps as unknown as import('@prisma/client').Prisma.InputJsonValue,
      checks:
        auditResult.checks as unknown as import('@prisma/client').Prisma.InputJsonValue,
    },
  });

  // ── Decision Engine — deterministic steps ─────────────────────────────────
  emit({ type: 'decision_start', timestamp: ts() });
  await flush();

  const missingCapabilities = await resolveCapabilitiesFromGaps(
    auditResult.gaps
  );
  const blockedRevenue = await resolveBlockedRevenue(
    missingCapabilities.map(c => c.id)
  );
  const rankedActions = await fetchAndRankActions(
    missingCapabilities,
    blockedRevenue,
    profile as ArtistProfile
  );
  const topActions = rankedActions.slice(0, TOP_ACTIONS_LIMIT);
  const revenueUnlockPath = computeRevenueUnlockPath(
    rankedActions,
    blockedRevenue
  );
  const estimatedScore = Math.min(
    100,
    auditResult.overallScore +
      topActions.reduce((s, a) => s + a.expectedImpact, 0)
  );

  // ── Gap story — streamed ───────────────────────────────────────────────────
  const gapStory = await streamGapStory(
    auditResult,
    profile as ArtistProfile,
    emit
  );

  // ── Action personalisation — batch JSON call ──────────────────────────────
  const personalisedActions = await personaliseActions(
    topActions,
    profile as ArtistProfile
  );
  emit({
    type: 'actions_personalised',
    actions: personalisedActions,
    timestamp: ts(),
  });
  await flush();

  // ── Overall narrative — streamed ───────────────────────────────────────────
  const reasoning = await streamReasoning(
    auditResult,
    missingCapabilities,
    blockedRevenue,
    topActions,
    estimatedScore,
    profile as ArtistProfile,
    gapStory,
    emit
  );

  // ── Persist capabilities + DecisionResult ────────────────────────────────
  const allCaps = await prisma.capability.findMany({ select: { id: true } });
  await persistArtistCapabilities(
    artistProfileId,
    missingCapabilities,
    allCaps.map(c => c.id)
  );

  const unlockPathJson =
    revenueUnlockPath as unknown as import('@prisma/client').Prisma.InputJsonValue;
  const personalisedJson =
    personalisedActions as unknown as import('@prisma/client').Prisma.InputJsonValue;

  const decisionResult = await prisma.decisionResult.upsert({
    where: { auditId: savedAudit.id },
    update: {
      missingCapabilities: missingCapabilities.map(c => c.id),
      blockedRevenue: blockedRevenue.map(b => b.revenueStreamId),
      rankedActions: topActions.map(a => a.id),
      reasoning,
      revenueUnlockPath: unlockPathJson,
      profileCoaching: coachingByPhase.profile,
      platformCoaching: coachingByPhase.platform,
      releaseCoaching: coachingByPhase.release,
      businessCoaching: coachingByPhase.business,
      gapStory,
      personalisedActions: personalisedJson,
    },
    create: {
      auditId: savedAudit.id,
      artistProfileId,
      missingCapabilities: missingCapabilities.map(c => c.id),
      blockedRevenue: blockedRevenue.map(b => b.revenueStreamId),
      rankedActions: topActions.map(a => a.id),
      reasoning,
      revenueUnlockPath: unlockPathJson,
      profileCoaching: coachingByPhase.profile,
      platformCoaching: coachingByPhase.platform,
      releaseCoaching: coachingByPhase.release,
      businessCoaching: coachingByPhase.business,
      gapStory,
      personalisedActions: personalisedJson,
    },
  });

  // ── Final result ──────────────────────────────────────────────────────────
  const finalResult: DecisionEngineResult = {
    id: decisionResult.id,
    auditId: savedAudit.id,
    overallScore: auditResult.overallScore,
    tier: auditResult.tier,
    profileScore: auditResult.profileScore,
    platformScore: auditResult.platformScore,
    releaseScore: auditResult.releaseScore,
    businessScore: auditResult.businessScore,
    prioritizedActions: topActions,
    missingCapabilities,
    blockedRevenue,
    revenueUnlockPath,
    reasoning,
    estimatedScoreIfCompleted: Math.round(estimatedScore),
    profileCoaching: coachingByPhase.profile,
    platformCoaching: coachingByPhase.platform,
    releaseCoaching: coachingByPhase.release,
    businessCoaching: coachingByPhase.business,
    gapStory,
    personalisedActions,
  };

  emit({ type: 'audit_complete', result: finalResult, timestamp: ts() });
}

// ── Helper: stream a text response token-by-token ─────────────────────────────

async function streamText(
  prompt: string,
  model: string,
  maxTokens: number,
  onToken: (_token: string) => void
): Promise<string> {
  let fullText = '';
  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      const token = event.delta.text;
      fullText += token;
      onToken(token);
    }
  }
  return fullText;
}

// ── 1. Per-dimension coaching ──────────────────────────────────────────────────

async function streamDimensionCoaching(
  phase: AuditDimension,
  checks: import('@/types/career-intelligence').AuditCheck[],
  score: number,
  profile: ArtistProfile,
  emit: AuditStreamEmitter
): Promise<string> {
  const phaseLabel = {
    profile: 'Profile',
    platform: 'Platform Presence',
    release: 'Release Planning',
    business: 'Business Readiness',
  }[phase];
  const failed =
    checks
      .filter(c => !c.passed)
      .map(c => `- ${c.label}${c.details ? `: ${c.details}` : ''}`)
      .join('\n') || 'None';
  const passed =
    checks
      .filter(c => c.passed)
      .map(c => `- ${c.label}`)
      .join('\n') || 'None';

  const prompt = `You are a senior A&R consultant and artist manager reviewing a ${phaseLabel} audit.

Artist: ${profile.artistType} | Stage: ${profile.careerStage} | Revenue: ${(profile.revenueModels as string[]).join(', ') || 'not set'}
${phaseLabel} score: ${score}/100

Checks that failed:
${failed}

Checks that passed:
${passed}

Write 2–3 sentences of direct feedback as if closing a label meeting. Reference what DSPs, curators, or bookers actually look for. Use the real check data — no generic advice. No filler phrases like "it's important to" or "you should consider".`;

  emit({ type: 'dimension_coaching_start', phase, timestamp: ts() });
  await flush();

  let coaching = '';
  try {
    coaching = await streamText(prompt, COACHING_MODEL, 200, async token => {
      emit({ type: 'dimension_coaching_token', phase, token, timestamp: ts() });
      await flush();
    });
  } catch (err) {
    console.error(`[StreamingAudit] Coaching failed for ${phase}:`, err);
    coaching = `Score: ${score}/100. ${checks.filter(c => !c.passed).length} checks need attention in this dimension.`;
    emit({
      type: 'dimension_coaching_token',
      phase,
      token: coaching,
      timestamp: ts(),
    });
    await flush();
  }

  emit({
    type: 'dimension_coaching_complete',
    phase,
    coaching,
    timestamp: ts(),
  });
  await flush();
  return coaching;
}

// ── 2. Gap story ───────────────────────────────────────────────────────────────

async function streamGapStory(
  audit: AuditResult,
  profile: ArtistProfile,
  emit: AuditStreamEmitter
): Promise<string> {
  const topGaps = audit.gaps
    .slice(0, 3)
    .map(
      g => `- ${g.label}: ${g.details ?? 'not addressed'} (−${g.impact} pts)`
    )
    .join('\n');

  const prompt = `You are an A&R consultant presenting career audit findings.

Artist: ${profile.artistType} | Stage: ${profile.careerStage}
Scores: Profile ${audit.profileScore}/100 · Platform ${audit.platformScore}/100 · Release ${audit.releaseScore}/100 · Business ${audit.businessScore}/100

Top gaps:
${topGaps}

In 2–3 sentences, describe the single biggest thing holding this artist back. Connect the dots — don't list gaps. Frame it in terms of what it's costing them: lost streams, missed bookings, blocked DSP consideration, uncollected royalties.`;

  let story = '';
  try {
    story = await streamText(prompt, COACHING_MODEL, 150, async token => {
      emit({ type: 'gap_story_token', token, timestamp: ts() });
      await flush();
    });
  } catch (err) {
    console.error('[StreamingAudit] Gap story failed:', err);
    story = `Your ${audit.gaps[0]?.label ?? 'top gap'} is the biggest barrier to your next level right now.`;
    emit({ type: 'gap_story_token', token: story, timestamp: ts() });
    await flush();
  }

  emit({ type: 'gap_story_complete', story, timestamp: ts() });
  await flush();
  return story;
}

// ── 3. Action personalisation (batch JSON) ─────────────────────────────────────

async function personaliseActions(
  topActions: Awaited<ReturnType<typeof fetchAndRankActions>>,
  profile: ArtistProfile
): Promise<PersonalisedAction[]> {
  if (topActions.length === 0) return [];

  const actionsJson = JSON.stringify(
    topActions.map(a => ({
      id: a.id,
      label: a.label,
      description: a.description,
    }))
  );

  const prompt = `You are a music industry consultant. Rewrite these action descriptions for a ${profile.artistType} artist at the ${profile.careerStage} stage.

Use direct industry language. Each description: 1–2 sentences max. Do not change the IDs.
Return ONLY a valid JSON array with the same IDs, updated label and description fields. No markdown, no explanation.

Actions:
${actionsJson}`;

  try {
    const response = await anthropic.messages.create({
      model: COACHING_MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw =
      response.content[0]?.type === 'text'
        ? response.content[0].text.trim()
        : '[]';
    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
    const parsed = JSON.parse(cleaned) as PersonalisedAction[];
    // Validate shape — fall back if not an array
    if (!Array.isArray(parsed)) throw new Error('Not an array');
    return parsed;
  } catch (err) {
    console.error('[StreamingAudit] Action personalisation failed:', err);
    // Fall back to originals
    return topActions.map(a => ({
      id: a.id,
      label: a.label,
      description: a.description,
    }));
  }
}

// ── 4. Upgraded overall narrative ────────────────────────────────────────────

async function streamReasoning(
  audit: AuditResult,
  missingCapabilities: Awaited<ReturnType<typeof resolveCapabilitiesFromGaps>>,
  blockedRevenue: Awaited<ReturnType<typeof resolveBlockedRevenue>>,
  topActions: Awaited<ReturnType<typeof fetchAndRankActions>>,
  estimatedScore: number,
  profile: ArtistProfile,
  gapStory: string,
  emit: AuditStreamEmitter
): Promise<string> {
  const topActionsText = topActions
    .map(
      (a, i) =>
        `${i + 1}. ${a.label} — ${a.description} (effort: ${a.effort}, impact: +${a.expectedImpact} pts)`
    )
    .join('\n');

  const blockedStreamsText =
    blockedRevenue.length > 0
      ? blockedRevenue
          .slice(0, 3)
          .map(b => `- ${b.label}: ${b.completionPct}% complete`)
          .join('\n')
      : 'No revenue streams fully blocked.';

  const prompt = `You are a senior A&R consultant closing a career readiness meeting.

Artist: ${profile.artistType} | Stage: ${profile.careerStage} | Overall: ${audit.overallScore}/100 (${audit.tier.replace(/_/g, ' ')})
Profile: ${audit.profileScore} · Platform: ${audit.platformScore} · Release: ${audit.releaseScore} · Business: ${audit.businessScore}
Revenue models: ${(profile.revenueModels as string[]).join(', ') || 'not set'}

Blocked revenue streams:
${blockedStreamsText}

Top recommended actions:
${topActionsText}

Score if top actions completed: ${estimatedScore}/100

Gap story already shared with artist (do NOT repeat this):
"${gapStory}"

Write 5–7 sentences. Sound like you are wrapping up a real meeting — honest, direct, specific. Reference their career stage and what artists at their level typically focus on. No filler phrases. End with one clear statement about the single biggest opportunity in front of them right now.`;

  let fullText = '';

  try {
    fullText = await streamText(prompt, NARRATIVE_MODEL, 400, async token => {
      emit({ type: 'thinking_token', token, timestamp: ts() });
      await flush();
    });
  } catch (error) {
    console.error('[StreamingAudit] Narrative streaming failed:', error);
    const tierLabel = audit.tier.replace(/_/g, ' ');
    const firstAction = topActions[0]?.label ?? 'address your top gaps';
    fullText =
      `Your career readiness score is ${audit.overallScore}/100 — ${tierLabel}. ` +
      `Start by focusing on "${firstAction}" to make the biggest immediate impact. ` +
      `Completing your top ${topActions.length} recommended actions could push your score to ${estimatedScore}/100.`;
    emit({ type: 'thinking_token', token: fullText, timestamp: ts() });
    await flush();
  }

  return fullText;
}
