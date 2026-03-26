/**
 * Score Aggregator
 *
 * Computes the final weighted Career Readiness Score (0–100) from the four dimension scores.
 * Weights shift by artist type so the score reflects what actually matters for each type.
 *
 * All logic is deterministic — no LLM calls here.
 */

import type { ArtistType } from '@prisma/client';
import type {
  AuditResult,
  AuditTier,
  DimensionResult,
} from '@/types/career-intelligence';

// ── Base Weights ─────────────────────────────────────────────────────────────

export const BASE_WEIGHTS = {
  profile: 0.25,
  platform: 0.25,
  release: 0.3,
  business: 0.2,
};

// ── Type-specific Overrides ───────────────────────────────────────────────────

export const TYPE_WEIGHT_OVERRIDES: Record<ArtistType, typeof BASE_WEIGHTS> = {
  INDEPENDENT: BASE_WEIGHTS,
  HYBRID: { profile: 0.25, platform: 0.3, release: 0.25, business: 0.2 },
  PERFORMER: { profile: 0.4, platform: 0.15, release: 0.2, business: 0.25 },
  SESSION_PRODUCER: {
    profile: 0.25,
    platform: 0.1,
    release: 0.25,
    business: 0.4,
  },
  SIGNED_ARTIST: { profile: 0.3, platform: 0.2, release: 0.2, business: 0.3 },
  SONGWRITER: { profile: 0.25, platform: 0.15, release: 0.3, business: 0.3 },
};

// ── Tier Thresholds ──────────────────────────────────────────────────────────

export function scoreTier(score: number): AuditTier {
  if (score >= 80) return 'tour_ready';
  if (score >= 60) return 'developing';
  if (score >= 40) return 'needs_work';
  return 'just_starting';
}

// ── Main Aggregator ──────────────────────────────────────────────────────────

export interface DimensionScores {
  profile: number;
  platform: number;
  release: number;
  business: number;
}

/**
 * Compute the weighted overall score from four dimension scores.
 * Returns a value in [0, 100].
 */
export function computeOverallScore(
  scores: DimensionScores,
  artistType: ArtistType
): number {
  const weights = TYPE_WEIGHT_OVERRIDES[artistType] ?? BASE_WEIGHTS;

  const weighted =
    scores.profile * weights.profile +
    scores.platform * weights.platform +
    scores.release * weights.release +
    scores.business * weights.business;

  return Math.round(Math.min(100, Math.max(0, weighted)));
}

/**
 * Build the final AuditResult from dimension results and artist metadata.
 */
export function buildAuditResult(
  artistProfileId: string,
  artistType: ArtistType,
  dimensions: {
    profile: DimensionResult;
    platform: DimensionResult;
    release: DimensionResult;
    business: DimensionResult;
  }
): Omit<AuditResult, 'artistProfileId'> & { artistProfileId: string } {
  const scores: DimensionScores = {
    profile: dimensions.profile.score,
    platform: dimensions.platform.score,
    release: dimensions.release.score,
    business: dimensions.business.score,
  };

  const overallScore = computeOverallScore(scores, artistType);
  const tier = scoreTier(overallScore);

  const allGaps = [
    ...dimensions.profile.gaps,
    ...dimensions.platform.gaps,
    ...dimensions.release.gaps,
    ...dimensions.business.gaps,
  ].sort((a, b) => b.impact - a.impact); // highest impact gaps first

  const allChecks = [
    ...dimensions.profile.checks,
    ...dimensions.platform.checks,
    ...dimensions.release.checks,
    ...dimensions.business.checks,
  ];

  return {
    artistProfileId,
    overallScore,
    tier,
    profileScore: scores.profile,
    platformScore: scores.platform,
    releaseScore: scores.release,
    businessScore: scores.business,
    gaps: allGaps,
    checks: allChecks,
    dimensions: [
      dimensions.profile,
      dimensions.platform,
      dimensions.release,
      dimensions.business,
    ],
  };
}
