/**
 * Audit Stream Event Types
 *
 * SSE event protocol for the streaming career audit pipeline.
 * Consumed by the streaming orchestrator (server) and useAuditStream hook (client).
 */

import type {
  AuditCheck,
  AuditDimension,
  DecisionEngineResult,
} from './career-intelligence';

export type { AuditDimension };

// ── Individual event types ────────────────────────────────────────────────────

export interface AuditStartEvent {
  type: 'audit_start';
  timestamp: string;
}

export interface PhaseStartEvent {
  type: 'phase_start';
  phase: AuditDimension;
  label: string;
  timestamp: string;
}

export interface CheckResultEvent {
  type: 'check_result';
  phase: AuditDimension;
  check: AuditCheck;
  timestamp: string;
}

export interface PhaseCompleteEvent {
  type: 'phase_complete';
  phase: AuditDimension;
  score: number;
  timestamp: string;
}

export interface DecisionStartEvent {
  type: 'decision_start';
  timestamp: string;
}

// ── Per-dimension AI coaching events ─────────────────────────────────────────

export interface DimensionCoachingStartEvent {
  type: 'dimension_coaching_start';
  phase: AuditDimension;
  timestamp: string;
}

export interface DimensionCoachingTokenEvent {
  type: 'dimension_coaching_token';
  phase: AuditDimension;
  token: string;
  timestamp: string;
}

export interface DimensionCoachingCompleteEvent {
  type: 'dimension_coaching_complete';
  phase: AuditDimension;
  coaching: string;
  timestamp: string;
}

// ── Gap story events ──────────────────────────────────────────────────────────

export interface GapStoryTokenEvent {
  type: 'gap_story_token';
  token: string;
  timestamp: string;
}

export interface GapStoryCompleteEvent {
  type: 'gap_story_complete';
  story: string;
  timestamp: string;
}

// ── Action personalisation event (single batch, no streaming) ─────────────────

export interface ActionsPersonalisedEvent {
  type: 'actions_personalised';
  actions: { id: string; label: string; description: string }[];
  timestamp: string;
}

// ── Overall narrative ─────────────────────────────────────────────────────────

export interface ThinkingTokenEvent {
  type: 'thinking_token';
  token: string;
  timestamp: string;
}

export interface AuditCompleteEvent {
  type: 'audit_complete';
  result: DecisionEngineResult;
  timestamp: string;
}

export interface AuditErrorEvent {
  type: 'error';
  error: { message: string; code: string };
  timestamp: string;
}

// ── Discriminated union ───────────────────────────────────────────────────────

export type AuditSSEEvent =
  | AuditStartEvent
  | PhaseStartEvent
  | CheckResultEvent
  | PhaseCompleteEvent
  | DecisionStartEvent
  | DimensionCoachingStartEvent
  | DimensionCoachingTokenEvent
  | DimensionCoachingCompleteEvent
  | GapStoryTokenEvent
  | GapStoryCompleteEvent
  | ActionsPersonalisedEvent
  | ThinkingTokenEvent
  | AuditCompleteEvent
  | AuditErrorEvent;

// ── Phase metadata ─────────────────────────────────────────────────────────────

export const PHASE_META: Record<
  AuditDimension,
  { label: string; description: string }
> = {
  profile: {
    label: 'Profile Analysis',
    description: 'Checking your artist profile completeness',
  },
  platform: {
    label: 'Platform Connections',
    description: 'Checking PULSE³ platform data and audience size',
  },
  release: {
    label: 'Release Planning',
    description: 'Checking tracks, smart links, and release cadence',
  },
  business: {
    label: 'Business Readiness',
    description: 'Checking split sheets, ISRC codes, and distribution',
  },
};
