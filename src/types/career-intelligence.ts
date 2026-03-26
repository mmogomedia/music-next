/**
 * Career Intelligence Engine — shared TypeScript types
 */

import type { ArtistProfile } from '@prisma/client';

// ── AUDIT TYPES ───────────────────────────────────────

export type AuditDimension = 'profile' | 'platform' | 'release' | 'business';

export type AuditTier =
  | 'tour_ready'
  | 'developing'
  | 'needs_work'
  | 'just_starting';

export interface AuditCheck {
  checkId: string;
  label: string;
  passed: boolean;
  impact: number; // points this check contributes to the dimension score
  details?: string; // human-readable explanation of why it passed/failed
}

export interface AuditGap {
  checkId: string;
  label: string;
  impact: number;
  dimension: AuditDimension;
  details?: string;
}

export interface DimensionResult {
  dimension: AuditDimension;
  score: number;
  checks: AuditCheck[];
  gaps: AuditGap[];
}

export interface AuditResult {
  artistProfileId: string;
  overallScore: number;
  tier: AuditTier;
  profileScore: number;
  platformScore: number;
  releaseScore: number;
  businessScore: number;
  gaps: AuditGap[];
  checks: AuditCheck[];
  dimensions: DimensionResult[];
}

// ── CAPABILITY TYPES ──────────────────────────────────

export interface MissingCapability {
  id: string;
  label: string;
  description: string;
  category: string;
  frequency: number; // how many gaps map to this capability
  totalWeight: number; // sum of weights from all gap mappings
}

export interface BlockedRevenueStream {
  revenueStreamId: string;
  label: string;
  description: string;
  supportingPlatforms: string[];
  blockedBy: string[]; // capability IDs that are missing
  totalRequired: number; // total required capabilities for this stream
  completionPct: number; // % of required capabilities already present
}

// ── ACTION TYPES ──────────────────────────────────────

export interface RankedAction {
  id: string;
  label: string;
  description: string;
  capabilityId: string;
  capabilityLabel: string;
  dimension: string;
  effort: string;
  timeToComplete: string;
  expectedImpact: number;
  actionUrl: string | null;
  revenueStreams: { id: string; label: string }[];
  rankScore: number;
}

export interface RankingContext {
  missingCapabilities: MissingCapability[];
  blockedRevenue: BlockedRevenueStream[];
  profile: ArtistProfile;
}

// ── DECISION ENGINE TYPES ─────────────────────────────

export interface RevenueUnlockPathItem {
  revenueStreamId: string;
  label: string;
  currentCompletionPct: number;
  requiredActions: { id: string; label: string }[];
  estimatedScoreDelta: number;
}

export interface DecisionEngineResult {
  id: string;
  auditId: string;
  // Current audit scores
  overallScore: number;
  tier: AuditTier;
  profileScore: number;
  platformScore: number;
  releaseScore: number;
  businessScore: number;
  // Intelligence layer outputs
  prioritizedActions: RankedAction[];
  missingCapabilities: MissingCapability[];
  blockedRevenue: BlockedRevenueStream[];
  revenueUnlockPath: RevenueUnlockPathItem[];
  reasoning: string;
  estimatedScoreIfCompleted: number;
}

// ── QUESTIONNAIRE TYPES ───────────────────────────────

export interface QuestionnaireAnswers {
  journeyType: string;
  discoveryRanked: string[]; // max 3, ordered
  socialManaged: string;
  incomeRanked: string[]; // max 3, ordered
  primaryGoal: string;
  trackCount: string;
  collaborations: string;
}
