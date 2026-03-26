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
  MissingCapability,
  BlockedRevenueStream,
  RankedAction,
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

// How many top actions to surface in the decision result
const TOP_ACTIONS_LIMIT = 5;

// How many capabilities to pass to the LLM for narrative context
const LLM_CAPABILITY_CONTEXT_LIMIT = 5;

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

  // ── Step 6: ONE LLM call — narrative reasoning only ───────────────────────
  const reasoning = await generateReasoning(
    audit,
    missingCapabilities,
    blockedRevenue,
    topActions,
    estimatedScoreIfCompleted,
    profile
  );

  // ── Step 7: Persist all capabilities (present + missing) ──────────────────
  const allCapabilityIds = await getAllCapabilityIds();
  await persistArtistCapabilities(
    audit.artistProfileId,
    missingCapabilities,
    allCapabilityIds
  );

  // ── Step 8: Persist DecisionResult ────────────────────────────────────────
  const unlockPathJson =
    revenueUnlockPath as unknown as import('@prisma/client').Prisma.InputJsonValue;

  const decisionResult = await prisma.decisionResult.upsert({
    where: { auditId },
    update: {
      missingCapabilities: missingCapabilities.map(c => c.id),
      blockedRevenue: blockedRevenue.map(b => b.revenueStreamId),
      rankedActions: topActions.map(a => a.id),
      reasoning,
      revenueUnlockPath: unlockPathJson,
    },
    create: {
      auditId,
      artistProfileId: audit.artistProfileId,
      missingCapabilities: missingCapabilities.map(c => c.id),
      blockedRevenue: blockedRevenue.map(b => b.revenueStreamId),
      rankedActions: topActions.map(a => a.id),
      reasoning,
      revenueUnlockPath: unlockPathJson,
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
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Generate a plain-language reasoning narrative using one LLM call.
 * This is the ONLY place in the career intelligence engine where an LLM is used.
 * Scores, rankings, and prioritisation are all deterministic — the LLM only writes prose.
 */
async function generateReasoning(
  audit: AuditResult,
  missingCapabilities: MissingCapability[],
  blockedRevenue: BlockedRevenueStream[],
  topActions: RankedAction[],
  estimatedScoreIfCompleted: number,
  profile: ArtistProfile
): Promise<string> {
  const topCaps = missingCapabilities
    .slice(0, LLM_CAPABILITY_CONTEXT_LIMIT)
    .map(c => `- ${c.label} (${c.category}): ${c.description}`)
    .join('\n');

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
          .map(
            b =>
              `- ${b.label}: ${b.completionPct}% complete, blocked by ${b.blockedBy.length} capability gap(s)`
          )
          .join('\n')
      : 'No revenue streams fully blocked.';

  const prompt = `You are a music industry career advisor. An artist just completed a career readiness audit.
Write a concise, encouraging, and actionable 2–3 sentence summary of their situation and what they should do next.

Tone: direct, supportive, specific. Avoid generic advice. Reference the real gaps and actions below.

AUDIT SUMMARY:
- Overall Score: ${audit.overallScore}/100 (${audit.tier.replace(/_/g, ' ')})
- Profile: ${audit.profileScore}/100 | Platform: ${audit.platformScore}/100 | Release: ${audit.releaseScore}/100 | Business: ${audit.businessScore}/100
- Artist type: ${profile.artistType}
- Revenue models: ${(profile.revenueModels as string[]).join(', ') || 'not set'}

TOP CAPABILITY GAPS:
${topCaps}

BLOCKED REVENUE STREAMS:
${blockedStreamsText}

TOP RECOMMENDED ACTIONS:
${topActionsText}

ESTIMATED SCORE IF TOP ACTIONS COMPLETED: ${estimatedScoreIfCompleted}/100

Write the summary now (2–3 sentences max):`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    return content.type === 'text'
      ? content.text.trim()
      : buildFallbackReasoning(audit, topActions);
  } catch (error) {
    console.error('[DecisionEngine] LLM narrative generation failed:', error);
    return buildFallbackReasoning(audit, topActions);
  }
}

/**
 * Deterministic fallback narrative if the LLM call fails.
 * Ensures the engine always returns a complete result.
 */
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

/**
 * Fetch all capability IDs from the DB for use in persistArtistCapabilities.
 * Cached within a single engine run — no repeated queries.
 */
async function getAllCapabilityIds(): Promise<string[]> {
  const caps = await prisma.capability.findMany({ select: { id: true } });
  return caps.map(c => c.id);
}
