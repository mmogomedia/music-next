/**
 * Decision Engine
 *
 * Orchestrates the full career intelligence pipeline for a given audit result:
 *   1. Resolves gaps → missing capabilities (capability-service)
 *   2. Resolves capabilities → blocked revenue streams (capability-service)
 *   3. Ranks actions (action-service)
 *   4. Builds revenue unlock path (action-service)
 *   5. Makes ONE LLM call to generate a plain-language reasoning narrative
 *   6. Persists the DecisionResult to the DB
 *   7. Returns DecisionEngineResult
 *
 * All ranking and scoring logic is deterministic.
 * The LLM is used only to write the narrative — it never influences scores.
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import type { ArtistProfile } from '@prisma/client';
import type {
  AuditResult,
  DecisionEngineResult,
  BlockedRevenueStream,
  RankedAction,
  PersonalisedAction,
} from '@/types/career-intelligence';
import {
  resolveCapabilitiesFromGaps,
  resolveBlockedRevenue,
  persistArtistCapabilities,
} from './capability-service';
import {
  fetchAndRankActions,
  computeRevenueUnlockPath,
} from './action-service';

const anthropic = new Anthropic();

const TOP_ACTIONS_LIMIT = 5;
const COACHING_MODEL = 'claude-sonnet-4-6';
const NARRATIVE_MODEL = 'claude-opus-4-6';

/**
 * Run the full decision engine pipeline for a completed audit.
 *
 * @param auditId - The persisted ArtistAudit.id (DB primary key)
 * @param audit   - The completed AuditResult (sub-agents already ran)
 * @param profile - The artist's ArtistProfile
 * @returns       DecisionEngineResult — persisted to DB and ready for the response renderer
 */
export async function runDecisionEngine(
  auditId: string,
  audit: AuditResult,
  profile: ArtistProfile
): Promise<DecisionEngineResult> {
  // ── Step 1: Gaps → Missing Capabilities ───────────────────────────────────
  const missingCapabilities = await resolveCapabilitiesFromGaps(audit.gaps);

  // ── Step 2: Missing Capabilities → Blocked Revenue Streams ────────────────
  const blockedRevenue = await resolveBlockedRevenue(
    missingCapabilities.map(c => c.id)
  );

  // ── Step 3: Rank Actions ───────────────────────────────────────────────────
  const rankedActions = await fetchAndRankActions(
    missingCapabilities,
    blockedRevenue,
    profile
  );

  const topActions = rankedActions.slice(0, TOP_ACTIONS_LIMIT);

  // ── Step 4: Revenue Unlock Path ────────────────────────────────────────────
  const revenueUnlockPath = computeRevenueUnlockPath(
    rankedActions,
    blockedRevenue
  );

  // ── Step 5: Estimate score if top actions completed ────────────────────────
  const estimatedScoreIfCompleted = Math.min(
    100,
    audit.overallScore +
      topActions.reduce((sum, a) => sum + a.expectedImpact, 0)
  );

  // ── Step 6: AI coaching — all 4 dimensions in parallel ────────────────────
  const [profileCoaching, platformCoaching, releaseCoaching, businessCoaching] =
    await Promise.all([
      generateDimensionCoaching('profile', audit, profile),
      generateDimensionCoaching('platform', audit, profile),
      generateDimensionCoaching('release', audit, profile),
      generateDimensionCoaching('business', audit, profile),
    ]);

  // ── Step 7: Gap story ──────────────────────────────────────────────────────
  const gapStory = await generateGapStory(audit, profile);

  // ── Step 8: Action personalisation ────────────────────────────────────────
  const personalisedActions = await generatePersonalisedActions(
    topActions,
    profile
  );

  // ── Step 9: Upgraded overall narrative ────────────────────────────────────
  const reasoning = await generateReasoning(
    audit,
    blockedRevenue,
    topActions,
    estimatedScoreIfCompleted,
    profile,
    gapStory
  );

  // ── Step 10: Persist capabilities ─────────────────────────────────────────
  const allCapabilityIds = await getAllCapabilityIds();
  await persistArtistCapabilities(
    audit.artistProfileId,
    missingCapabilities,
    allCapabilityIds
  );

  // ── Step 11: Persist DecisionResult ───────────────────────────────────────
  const unlockPathJson =
    revenueUnlockPath as unknown as import('@prisma/client').Prisma.InputJsonValue;
  const personalisedJson =
    personalisedActions as unknown as import('@prisma/client').Prisma.InputJsonValue;

  const decisionResult = await prisma.decisionResult.upsert({
    where: { auditId },
    update: {
      missingCapabilities: missingCapabilities.map(c => c.id),
      blockedRevenue: blockedRevenue.map(b => b.revenueStreamId),
      rankedActions: topActions.map(a => a.id),
      reasoning,
      revenueUnlockPath: unlockPathJson,
      profileCoaching,
      platformCoaching,
      releaseCoaching,
      businessCoaching,
      gapStory,
      personalisedActions: personalisedJson,
    },
    create: {
      auditId,
      artistProfileId: audit.artistProfileId,
      missingCapabilities: missingCapabilities.map(c => c.id),
      blockedRevenue: blockedRevenue.map(b => b.revenueStreamId),
      rankedActions: topActions.map(a => a.id),
      reasoning,
      revenueUnlockPath: unlockPathJson,
      profileCoaching,
      platformCoaching,
      releaseCoaching,
      businessCoaching,
      gapStory,
      personalisedActions: personalisedJson,
    },
  });

  return {
    id: decisionResult.id,
    auditId,
    overallScore: audit.overallScore,
    tier: audit.tier,
    profileScore: audit.profileScore,
    platformScore: audit.platformScore,
    releaseScore: audit.releaseScore,
    businessScore: audit.businessScore,
    prioritizedActions: topActions,
    missingCapabilities,
    blockedRevenue,
    revenueUnlockPath,
    reasoning,
    estimatedScoreIfCompleted: Math.round(estimatedScoreIfCompleted),
    profileCoaching,
    platformCoaching,
    releaseCoaching,
    businessCoaching,
    gapStory,
    personalisedActions,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Convenience: call the LLM and return text, with a fallback. */
async function callLLM(
  prompt: string,
  model: string,
  maxTokens: number,
  fallback: string
): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = message.content[0];
    return content.type === 'text' ? content.text.trim() : fallback;
  } catch (err) {
    console.error('[DecisionEngine] LLM call failed:', err);
    return fallback;
  }
}

/** Per-dimension coaching (industry insider tone). */
async function generateDimensionCoaching(
  dimension: 'profile' | 'platform' | 'release' | 'business',
  audit: AuditResult,
  profile: ArtistProfile
): Promise<string> {
  const phaseLabel = {
    profile: 'Profile',
    platform: 'Platform Presence',
    release: 'Release Planning',
    business: 'Business Readiness',
  }[dimension];
  const dimensionResult = audit.dimensions.find(d => d.dimension === dimension);
  const score = {
    profile: audit.profileScore,
    platform: audit.platformScore,
    release: audit.releaseScore,
    business: audit.businessScore,
  }[dimension];
  const failed =
    dimensionResult?.checks
      .filter(c => !c.passed)
      .map(c => `- ${c.label}${c.details ? `: ${c.details}` : ''}`)
      .join('\n') || 'None';
  const passed =
    dimensionResult?.checks
      .filter(c => c.passed)
      .map(c => `- ${c.label}`)
      .join('\n') || 'None';

  const prompt = `You are a senior A&R consultant reviewing a ${phaseLabel} audit.

Artist: ${profile.artistType} | Stage: ${profile.careerStage} | Revenue: ${(profile.revenueModels as string[]).join(', ') || 'not set'}
${phaseLabel} score: ${score}/100

Checks that failed:
${failed}

Checks that passed:
${passed}

Write 2–3 sentences of direct feedback as if closing a label meeting. Reference what DSPs, curators, or bookers look for. Use the real check data — no generic advice. No filler phrases.`;

  return callLLM(
    prompt,
    COACHING_MODEL,
    200,
    `Score: ${score}/100. Review the failed checks above and address the highest-impact items first.`
  );
}

/** Gap story connecting the dots across all dimensions. */
async function generateGapStory(
  audit: AuditResult,
  profile: ArtistProfile
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

  return callLLM(
    prompt,
    COACHING_MODEL,
    150,
    `Your ${audit.gaps[0]?.label ?? 'top gap'} is the primary barrier right now.`
  );
}

/** Personalise action descriptions using artist context. */
async function generatePersonalisedActions(
  topActions: RankedAction[],
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
    const message = await anthropic.messages.create({
      model: COACHING_MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });
    const raw =
      message.content[0]?.type === 'text'
        ? message.content[0].text.trim()
        : '[]';
    const cleaned = raw
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
    const parsed = JSON.parse(cleaned) as PersonalisedAction[];
    if (!Array.isArray(parsed)) throw new Error('Not an array');
    return parsed;
  } catch (err) {
    console.error('[DecisionEngine] Action personalisation failed:', err);
    return topActions.map(a => ({
      id: a.id,
      label: a.label,
      description: a.description,
    }));
  }
}

/** Upgraded 5–7 sentence overall narrative (industry insider tone). */
async function generateReasoning(
  audit: AuditResult,
  blockedRevenue: BlockedRevenueStream[],
  topActions: RankedAction[],
  estimatedScoreIfCompleted: number,
  profile: ArtistProfile,
  gapStory: string
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

Score if top actions completed: ${estimatedScoreIfCompleted}/100

Gap story already shared with artist (do NOT repeat this):
"${gapStory}"

Write 5–7 sentences. Sound like you are wrapping up a real meeting — honest, direct, specific. Reference their career stage and what artists at their level focus on. No filler phrases. End with one clear statement about the single biggest opportunity in front of them right now.`;

  const fallback = buildFallbackReasoning(audit, topActions);
  return callLLM(prompt, NARRATIVE_MODEL, 400, fallback);
}

function buildFallbackReasoning(
  audit: AuditResult,
  topActions: RankedAction[]
): string {
  const tierLabel = audit.tier.replace(/_/g, ' ');
  const firstAction = topActions[0]?.label ?? 'address your top gaps';
  const actionCount = topActions.length;
  return (
    `Your career readiness score is ${audit.overallScore}/100 — ${tierLabel}. ` +
    `Start by focusing on "${firstAction}" to make the biggest immediate impact. ` +
    `Completing your top ${actionCount} recommended action${actionCount !== 1 ? 's' : ''} could push your score to ${Math.min(100, audit.overallScore + topActions.reduce((s, a) => s + a.expectedImpact, 0))}/100.`
  );
}

async function getAllCapabilityIds(): Promise<string[]> {
  const caps = await prisma.capability.findMany({ select: { id: true } });
  return caps.map(c => c.id);
}
