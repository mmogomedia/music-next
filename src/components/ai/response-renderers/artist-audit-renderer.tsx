'use client';

import type { ArtistAuditResponse } from '@/types/ai-responses';
import type { RankedAction, AuditTier } from '@/types/career-intelligence';
import { SuggestedActions } from './suggested-actions';

interface ArtistAuditRendererProps {
  response: ArtistAuditResponse;
  onAction?: (_action: any) => void;
}

// ── Tier Config ──────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<
  AuditTier,
  { label: string; color: string; bg: string; ring: string; dot: string }
> = {
  tour_ready: {
    label: 'Release Ready',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    ring: 'ring-emerald-500',
    dot: 'bg-emerald-500',
  },
  developing: {
    label: 'Developing',
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    ring: 'ring-yellow-500',
    dot: 'bg-yellow-500',
  },
  needs_work: {
    label: 'Needs Work',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    ring: 'ring-orange-500',
    dot: 'bg-orange-500',
  },
  just_starting: {
    label: 'Just Starting',
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    ring: 'ring-rose-500',
    dot: 'bg-rose-500',
  },
};

// ── Score Mini Bar ────────────────────────────────────────────────────────────

function ScorePill({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80
      ? 'bg-emerald-500'
      : score >= 60
        ? 'bg-yellow-500'
        : score >= 40
          ? 'bg-orange-500'
          : 'bg-rose-500';

  return (
    <div className='flex flex-col items-center gap-1 min-w-[64px]'>
      <span className='text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide'>
        {label}
      </span>
      <div className='relative w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700'>
        <div
          className={`absolute left-0 top-0 h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className='text-xs font-semibold text-slate-700 dark:text-slate-300'>
        {score}
      </span>
    </div>
  );
}

// ── Action Row ────────────────────────────────────────────────────────────────

function ActionRow({ action, rank }: { action: RankedAction; rank: number }) {
  const effortColor: Record<string, string> = {
    LOW: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
    MEDIUM:
      'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    HIGH: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
  };
  const effortClass = effortColor[action.effort] ?? effortColor.MEDIUM;

  return (
    <div className='flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0'>
      {/* Rank badge */}
      <span className='flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[11px] font-bold flex items-center justify-center mt-0.5'>
        {rank}
      </span>

      {/* Content */}
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug'>
          {action.label}
        </p>
        <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2'>
          {action.description}
        </p>
      </div>

      {/* Meta chips */}
      <div className='flex flex-col items-end gap-1 flex-shrink-0'>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${effortClass}`}
        >
          {action.effort}
        </span>
        <span className='text-[11px] text-slate-400 dark:text-slate-500'>
          +{action.expectedImpact} pts
        </span>
      </div>
    </div>
  );
}

// ── Main Renderer ─────────────────────────────────────────────────────────────

export function ArtistAuditRenderer({
  response,
  onAction,
}: ArtistAuditRendererProps) {
  const { data } = response;
  const tier = TIER_CONFIG[data.tier] ?? TIER_CONFIG.just_starting;

  const suggestedMessages = [
    'What should I focus on first?',
    'Explain my biggest gap',
    'Show me my blocked revenue streams',
    'Run my career audit again',
  ];

  return (
    <div className='rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 overflow-hidden shadow-sm max-w-lg'>
      {/* ── Header ── */}
      <div className='px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700/60'>
        <div className='flex items-center justify-between'>
          <span className='text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest'>
            Career Readiness Audit
          </span>
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tier.bg} ${tier.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
            {tier.label}
          </span>
        </div>

        {/* Score */}
        <div className='mt-3 flex items-end gap-2'>
          <span className='text-5xl font-black text-slate-900 dark:text-white leading-none'>
            {data.overallScore}
          </span>
          <span className='text-slate-400 dark:text-slate-500 text-lg font-medium mb-0.5'>
            / 100
          </span>
        </div>

        {/* Reasoning */}
        {data.reasoning && (
          <p className='mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed'>
            {data.reasoning}
          </p>
        )}
      </div>

      {/* ── Dimension Scores ── */}
      <div className='px-4 py-3 border-b border-slate-100 dark:border-slate-700/60'>
        <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3'>
          Breakdown
        </p>
        <div className='grid grid-cols-4 gap-2'>
          <ScorePill label='Profile' score={data.profileScore} />
          <ScorePill label='Platform' score={data.platformScore} />
          <ScorePill label='Release' score={data.releaseScore} />
          <ScorePill label='Business' score={data.businessScore} />
        </div>
      </div>

      {/* ── Top Actions ── */}
      {data.prioritizedActions.length > 0 && (
        <div className='px-4 py-3 border-b border-slate-100 dark:border-slate-700/60'>
          <p className='text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1'>
            Fix These First
          </p>
          <div>
            {data.prioritizedActions.slice(0, 5).map((action, i) => (
              <ActionRow key={action.id} action={action} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* ── Score Potential ── */}
      {data.estimatedScoreIfCompleted > data.overallScore && (
        <div className='px-4 py-2.5 bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/30'>
          <p className='text-xs text-purple-700 dark:text-purple-300'>
            Complete your top {data.prioritizedActions.slice(0, 5).length}{' '}
            actions → score could reach{' '}
            <span className='font-bold'>
              {data.estimatedScoreIfCompleted}/100
            </span>
          </p>
        </div>
      )}

      {/* ── Suggested Actions ── */}
      <div className='px-4 py-3'>
        <SuggestedActions
          suggestions={suggestedMessages.map(msg => ({
            label: msg,
            message: msg,
          }))}
          onAction={onAction}
        />
      </div>
    </div>
  );
}
