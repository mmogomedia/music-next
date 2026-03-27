'use client';

/**
 * CareerAuditTab — streaming agentic pipeline view
 *
 * Shows live progress as each audit phase runs:
 *   • Not started  → red ring + idle icon
 *   • Running      → orange ring + animated spinner
 *   • Complete     → green ring + check icon
 *
 * LLM narrative streams token-by-token via a typewriter cursor.
 * Once complete, the full result panel replaces the pipeline view.
 */

import { type ComponentType, useState, useCallback, useEffect } from 'react';
import ArtistTypeQuestionnaire from './ArtistTypeQuestionnaire';
import clsx from 'clsx';
import {
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  BoltIcon,
  UserCircleIcon,
  SignalIcon,
  MusicalNoteIcon,
  BriefcaseIcon,
  CpuChipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  XCircleIcon as XCircleSolid,
} from '@heroicons/react/24/solid';
import { useAuditStream, type PhaseStatus } from '@/hooks/useAuditStream';
import type {
  AuditDimension,
  AuditTier,
  DecisionEngineResult,
  PersonalisedAction,
} from '@/types/career-intelligence';

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER_META: Record<
  AuditTier,
  { label: string; color: string; bg: string; bar: string; dot: string }
> = {
  tour_ready: {
    label: 'Release Ready',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
  developing: {
    label: 'Developing',
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    bar: 'bg-yellow-500',
    dot: 'bg-yellow-500',
  },
  needs_work: {
    label: 'Needs Work',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    bar: 'bg-orange-500',
    dot: 'bg-orange-500',
  },
  just_starting: {
    label: 'Just Starting',
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
    bar: 'bg-rose-500',
    dot: 'bg-rose-500',
  },
};

// ── Phase icon map ─────────────────────────────────────────────────────────────

const PHASE_ICONS: Record<
  AuditDimension,
  ComponentType<{ className?: string }>
> = {
  profile: UserCircleIcon,
  platform: SignalIcon,
  release: MusicalNoteIcon,
  business: BriefcaseIcon,
};

const PHASE_ORDER: AuditDimension[] = [
  'profile',
  'platform',
  'release',
  'business',
];

// ── Phase status styling ──────────────────────────────────────────────────────

function phaseRingClass(status: PhaseStatus): string {
  switch (status) {
    case 'idle':
      return 'ring-2 ring-rose-400 dark:ring-rose-600';
    case 'running':
      return 'ring-2 ring-orange-400 dark:ring-orange-500 animate-pulse';
    case 'coaching':
      return 'ring-2 ring-purple-400 dark:ring-purple-500 animate-pulse';
    case 'complete':
      return 'ring-2 ring-emerald-400 dark:ring-emerald-500';
  }
}

function phaseIconBgClass(status: PhaseStatus): string {
  switch (status) {
    case 'idle':
      return 'bg-slate-100 dark:bg-slate-700';
    case 'running':
      return 'bg-orange-100 dark:bg-orange-900/30';
    case 'coaching':
      return 'bg-purple-100 dark:bg-purple-900/30';
    case 'complete':
      return 'bg-emerald-100 dark:bg-emerald-900/30';
  }
}

function phaseIconColorClass(status: PhaseStatus): string {
  switch (status) {
    case 'idle':
      return 'text-slate-400 dark:text-slate-500';
    case 'running':
      return 'text-orange-500 dark:text-orange-400';
    case 'coaching':
      return 'text-purple-600 dark:text-purple-400';
    case 'complete':
      return 'text-emerald-600 dark:text-emerald-400';
  }
}

function statusLabel(status: PhaseStatus): string {
  switch (status) {
    case 'idle':
      return 'Not started';
    case 'running':
      return 'Analysing…';
    case 'coaching':
      return 'Getting coach feedback…';
    case 'complete':
      return 'Complete';
  }
}

function statusTextClass(status: PhaseStatus): string {
  switch (status) {
    case 'idle':
      return 'text-slate-400 dark:text-slate-500';
    case 'running':
      return 'text-orange-500 dark:text-orange-400';
    case 'coaching':
      return 'text-purple-600 dark:text-purple-400';
    case 'complete':
      return 'text-emerald-600 dark:text-emerald-400';
  }
}

// ── Helper: score bar colour ───────────────────────────────────────────────────

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-rose-500';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DimensionBar({
  label,
  score,
  coaching,
}: {
  label: string;
  score: number;
  coaching?: string;
}) {
  return (
    <div className='space-y-1'>
      <div className='flex justify-between text-xs font-medium'>
        <span className='text-slate-600 dark:text-slate-400'>{label}</span>
        <span className='text-slate-800 dark:text-slate-200'>{score}</span>
      </div>
      <div className='h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden'>
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {coaching && (
        <p className='text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1'>
          {coaching}
        </p>
      )}
    </div>
  );
}

// ── Phase card (pipeline view) ────────────────────────────────────────────────

interface PhaseCardProps {
  id: AuditDimension;
  label: string;
  status: PhaseStatus;
  score: number | null;
  checks: {
    checkId: string;
    label: string;
    passed: boolean;
    details?: string;
  }[];
  coaching: string;
}

function PhaseCard({ label, status, score, checks, coaching }: PhaseCardProps) {
  const Icon =
    PHASE_ICONS[label.toLowerCase().replace(' ', '_') as AuditDimension] ??
    SparklesIcon;

  return (
    <div
      className={clsx(
        'rounded-xl border bg-white dark:bg-slate-800/80 p-4 transition-all duration-300',
        status === 'idle' &&
          'border-slate-200 dark:border-slate-700 opacity-60',
        status === 'running' && 'border-orange-300 dark:border-orange-600',
        status === 'coaching' && 'border-purple-300 dark:border-purple-700',
        status === 'complete' && 'border-emerald-300 dark:border-emerald-700'
      )}
    >
      {/* Phase header */}
      <div className='flex items-center gap-3 mb-3'>
        <div
          className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
            phaseIconBgClass(status),
            phaseRingClass(status)
          )}
        >
          {status === 'running' || status === 'coaching' ? (
            <ArrowPathIcon
              className={clsx(
                'w-4.5 h-4.5 animate-spin',
                phaseIconColorClass(status)
              )}
            />
          ) : (
            <Icon
              className={clsx('w-4.5 h-4.5', phaseIconColorClass(status))}
            />
          )}
        </div>

        <div className='flex-1 min-w-0'>
          <p className='text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight'>
            {label}
          </p>
          <p className={clsx('text-xs font-medium', statusTextClass(status))}>
            {statusLabel(status)}
            {status === 'complete' &&
              score !== null &&
              ` · ${Math.round(score)}/100`}
          </p>
        </div>

        {status === 'complete' && score !== null && (
          <div className='flex-shrink-0'>
            <div className='w-10 h-10 relative'>
              <svg viewBox='0 0 36 36' className='w-10 h-10 -rotate-90'>
                <circle
                  cx='18'
                  cy='18'
                  r='15'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='3'
                  className='text-slate-100 dark:text-slate-700'
                />
                <circle
                  cx='18'
                  cy='18'
                  r='15'
                  fill='none'
                  strokeWidth='3'
                  strokeLinecap='round'
                  strokeDasharray={`${(score / 100) * 94.2} 94.2`}
                  className={clsx(
                    score >= 80
                      ? 'stroke-emerald-500'
                      : score >= 60
                        ? 'stroke-yellow-500'
                        : score >= 40
                          ? 'stroke-orange-500'
                          : 'stroke-rose-500'
                  )}
                />
              </svg>
              <span className='absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300'>
                {Math.round(score)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Checks list — only shown once the phase has received at least one check */}
      {checks.length > 0 && (
        <ul className='space-y-1.5 mt-3 pl-1'>
          {checks.map(check => (
            <li key={check.checkId} className='flex items-start gap-2'>
              {check.passed ? (
                <CheckCircleSolid className='w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5' />
              ) : (
                <XCircleSolid className='w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5' />
              )}
              <div className='min-w-0'>
                <span className='text-xs text-slate-600 dark:text-slate-400 leading-tight'>
                  {check.label}
                </span>
                {!check.passed && check.details && (
                  <p className='text-[11px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5 line-clamp-2'>
                    {check.details}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Running placeholder rows */}
      {status === 'running' && checks.length === 0 && (
        <div className='space-y-2 mt-3 animate-pulse'>
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className='h-3 rounded-full bg-slate-100 dark:bg-slate-700'
              style={{ width: `${60 + n * 10}%` }}
            />
          ))}
        </div>
      )}

      {/* Coaching blurb — appears after checks, types out during 'coaching' status */}
      {(status === 'coaching' || coaching) && (
        <div className='mt-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/60 px-3 py-2.5'>
          <div className='flex items-start gap-2'>
            <span className='text-purple-400 dark:text-purple-500 flex-shrink-0 mt-0.5 text-sm leading-none'>
              💬
            </span>
            {coaching ? (
              <p className='text-xs text-purple-700 dark:text-purple-300 leading-relaxed'>
                {coaching}
                {status === 'coaching' && (
                  <span className='inline-block w-0.5 h-[1em] bg-purple-500 ml-0.5 align-middle animate-pulse' />
                )}
              </p>
            ) : (
              <div className='space-y-1.5 flex-1 animate-pulse'>
                <div className='h-2.5 rounded-full bg-purple-200 dark:bg-purple-800/60 w-full' />
                <div className='h-2.5 rounded-full bg-purple-200 dark:bg-purple-800/60 w-4/5' />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Decision engine card ───────────────────────────────────────────────────────

function DecisionCard({
  started,
  gapStory,
  personalisedActions,
  narrative,
}: {
  started: boolean;
  gapStory: string;
  personalisedActions: PersonalisedAction[] | null;
  narrative: string;
}) {
  const isActive = started && (gapStory || narrative);

  return (
    <div
      className={clsx(
        'rounded-xl border p-4 transition-all duration-300',
        !started &&
          'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 opacity-60',
        started &&
          !isActive &&
          'border-orange-300 dark:border-orange-600 bg-white dark:bg-slate-800/80',
        isActive &&
          'border-purple-300 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-900/10'
      )}
    >
      <div className='flex items-center gap-3 mb-2'>
        <div
          className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
            !started &&
              'bg-slate-100 dark:bg-slate-700 ring-2 ring-rose-400 dark:ring-rose-600',
            started &&
              !isActive &&
              'bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-400 dark:ring-orange-500 animate-pulse',
            isActive &&
              'bg-purple-100 dark:bg-purple-900/40 ring-2 ring-purple-400 dark:ring-purple-500'
          )}
        >
          <CpuChipIcon
            className={clsx(
              'w-4.5 h-4.5',
              !started && 'text-slate-400 dark:text-slate-500',
              started && !isActive && 'text-orange-500 dark:text-orange-400',
              isActive && 'text-purple-600 dark:text-purple-400'
            )}
          />
        </div>
        <div>
          <p className='text-sm font-semibold text-slate-800 dark:text-slate-200'>
            Career Intelligence
          </p>
          <p
            className={clsx(
              'text-xs font-medium',
              !started && 'text-slate-400 dark:text-slate-500',
              started && !isActive && 'text-orange-500 dark:text-orange-400',
              isActive && 'text-purple-600 dark:text-purple-400'
            )}
          >
            {!started
              ? 'Not started'
              : narrative
                ? 'Analysis complete'
                : personalisedActions
                  ? 'Writing narrative…'
                  : gapStory
                    ? 'Personalising your actions…'
                    : 'Building gap analysis…'}
          </p>
        </div>
      </div>

      {started && !gapStory && !narrative && (
        <div className='space-y-2 mt-2 animate-pulse'>
          <div className='h-3 rounded-full bg-slate-100 dark:bg-slate-700 w-4/5' />
          <div className='h-3 rounded-full bg-slate-100 dark:bg-slate-700 w-3/5' />
        </div>
      )}

      {/* Gap story streams first */}
      {gapStory && (
        <div className='mt-2 mb-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 px-3 py-2.5'>
          <p className='text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium'>
            {gapStory}
            {!personalisedActions && (
              <span className='inline-block w-0.5 h-[1em] bg-amber-500 ml-0.5 align-middle animate-pulse' />
            )}
          </p>
        </div>
      )}

      {/* Personalising actions spinner */}
      {gapStory && !personalisedActions && !narrative && (
        <div className='flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 animate-pulse'>
          <ArrowPathIcon className='w-3.5 h-3.5 animate-spin' />
          Personalising your top actions…
        </div>
      )}

      {/* Streaming narrative */}
      {narrative && (
        <p className='text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-1'>
          {narrative}
          <span className='inline-block w-0.5 h-[1em] bg-purple-500 ml-0.5 align-middle animate-pulse' />
        </p>
      )}
    </div>
  );
}

// ── Result view ───────────────────────────────────────────────────────────────

function ResultView({
  result,
  narrative,
  gapStory,
  personalisedActions,
  onReRun,
  onReset,
  running,
}: {
  result: DecisionEngineResult;
  narrative: string;
  gapStory: string;
  personalisedActions: PersonalisedAction[] | null;
  onReRun: () => void;
  onReset: () => void;
  running: boolean;
}) {
  const tier = TIER_META[result.tier] ?? TIER_META.just_starting;

  return (
    <div className='space-y-5 max-w-3xl'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
          Career Readiness Audit
        </h2>
        <div className='flex items-center gap-2'>
          <button
            onClick={onReset}
            disabled={running}
            title='Clear results and start fresh'
            className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-500 dark:text-slate-400 font-medium text-sm transition-colors'
          >
            <XMarkIcon className='w-3.5 h-3.5' />
            Reset
          </button>
          <button
            onClick={onReRun}
            disabled={running}
            className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50 text-purple-700 dark:text-purple-300 font-medium text-sm transition-colors'
          >
            <ArrowPathIcon
              className={clsx('w-3.5 h-3.5', running && 'animate-spin')}
            />
            {running ? 'Running…' : 'Re-run Audit'}
          </button>
        </div>
      </div>

      {/* Score hero */}
      <div className={`rounded-2xl border p-6 ${tier.bg}`}>
        <div className='flex items-center justify-between mb-4'>
          <span
            className={`flex items-center gap-1.5 text-sm font-semibold ${tier.color}`}
          >
            <span className={`w-2 h-2 rounded-full ${tier.dot}`} />
            {tier.label}
          </span>
          <span className='text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider'>
            Overall Score
          </span>
        </div>

        <div className='flex items-end gap-3 mb-4'>
          <span className='text-7xl font-black text-slate-900 dark:text-white leading-none'>
            {result.overallScore}
          </span>
          <span className='text-2xl text-slate-400 dark:text-slate-500 font-medium mb-2'>
            / 100
          </span>
        </div>

        {/* Gap story — highlighted callout above narrative */}
        {(gapStory || result.gapStory) && (
          <div className='mb-3 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 px-4 py-3'>
            <p className='text-sm text-amber-800 dark:text-amber-300 leading-relaxed font-medium'>
              {gapStory || result.gapStory}
            </p>
          </div>
        )}

        {narrative && (
          <p className='text-sm text-slate-600 dark:text-slate-400 leading-relaxed'>
            {narrative}
          </p>
        )}

        {result.estimatedScoreIfCompleted > result.overallScore && (
          <div className='mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-full'>
            <BoltIcon className='w-3.5 h-3.5' />
            Complete top actions → reach {result.estimatedScoreIfCompleted}/100
          </div>
        )}
      </div>

      {/* Dimension breakdown */}
      <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-6'>
        <h3 className='text-sm font-semibold text-slate-800 dark:text-slate-200 mb-5'>
          Dimension Breakdown
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5'>
          <DimensionBar
            label='Profile'
            score={result.profileScore}
            coaching={result.profileCoaching}
          />
          <DimensionBar
            label='Platform'
            score={result.platformScore}
            coaching={result.platformCoaching}
          />
          <DimensionBar
            label='Release Planning'
            score={result.releaseScore}
            coaching={result.releaseCoaching}
          />
          <DimensionBar
            label='Business Readiness'
            score={result.businessScore}
            coaching={result.businessCoaching}
          />
        </div>
      </div>

      {/* Top actions */}
      {Array.isArray(result.prioritizedActions) &&
        result.prioritizedActions.length > 0 && (
          <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 overflow-hidden'>
            <div className='px-6 py-4 border-b border-slate-100 dark:border-slate-700'>
              <h3 className='text-sm font-semibold text-slate-800 dark:text-slate-200'>
                Fix These First
              </h3>
              <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5'>
                Ranked by impact on your score and revenue
              </p>
            </div>
            <ul className='divide-y divide-slate-100 dark:divide-slate-700/60'>
              {(
                result.prioritizedActions as Array<{
                  id: string;
                  label: string;
                  description?: string;
                  effort?: string;
                  expectedImpact?: number;
                }>
              ).map((action, i) => {
                const effortColors: Record<string, string> = {
                  LOW: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
                  MEDIUM:
                    'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
                  HIGH: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
                };
                const effortClass =
                  effortColors[action.effort ?? 'MEDIUM'] ??
                  effortColors.MEDIUM;

                // Use personalised description/label when available
                const personalised = (
                  personalisedActions ?? result.personalisedActions
                )?.find(p => p.id === action.id);
                const displayLabel = personalised?.label ?? action.label;
                const displayDescription =
                  personalised?.description ?? action.description;

                return (
                  <li
                    key={action.id}
                    className='flex items-start gap-4 px-6 py-4'
                  >
                    <span className='flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center mt-0.5'>
                      {i + 1}
                    </span>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-semibold text-slate-800 dark:text-slate-200'>
                        {displayLabel}
                      </p>
                      {displayDescription && (
                        <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2'>
                          {displayDescription}
                        </p>
                      )}
                    </div>
                    <div className='flex flex-col items-end gap-1.5 flex-shrink-0'>
                      {action.effort && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${effortClass}`}
                        >
                          {action.effort}
                        </span>
                      )}
                      {action.expectedImpact !== undefined && (
                        <span className='text-[11px] text-slate-400 dark:text-slate-500'>
                          +{action.expectedImpact} pts
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      {/* Blocked revenue */}
      {Array.isArray(result.blockedRevenue) &&
        result.blockedRevenue.length > 0 && (
          <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-6'>
            <h3 className='text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1'>
              Blocked Revenue Streams
            </h3>
            <p className='text-xs text-slate-500 dark:text-slate-400 mb-4'>
              These income sources are not fully accessible yet
            </p>
            <ul className='space-y-3'>
              {(
                result.blockedRevenue as Array<{
                  revenueStreamId: string;
                  label: string;
                  completionPct: number;
                  blockedBy: string[];
                }>
              ).map(stream => (
                <li key={stream.revenueStreamId} className='space-y-1.5'>
                  <div className='flex items-center justify-between text-xs font-medium'>
                    <span className='flex items-center gap-1.5 text-slate-700 dark:text-slate-300'>
                      {stream.completionPct >= 80 ? (
                        <CheckCircleSolid className='w-3.5 h-3.5 text-emerald-500' />
                      ) : (
                        <ExclamationCircleIcon className='w-3.5 h-3.5 text-orange-400' />
                      )}
                      {stream.label}
                    </span>
                    <span className='text-slate-500 dark:text-slate-400'>
                      {stream.completionPct}% ready
                    </span>
                  </div>
                  <div className='h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden'>
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${stream.completionPct >= 80 ? 'bg-emerald-500' : 'bg-orange-400'}`}
                      style={{ width: `${stream.completionPct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      {result.overallScore >= 80 && (
        <div className='flex items-center gap-3 px-5 py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'>
          <CheckCircleIcon className='w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0' />
          <p className='text-sm text-emerald-700 dark:text-emerald-300 font-medium'>
            You are in great shape! Keep releasing consistently and pushing your
            platforms.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({
  onStart,
  onUpdateAnswers,
  error,
}: {
  onStart: () => void;
  onUpdateAnswers: () => void;
  error: string | null;
}) {
  return (
    <div className='flex flex-col items-center justify-center py-20 text-center'>
      <div className='w-20 h-20 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto mb-6'>
        <SparklesIcon className='w-10 h-10 text-white' />
      </div>
      <h2 className='text-2xl font-bold text-slate-900 dark:text-white mb-3'>
        Career Readiness Audit
      </h2>
      <p className='text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed'>
        Get a full analysis of your artist profile, platform presence, release
        planning, and business readiness — scored and prioritised so you know
        exactly what to fix first.
      </p>

      {error && (
        <div className='mb-6 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-2.5 rounded-xl'>
          <ExclamationCircleIcon className='w-4 h-4 flex-shrink-0' />
          {error}
        </div>
      )}

      <button
        onClick={onStart}
        className='inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-colors'
      >
        <SparklesIcon className='w-4 h-4' />
        Run My Audit
      </button>

      <button
        onClick={onUpdateAnswers}
        className='mt-4 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors underline underline-offset-2'
      >
        Update your artist profile answers
      </button>
    </div>
  );
}

// ── Initial fetch (show latest audit) ────────────────────────────────────────

function useLatestAudit() {
  const [latestResult, setLatestResult] = useState<DecisionEngineResult | null>(
    null
  );
  const [latestDate, setLatestDate] = useState<string | null>(null);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState<
    boolean | null
  >(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchLatest = useCallback(async () => {
    setInitialLoading(true);
    try {
      const res = await fetch('/api/ai/artist-audit');
      if (!res.ok) {
        setLatestResult(null);
        return;
      }
      const data = await res.json();

      if (data.profile) {
        setQuestionnaireCompleted(data.profile.questionnaireCompleted ?? false);
      }

      if (data.audit) {
        setLatestResult({
          id: data.decision?.id ?? '',
          auditId: data.audit.id,
          overallScore: data.audit.overallScore,
          tier: data.audit.tier as AuditTier,
          profileScore: data.audit.profileScore,
          platformScore: data.audit.platformScore,
          releaseScore: data.audit.releaseScore,
          businessScore: data.audit.businessScore,
          prioritizedActions: data.decision?.rankedActions ?? [],
          missingCapabilities: data.decision?.missingCapabilities ?? [],
          blockedRevenue: data.decision?.blockedRevenue ?? [],
          revenueUnlockPath: data.decision?.revenueUnlockPath ?? [],
          reasoning: data.decision?.reasoning ?? '',
          estimatedScoreIfCompleted: data.audit.overallScore,
          profileCoaching: data.decision?.profileCoaching ?? undefined,
          platformCoaching: data.decision?.platformCoaching ?? undefined,
          releaseCoaching: data.decision?.releaseCoaching ?? undefined,
          businessCoaching: data.decision?.businessCoaching ?? undefined,
          gapStory: data.decision?.gapStory ?? undefined,
          personalisedActions: data.decision?.personalisedActions ?? undefined,
        });
        setLatestDate(data.audit.createdAt);
      }
    } catch {
      // silently fail
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  const clearResult = useCallback(() => {
    setLatestResult(null);
    setLatestDate(null);
  }, []);

  return {
    latestResult,
    latestDate,
    initialLoading,
    questionnaireCompleted,
    clearResult,
  };
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CareerAuditTab() {
  const {
    latestResult,
    latestDate,
    initialLoading,
    questionnaireCompleted,
    clearResult,
  } = useLatestAudit();
  const stream = useAuditStream();
  // Local overrides
  const [questionnaireJustDone, setQuestionnaireJustDone] = useState(false);
  const [showQuestionnaireOverride, setShowQuestionnaireOverride] =
    useState(false);

  function handleReset() {
    clearResult();
    stream.reset();
    setQuestionnaireJustDone(false);
    setShowQuestionnaireOverride(false);
  }

  function handleRedoQuestionnaire() {
    setShowQuestionnaireOverride(true);
  }

  // Show questionnaire: first-time flow OR when user explicitly wants to redo it
  const showQuestionnaire =
    !initialLoading &&
    !questionnaireJustDone &&
    stream.status === 'idle' &&
    (showQuestionnaireOverride ||
      (questionnaireCompleted === false && !latestResult));

  // Determine what to show
  const isStreaming =
    stream.status === 'connecting' || stream.status === 'running';
  const streamDone = stream.status === 'complete';
  const streamError = stream.status === 'error';

  // If the stream finished successfully, show its result;
  // otherwise fall back to the pre-fetched latest result.
  const displayResult = streamDone ? stream.result : latestResult;
  const displayNarrative = streamDone
    ? stream.narrative
    : (latestResult?.reasoning ?? '');
  const displayGapStory = streamDone
    ? stream.gapStory
    : (latestResult?.gapStory ?? '');
  const displayPersonalisedActions = streamDone
    ? stream.personalisedActions
    : (latestResult?.personalisedActions ?? null);

  const formattedDate = latestDate
    ? new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(latestDate))
    : null;

  // ── Questionnaire (first-time flow) ────────────────────────────────────────
  if (showQuestionnaire) {
    return (
      <ArtistTypeQuestionnaire
        onCancel={
          // Only show Cancel if user manually triggered it (not first-time flow)
          showQuestionnaireOverride
            ? () => setShowQuestionnaireOverride(false)
            : undefined
        }
        onComplete={() => {
          setQuestionnaireJustDone(true);
          setShowQuestionnaireOverride(false);
          stream.startAudit();
        }}
      />
    );
  }

  // ── Initial loading skeleton ────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <div className='space-y-4 animate-pulse max-w-3xl'>
        <div className='h-32 rounded-2xl bg-slate-200 dark:bg-slate-700' />
        <div className='grid grid-cols-2 gap-4'>
          <div className='h-24 rounded-2xl bg-slate-200 dark:bg-slate-700' />
          <div className='h-24 rounded-2xl bg-slate-200 dark:bg-slate-700' />
        </div>
      </div>
    );
  }

  // ── Streaming pipeline view ─────────────────────────────────────────────────
  if (isStreaming || (streamDone && !displayResult)) {
    return (
      <div className='space-y-4 max-w-3xl'>
        {/* Pipeline header */}
        <div>
          <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
            Career Readiness Audit
          </h2>
          <p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1'>
            <ClockIcon className='w-3.5 h-3.5' />
            {stream.status === 'connecting'
              ? 'Starting audit…'
              : 'Audit running — this takes about 15 seconds'}
          </p>
        </div>

        {/* Phase legend */}
        <div className='flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400'>
          <span className='flex items-center gap-1.5'>
            <span className='w-2.5 h-2.5 rounded-full bg-rose-400' /> Not
            started
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='w-2.5 h-2.5 rounded-full bg-orange-400' /> Running
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='w-2.5 h-2.5 rounded-full bg-purple-400' /> Coaching
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='w-2.5 h-2.5 rounded-full bg-emerald-500' />{' '}
            Complete
          </span>
        </div>

        {/* Phase cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {PHASE_ORDER.map(phaseId => {
            const phase = stream.phases[phaseId];
            return (
              <PhaseCard
                key={phaseId}
                id={phaseId}
                label={phase.label}
                status={phase.status}
                score={phase.score}
                checks={phase.checks}
                coaching={phase.coaching}
              />
            );
          })}
        </div>

        {/* Decision engine / narrative card */}
        <DecisionCard
          started={stream.decisionStarted}
          gapStory={stream.gapStory}
          personalisedActions={stream.personalisedActions}
          narrative={stream.narrative}
        />
      </div>
    );
  }

  // ── Show result (from stream OR latest fetch) ───────────────────────────────
  if (displayResult) {
    return (
      <div className='space-y-5 max-w-3xl'>
        {/* Last run timestamp */}
        {formattedDate && !streamDone && (
          <p className='text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1'>
            <ClockIcon className='w-3.5 h-3.5' />
            Last run {formattedDate}
          </p>
        )}
        <ResultView
          result={displayResult}
          narrative={displayNarrative}
          gapStory={displayGapStory}
          personalisedActions={displayPersonalisedActions}
          onReRun={() => {
            stream.reset();
            stream.startAudit();
          }}
          onReset={handleReset}
          running={isStreaming}
        />
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  return (
    <EmptyState
      onStart={stream.startAudit}
      onUpdateAnswers={handleRedoQuestionnaire}
      error={streamError ? (stream.error ?? 'Something went wrong') : null}
    />
  );
}
