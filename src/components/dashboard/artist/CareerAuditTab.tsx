'use client';

/**
 * CareerAuditTab — streaming agentic pipeline view
 *
 * Shows live progress as each audit phase runs:
 *   • Not started  → no ring + idle icon (opacity reduced)
 *   • Running      → purple ring + animated spinner
 *   • Complete     → indigo ring + check icon
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
  BoltIcon,
  IdentificationIcon,
  GlobeAltIcon,
  MusicalNoteIcon,
  BriefcaseIcon,
  CpuChipIcon,
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
    bg: 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/40',
    bar: 'bg-emerald-400',
    dot: 'bg-emerald-400',
  },
  developing: {
    label: 'Developing',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/60 dark:border-blue-800/40',
    bar: 'bg-blue-400',
    dot: 'bg-blue-400',
  },
  needs_work: {
    label: 'Needs Work',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/40',
    bar: 'bg-amber-400',
    dot: 'bg-amber-400',
  },
  just_starting: {
    label: 'Just Starting',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-300/60 dark:border-rose-800/40',
    bar: 'bg-rose-300',
    dot: 'bg-rose-300',
  },
};

// ── Phase icon map ─────────────────────────────────────────────────────────────

const PHASE_ICONS: Record<
  AuditDimension,
  ComponentType<{ className?: string }>
> = {
  profile: IdentificationIcon,
  platform: GlobeAltIcon,
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
      return '';
    case 'running':
      return 'ring-2 ring-blue-400 dark:ring-blue-500 animate-pulse';
    case 'coaching':
      return 'ring-2 ring-blue-300 dark:ring-blue-600 animate-pulse';
    case 'complete':
      return 'ring-1 ring-emerald-300 dark:ring-emerald-800';
  }
}

function phaseIconBgClass(status: PhaseStatus): string {
  switch (status) {
    case 'idle':
      return 'bg-slate-100 dark:bg-slate-800';
    case 'running':
      return 'bg-blue-50 dark:bg-blue-900/20';
    case 'coaching':
      return 'bg-blue-50 dark:bg-blue-900/20';
    case 'complete':
      return 'bg-emerald-50 dark:bg-emerald-900/20';
  }
}

function phaseIconColorClass(status: PhaseStatus): string {
  switch (status) {
    case 'idle':
      return 'text-slate-400 dark:text-slate-600';
    case 'running':
      return 'text-blue-500 dark:text-blue-400';
    case 'coaching':
      return 'text-blue-500 dark:text-blue-400';
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
      return 'Synthesising…';
    case 'complete':
      return 'Complete';
  }
}

function statusTextClass(status: PhaseStatus): string {
  switch (status) {
    case 'idle':
      return 'text-slate-400 dark:text-slate-500';
    case 'running':
      return 'text-blue-600 dark:text-blue-400';
    case 'coaching':
      return 'text-blue-500 dark:text-blue-400';
    case 'complete':
      return 'text-emerald-600 dark:text-emerald-400';
  }
}

// ── Helper: score bar colour ───────────────────────────────────────────────────

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 50) return 'bg-blue-400';
  return 'bg-rose-300';
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

function PhaseCard({
  id,
  label,
  status,
  score,
  checks,
  coaching,
}: PhaseCardProps) {
  const Icon = PHASE_ICONS[id] ?? SparklesIcon;
  const passedCount = checks.filter(c => c.passed).length;
  const failedCount = checks.filter(c => !c.passed).length;

  return (
    <div
      className={clsx(
        'rounded-2xl border p-4 transition-all duration-300',
        status === 'idle' &&
          'border-slate-100 dark:border-slate-800/60 opacity-40',
        status === 'running' &&
          'border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-900/5',
        status === 'coaching' &&
          'border-blue-100 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-900/5',
        status === 'complete' &&
          'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 shadow-sm'
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
            {status === 'running' && checks.length === 0
              ? 'Azure OpenAI evaluating checks…'
              : status === 'running'
                ? `${checks.length} check${checks.length !== 1 ? 's' : ''} received…`
                : statusLabel(status)}
            {status === 'complete' &&
              score !== null &&
              ` · ${Math.round(score)}/100`}
          </p>
        </div>

        {(status === 'complete' || status === 'coaching') && score !== null && (
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
                      ? 'stroke-emerald-400'
                      : score >= 50
                        ? 'stroke-blue-400'
                        : 'stroke-rose-300'
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

      {/* Scrollable body — grows to max-h then scrolls */}
      <div className='max-h-[260px] overflow-y-auto'>
        {/* Activity indicator while waiting for first check */}
        {status === 'running' && checks.length === 0 && (
          <div className='mt-2 mb-1'>
            <div className='flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium'>
              <span className='flex gap-0.5'>
                <span
                  className='w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce'
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className='w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce'
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className='w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce'
                  style={{ animationDelay: '300ms' }}
                />
              </span>
              Querying Azure OpenAI for {label.toLowerCase()} checks
            </div>
            <div className='space-y-2 mt-2.5 animate-pulse'>
              {[80, 65, 75].map((w, n) => (
                <div
                  key={n}
                  className='h-2.5 rounded-full bg-slate-100 dark:bg-slate-700'
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Checks list — streams in one by one as Azure OpenAI returns results */}
        {checks.length > 0 && (
          <>
            {/* Pass/fail summary pill — visible once checks start arriving */}
            {status !== 'idle' && checks.length > 2 && (
              <div className='flex items-center gap-2 mb-2.5'>
                <span className='inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'>
                  <CheckCircleSolid className='w-3 h-3' /> {passedCount} passed
                </span>
                {failedCount > 0 && (
                  <span className='inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50/70 dark:bg-rose-900/10 text-rose-400 dark:text-rose-400'>
                    <XCircleSolid className='w-3 h-3' /> {failedCount} failed
                  </span>
                )}
              </div>
            )}
            <ul className='space-y-2 pl-0.5'>
              {checks.map((check, i) => (
                <li key={check.checkId} className='flex items-start gap-2'>
                  {check.passed ? (
                    <CheckCircleSolid className='w-3 h-3 text-emerald-400 dark:text-emerald-500 flex-shrink-0 mt-0.5' />
                  ) : (
                    <XCircleSolid className='w-3 h-3 text-rose-300 dark:text-rose-400/70 flex-shrink-0 mt-0.5' />
                  )}
                  <div className='min-w-0 flex-1'>
                    <p
                      className={clsx(
                        'text-xs font-medium leading-tight',
                        check.passed
                          ? 'text-slate-600 dark:text-slate-400'
                          : 'text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {check.label}
                      {/* Streaming cursor on the last check while running */}
                      {status === 'running' && i === checks.length - 1 && (
                        <span className='inline-block w-0.5 h-[0.85em] bg-blue-400 ml-0.5 align-middle animate-pulse' />
                      )}
                    </p>
                    {check.details && (
                      <p
                        className={clsx(
                          'text-[11px] leading-relaxed mt-0.5',
                          check.passed
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-500 dark:text-slate-400'
                        )}
                      >
                        {check.details}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Coaching blurb — appears after checks, types out during 'coaching' status */}
        {(status === 'coaching' || coaching) && (
          <div className='mt-3 pl-3 border-l-2 border-blue-300 dark:border-blue-700'>
            {coaching ? (
              <p className='text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic'>
                {coaching}
                {status === 'coaching' && (
                  <span className='inline-block w-0.5 h-[1em] bg-blue-400 ml-0.5 align-middle animate-pulse' />
                )}
              </p>
            ) : (
              <div className='space-y-1.5 animate-pulse'>
                <div className='h-2 rounded-full bg-slate-200 dark:bg-slate-700 w-full' />
                <div className='h-2 rounded-full bg-slate-200 dark:bg-slate-700 w-4/5' />
              </div>
            )}
          </div>
        )}
      </div>
      {/* end scrollable body */}
    </div>
  );
}

// ── Decision engine card ───────────────────────────────────────────────────────

function DecisionCard({
  started,
  gapStory,
  personalisedActions,
  narrative,
  phases,
  continueClicked,
  onContinue,
}: {
  started: boolean;
  gapStory: string;
  personalisedActions: PersonalisedAction[] | null;
  narrative: string;
  phases: Record<AuditDimension, import('@/hooks/useAuditStream').PhaseState>;
  continueClicked: boolean;
  onContinue: () => void;
}) {
  const phaseList = Object.values(phases);
  const runningCount = phaseList.filter(
    p => p.status === 'running' || p.status === 'coaching'
  ).length;
  const completedCount = phaseList.filter(p => p.status === 'complete').length;
  const allPhasesComplete = phaseList.every(p => p.status === 'complete');
  const waitingForPhases = !allPhasesComplete && runningCount > 0;
  const showContinueButton = allPhasesComplete && !continueClicked;
  const isActive = continueClicked && (gapStory || narrative);

  // Border / bg
  const containerClass = clsx(
    'rounded-xl border p-4 transition-all duration-300',
    !waitingForPhases && !showContinueButton && !continueClicked
      ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 opacity-50'
      : waitingForPhases
        ? 'border-blue-200 dark:border-blue-800/60 bg-white dark:bg-slate-800/80'
        : showContinueButton
          ? 'border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-900/5'
          : isActive
            ? 'border-blue-100 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-900/5'
            : 'border-blue-100 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-900/5'
  );

  // Icon ring / bg
  const iconWrapClass = clsx(
    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
    !waitingForPhases && !showContinueButton && !continueClicked
      ? 'bg-slate-100 dark:bg-slate-700 ring-2 ring-slate-300 dark:ring-slate-600'
      : waitingForPhases
        ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-400 dark:ring-blue-500 animate-pulse'
        : showContinueButton
          ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-400 dark:ring-emerald-500'
          : isActive
            ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-700 animate-pulse'
            : 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-700 animate-pulse'
  );

  const iconColorClass = clsx(
    'w-4.5 h-4.5',
    !waitingForPhases && !showContinueButton && !continueClicked
      ? 'text-slate-400 dark:text-slate-500'
      : waitingForPhases
        ? 'text-blue-600 dark:text-blue-400'
        : showContinueButton
          ? 'text-emerald-600 dark:text-emerald-400'
          : isActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-violet-600 dark:text-violet-400'
  );

  const statusTextColorClass = clsx(
    'text-xs font-medium',
    !waitingForPhases && !showContinueButton && !continueClicked
      ? 'text-slate-400 dark:text-slate-500'
      : waitingForPhases
        ? 'text-blue-600 dark:text-blue-400'
        : showContinueButton
          ? 'text-emerald-600 dark:text-emerald-400'
          : isActive
            ? 'text-blue-500 dark:text-blue-400'
            : 'text-blue-500 dark:text-blue-400'
  );

  const statusText =
    !waitingForPhases && !showContinueButton && !continueClicked
      ? 'Waiting for dimension agents…'
      : waitingForPhases
        ? `Running ${runningCount} agent${runningCount !== 1 ? 's' : ''} in parallel… (${completedCount}/4 done)`
        : showContinueButton
          ? 'All 4 agents complete — ready for deep analysis'
          : narrative
            ? 'Analysis complete'
            : personalisedActions
              ? 'Writing narrative…'
              : gapStory
                ? 'Personalising your actions…'
                : 'Building gap analysis…';

  return (
    <div className={containerClass}>
      {/* Header row */}
      <div className='flex items-center gap-3 mb-2'>
        <div className={iconWrapClass}>
          <CpuChipIcon className={iconColorClass} />
        </div>

        <div className='flex-1 min-w-0'>
          <p className='text-sm font-semibold text-slate-800 dark:text-slate-200'>
            Career Intelligence
          </p>
          <p className={statusTextColorClass}>{statusText}</p>
        </div>

        {/* Live phase dots — visible while agents running or all done */}
        {(waitingForPhases || showContinueButton) && (
          <div className='flex items-center gap-1.5 flex-shrink-0'>
            {PHASE_ORDER.map(phaseId => {
              const p = phases[phaseId];
              return (
                <span
                  key={phaseId}
                  className={clsx(
                    'w-2 h-2 rounded-full transition-colors duration-300',
                    p.status === 'idle' && 'bg-slate-300 dark:bg-slate-600',
                    p.status === 'running' && 'bg-blue-400 animate-pulse',
                    p.status === 'coaching' && 'bg-blue-300 animate-pulse',
                    p.status === 'complete' && 'bg-emerald-400'
                  )}
                  title={`${p.label}: ${p.status}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Waiting: animated skeleton */}
      {waitingForPhases && (
        <div className='space-y-2 mt-2 animate-pulse'>
          <div className='h-2.5 rounded-full bg-blue-100 dark:bg-blue-900/20 w-3/4' />
          <div className='h-2.5 rounded-full bg-blue-100 dark:bg-blue-900/20 w-1/2' />
        </div>
      )}

      {/* ── All agents done — Continue to Analysis button ─────────────────── */}
      {showContinueButton && (
        <div className='mt-3'>
          <p className='text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed'>
            All 4 dimension agents finished. Click below to run the deep career
            intelligence analysis and get your personalised action plan.
          </p>
          <button
            onClick={onContinue}
            className='w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors'
          >
            <SparklesIcon className='w-4 h-4' />
            View Full Analysis
            <svg
              className='w-4 h-4 ml-auto'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M13 7l5 5m0 0l-5 5m5-5H6'
              />
            </svg>
          </button>
        </div>
      )}

      {/* ── Decision engine output (gated behind Continue click) ──────────── */}
      {continueClicked && (
        <>
          {started && !gapStory && !narrative && (
            <div className='space-y-2 mt-2 animate-pulse'>
              <div className='h-3 rounded-full bg-slate-100 dark:bg-slate-700 w-4/5' />
              <div className='h-3 rounded-full bg-slate-100 dark:bg-slate-700 w-3/5' />
            </div>
          )}

          {gapStory && (
            <div className='mt-2 mb-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 px-3 py-2.5'>
              <p className='text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium'>
                {gapStory}
                {!personalisedActions && (
                  <span className='inline-block w-0.5 h-[1em] bg-blue-400 ml-0.5 align-middle animate-pulse' />
                )}
              </p>
            </div>
          )}

          {gapStory && !personalisedActions && !narrative && (
            <div className='flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 animate-pulse'>
              <ArrowPathIcon className='w-3.5 h-3.5 animate-spin' />
              Personalising your top actions…
            </div>
          )}

          {narrative && (
            <p className='text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-1'>
              {narrative}
              <span className='inline-block w-0.5 h-[1em] bg-blue-500 ml-0.5 align-middle animate-pulse' />
            </p>
          )}
        </>
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
  resetting,
}: {
  result: DecisionEngineResult;
  narrative: string;
  gapStory: string;
  personalisedActions: PersonalisedAction[] | null;
  onReRun: () => void;
  onReset: () => void;
  running: boolean;
  resetting: boolean;
}) {
  const tier = TIER_META[result.tier] ?? TIER_META.just_starting;

  return (
    <div className='w-full'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
          Career Readiness Audit
        </h2>
        <div className='flex items-center gap-2'>
          <button
            onClick={onReset}
            disabled={running || resetting}
            title='Clear results and start fresh'
            className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-500 dark:text-slate-400 font-medium text-sm transition-colors'
          >
            <ArrowPathIcon
              className={clsx('w-3.5 h-3.5', resetting && 'animate-spin')}
            />
            {resetting ? 'Resetting…' : 'Reset'}
          </button>
          <button
            onClick={onReRun}
            disabled={running}
            className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 text-blue-700 dark:text-blue-300 font-medium text-sm transition-colors'
          >
            <ArrowPathIcon
              className={clsx('w-3.5 h-3.5', running && 'animate-spin')}
            />
            {running ? 'Running…' : 'Re-run Audit'}
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div className='mt-5 grid grid-cols-1 lg:grid-cols-5 gap-5'>
        {/* LEFT: score hero + actions + blocked revenue */}
        <div className='lg:col-span-3 space-y-4'>
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

            {narrative && (
              <p className='text-sm text-slate-600 dark:text-slate-400 leading-relaxed'>
                {narrative}
              </p>
            )}

            {result.estimatedScoreIfCompleted > result.overallScore && (
              <div className='mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-full'>
                <BoltIcon className='w-3.5 h-3.5' />
                Complete top actions → reach {result.estimatedScoreIfCompleted}
                /100
              </div>
            )}
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
                        'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
                      HIGH: 'text-rose-500 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-900/10',
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
                        <span className='flex-shrink-0 w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5'>
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
                            <CheckCircleSolid className='w-3.5 h-3.5 text-emerald-400' />
                          ) : (
                            <XCircleSolid className='w-3.5 h-3.5 text-rose-300 dark:text-rose-400/70' />
                          )}
                          {stream.label}
                        </span>
                        <span className='text-slate-500 dark:text-slate-400'>
                          {stream.completionPct}% ready
                        </span>
                      </div>
                      <div className='h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden'>
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${stream.completionPct >= 80 ? 'bg-emerald-400' : 'bg-blue-300'}`}
                          style={{ width: `${stream.completionPct}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {result.overallScore >= 80 && (
            <div className='flex items-center gap-3 px-5 py-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/40'>
              <CheckCircleIcon className='w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0' />
              <p className='text-sm text-emerald-700 dark:text-emerald-300 font-medium'>
                You are in great shape! Keep releasing consistently and pushing
                your platforms.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: dimension breakdown */}
        <div className='lg:col-span-2 space-y-4'>
          {/* Dimension bars card */}
          <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-6'>
            <h3 className='text-sm font-semibold text-slate-800 dark:text-slate-200 mb-5'>
              Dimension Breakdown
            </h3>
            <div className='grid grid-cols-1 gap-y-5'>
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

          {/* Gap story callout */}
          {(gapStory || result.gapStory) && (
            <div className='rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 px-4 py-3'>
              <p className='text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium'>
                {gapStory || result.gapStory}
              </p>
            </div>
          )}
        </div>
      </div>
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
    <div className='flex flex-col items-center justify-center min-h-[60vh] text-center px-4'>
      <div className='w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6'>
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
          <XCircleSolid className='w-4 h-4 flex-shrink-0' />
          {error}
        </div>
      )}

      <button
        onClick={onStart}
        className='inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors'
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
  // Gating: user must click "View Full Analysis" after all 4 agents finish
  const [continueClicked, setContinueClicked] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    setResetting(true);
    try {
      await fetch('/api/ai/artist-audit', { method: 'DELETE' });
    } catch {
      // best-effort — clear UI regardless
    } finally {
      setResetting(false);
    }
    clearResult();
    stream.reset();
    setQuestionnaireJustDone(false);
    setShowQuestionnaireOverride(false);
    setContinueClicked(false);
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
      <div className='space-y-4 animate-pulse w-full'>
        <div className='h-32 rounded-2xl bg-slate-200 dark:bg-slate-700' />
        <div className='grid grid-cols-2 gap-4'>
          <div className='h-24 rounded-2xl bg-slate-200 dark:bg-slate-700' />
          <div className='h-24 rounded-2xl bg-slate-200 dark:bg-slate-700' />
        </div>
      </div>
    );
  }

  // ── Streaming pipeline view ─────────────────────────────────────────────────
  // Stay in pipeline view until the user explicitly clicks "View Full Analysis"
  if (isStreaming || (streamDone && !continueClicked)) {
    return (
      <div className='space-y-4 w-full'>
        {/* Pipeline header + legend in same row */}
        <div className='flex items-start justify-between'>
          <div>
            <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
              Career Readiness Audit
            </h2>
            <p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5'>
              {stream.status === 'connecting'
                ? 'Starting audit…'
                : 'Audit running · this takes about 15 seconds'}
            </p>
          </div>

          {/* Legend inline */}
          <div className='flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500'>
            <span className='flex items-center gap-1.5'>
              <span className='w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600' />
              Idle
            </span>
            <span className='flex items-center gap-1.5'>
              <span className='w-2 h-2 rounded-full bg-blue-400 animate-pulse' />
              Running
            </span>
            <span className='flex items-center gap-1.5'>
              <span className='w-2 h-2 rounded-full bg-emerald-400' />
              Done
            </span>
          </div>
        </div>

        {/* Career Intelligence card — at the top so the orchestrator is always visible */}
        <DecisionCard
          started={stream.decisionStarted}
          gapStory={stream.gapStory}
          personalisedActions={stream.personalisedActions}
          narrative={stream.narrative}
          phases={stream.phases}
          continueClicked={continueClicked}
          onContinue={() => setContinueClicked(true)}
        />

        {/* Phase cards — 2-column grid below the orchestrator */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
      </div>
    );
  }

  // ── Show result (from stream OR latest fetch) ───────────────────────────────
  if (displayResult) {
    return (
      <div className='w-full'>
        {/* Last run timestamp */}
        {formattedDate && !streamDone && (
          <p className='text-xs text-slate-400 dark:text-slate-500 mb-2'>
            Last run · {formattedDate}
          </p>
        )}
        <ResultView
          result={displayResult}
          narrative={displayNarrative}
          gapStory={displayGapStory}
          personalisedActions={displayPersonalisedActions}
          onReRun={() => {
            setContinueClicked(false);
            stream.reset();
            stream.startAudit();
          }}
          onReset={handleReset}
          running={isStreaming}
          resetting={resetting}
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
