'use client';

/**
 * useAuditStream
 *
 * Consumes the POST /api/ai/artist-audit/stream SSE endpoint and builds
 * reactive state that the CareerAuditTab can render as a live agentic
 * pipeline view.
 *
 * State shape mirrors the SSE event sequence:
 *   idle → connecting → running → complete | error
 *
 * Each AuditDimension has its own PhaseState so the UI can track
 * not-started / running / complete independently.
 */

import { useCallback, useRef, useState } from 'react';
import type { AuditSSEEvent, AuditDimension } from '@/types/audit-stream';
import type {
  AuditCheck,
  DecisionEngineResult,
  PersonalisedAction,
} from '@/types/career-intelligence';

// ── Phase state ───────────────────────────────────────────────────────────────

export type PhaseStatus = 'idle' | 'running' | 'coaching' | 'complete';

export interface PhaseState {
  status: PhaseStatus;
  label: string;
  score: number | null;
  checks: AuditCheck[];
  coaching: string; // AI coaching text (accumulates token-by-token)
}

const INITIAL_PHASES: Record<AuditDimension, PhaseState> = {
  profile: {
    status: 'idle',
    label: 'Profile Analysis',
    score: null,
    checks: [],
    coaching: '',
  },
  platform: {
    status: 'idle',
    label: 'Platform Connections',
    score: null,
    checks: [],
    coaching: '',
  },
  release: {
    status: 'idle',
    label: 'Release Planning',
    score: null,
    checks: [],
    coaching: '',
  },
  business: {
    status: 'idle',
    label: 'Business Readiness',
    score: null,
    checks: [],
    coaching: '',
  },
};

// ── Stream state ──────────────────────────────────────────────────────────────

export type StreamStatus =
  | 'idle'
  | 'connecting'
  | 'running'
  | 'complete'
  | 'error';

export interface AuditStreamState {
  status: StreamStatus;
  phases: Record<AuditDimension, PhaseState>;
  /** Overall narrative accumulated token-by-token */
  narrative: string;
  /** Gap story accumulated token-by-token */
  gapStory: string;
  /** Personalised actions set once actions_personalised is received */
  personalisedActions: PersonalisedAction[] | null;
  /** Set once audit_complete is received */
  result: DecisionEngineResult | null;
  /** Error message if status === 'error' */
  error: string | null;
  /** Whether the decision engine phase has started (after all 4 phases) */
  decisionStarted: boolean;
}

const INITIAL_STATE: AuditStreamState = {
  status: 'idle',
  phases: INITIAL_PHASES,
  narrative: '',
  gapStory: '',
  personalisedActions: null,
  result: null,
  error: null,
  decisionStarted: false,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseAuditStreamReturn extends AuditStreamState {
  /** Kick off a new audit stream. No-ops if already running. */
  startAudit: () => void;
  /** Reset all state back to idle so the user can re-run */
  reset: () => void;
}

export function useAuditStream(): UseAuditStreamReturn {
  const [state, setState] = useState<AuditStreamState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const startAudit = useCallback(() => {
    // Prevent concurrent runs
    if (state.status === 'connecting' || state.status === 'running') return;

    // Cancel any previous stream
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    // Reset to a clean "connecting" state, keeping phase labels
    setState({
      ...INITIAL_STATE,
      status: 'connecting',
    });

    (async () => {
      try {
        const response = await fetch('/api/ai/artist-audit/stream', {
          method: 'POST',
          signal: abort.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        setState(prev => ({ ...prev, status: 'running' }));

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        let reading = true;
        while (reading) {
          const { done, value } = await reader.read();
          if (done) {
            reading = false;
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by double newlines
          const frames = buffer.split('\n\n');
          // The last element may be incomplete — keep it in the buffer
          buffer = frames.pop() ?? '';

          for (const frame of frames) {
            const line = frame.trim();
            if (!line.startsWith('data:')) continue;

            const json = line.slice(5).trim();
            if (!json) continue;

            try {
              const event: AuditSSEEvent = JSON.parse(json);
              handleEvent(event);
            } catch {
              // malformed frame — skip
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return; // intentional cancel

        setState(prev => ({
          ...prev,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        }));
      }
    })();

    // ── Event handler ─────────────────────────────────────────────────────────

    function handleEvent(event: AuditSSEEvent) {
      switch (event.type) {
        case 'audit_start':
          setState(prev => ({ ...prev, status: 'running' }));
          break;

        case 'phase_start':
          setState(prev => ({
            ...prev,
            phases: {
              ...prev.phases,
              [event.phase]: {
                ...prev.phases[event.phase],
                status: 'running',
                label: event.label,
                checks: [],
              },
            },
          }));
          break;

        case 'check_result':
          setState(prev => ({
            ...prev,
            phases: {
              ...prev.phases,
              [event.phase]: {
                ...prev.phases[event.phase],
                checks: [...prev.phases[event.phase].checks, event.check],
              },
            },
          }));
          break;

        case 'phase_complete':
          setState(prev => ({
            ...prev,
            phases: {
              ...prev.phases,
              [event.phase]: {
                ...prev.phases[event.phase],
                status: 'complete',
                score: event.score,
              },
            },
          }));
          break;

        case 'dimension_coaching_start':
          setState(prev => ({
            ...prev,
            phases: {
              ...prev.phases,
              [event.phase]: {
                ...prev.phases[event.phase],
                status: 'coaching',
              },
            },
          }));
          break;

        case 'dimension_coaching_token':
          setState(prev => ({
            ...prev,
            phases: {
              ...prev.phases,
              [event.phase]: {
                ...prev.phases[event.phase],
                coaching: prev.phases[event.phase].coaching + event.token,
              },
            },
          }));
          break;

        case 'dimension_coaching_complete':
          setState(prev => ({
            ...prev,
            phases: {
              ...prev.phases,
              [event.phase]: {
                ...prev.phases[event.phase],
                status: 'complete',
                coaching: event.coaching,
              },
            },
          }));
          break;

        case 'gap_story_token':
          setState(prev => ({
            ...prev,
            gapStory: prev.gapStory + event.token,
          }));
          break;

        case 'gap_story_complete':
          setState(prev => ({ ...prev, gapStory: event.story }));
          break;

        case 'actions_personalised':
          setState(prev => ({ ...prev, personalisedActions: event.actions }));
          break;

        case 'decision_start':
          setState(prev => ({ ...prev, decisionStarted: true }));
          break;

        case 'thinking_token':
          setState(prev => ({
            ...prev,
            narrative: prev.narrative + event.token,
          }));
          break;

        case 'audit_complete':
          setState(prev => ({
            ...prev,
            status: 'complete',
            result: event.result,
          }));
          break;

        case 'error':
          setState(prev => ({
            ...prev,
            status: 'error',
            error: event.error.message,
          }));
          break;
      }
    }
  }, [state.status]);

  return { ...state, startAudit, reset };
}
