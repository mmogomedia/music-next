'use client';

/**
 * Career Audit Tab
 *
 * Dashboard tab that lets an artist run an on-demand career readiness audit.
 * Fetches the latest result on mount; shows an empty state + CTA if none exists.
 * "Run Audit" calls POST /api/ai/artist-audit and renders the result in-place.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import type {
  DecisionEngineResult,
  AuditTier,
} from '@/types/career-intelligence';

// ── Tier config ───────────────────────────────────────────────────────────────

const TIER: Record<
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-rose-500';
}

function DimensionBar({ label, score }: { label: string; score: number }) {
  return (
    <div className='space-y-1'>
      <div className='flex justify-between text-xs font-medium'>
        <span className='text-slate-600 dark:text-slate-400'>{label}</span>
        <span className='text-slate-800 dark:text-slate-200'>{score}</span>
      </div>
      <div className='h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden'>
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CareerAuditTab() {
  const [result, setResult] = useState<DecisionEngineResult | null>(null);
  const [auditDate, setAuditDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // initial fetch
  const [running, setRunning] = useState(false); // audit in progress
  const [error, setError] = useState<string | null>(null);

  // Fetch latest audit on mount
  const fetchLatest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/artist-audit');
      if (!res.ok) {
        if (res.status === 404) {
          setResult(null);
          return;
        }
        throw new Error('Failed to load audit');
      }
      const data = await res.json();
      if (data.audit) {
        // Merge audit scores into the decision shape for display
        setResult({
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
        });
        setAuditDate(data.audit.createdAt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  // Run a fresh audit
  const runAudit = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/artist-audit', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Audit failed');
      }
      const data: DecisionEngineResult = await res.json();
      setResult(data);
      setAuditDate(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setRunning(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className='space-y-4 animate-pulse'>
        <div className='h-32 rounded-2xl bg-slate-200 dark:bg-slate-700' />
        <div className='grid grid-cols-2 gap-4'>
          <div className='h-24 rounded-2xl bg-slate-200 dark:bg-slate-700' />
          <div className='h-24 rounded-2xl bg-slate-200 dark:bg-slate-700' />
        </div>
      </div>
    );
  }

  // ── Empty state (no audit yet) ─────────────────────────────────────────────

  if (!result) {
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
          onClick={runAudit}
          disabled={running}
          className='inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors'
        >
          {running ? (
            <>
              <ArrowPathIcon className='w-4 h-4 animate-spin' />
              Running audit…
            </>
          ) : (
            <>
              <SparklesIcon className='w-4 h-4' />
              Run My Audit
            </>
          )}
        </button>

        {running && (
          <p className='mt-4 text-xs text-slate-400 dark:text-slate-500'>
            Analysing your profile, platforms, releases, and business setup…
          </p>
        )}
      </div>
    );
  }

  // ── Result view ────────────────────────────────────────────────────────────

  const tier = TIER[result.tier] ?? TIER.just_starting;
  const formattedDate = auditDate
    ? new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(auditDate))
    : null;

  return (
    <div className='space-y-5 max-w-3xl'>
      {/* ── Header row ── */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
            Career Readiness Audit
          </h2>
          {formattedDate && (
            <p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1'>
              <ClockIcon className='w-3.5 h-3.5' />
              Last run {formattedDate}
            </p>
          )}
        </div>
        <button
          onClick={runAudit}
          disabled={running}
          className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50 text-purple-700 dark:text-purple-300 font-medium text-sm transition-colors'
        >
          {running ? (
            <>
              <ArrowPathIcon className='w-3.5 h-3.5 animate-spin' />
              Running…
            </>
          ) : (
            <>
              <ArrowPathIcon className='w-3.5 h-3.5' />
              Re-run Audit
            </>
          )}
        </button>
      </div>

      {error && (
        <div className='flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-2.5 rounded-xl'>
          <ExclamationCircleIcon className='w-4 h-4 flex-shrink-0' />
          {error}
        </div>
      )}

      {/* ── Score hero card ── */}
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

        {result.reasoning && (
          <p className='text-sm text-slate-600 dark:text-slate-400 leading-relaxed'>
            {result.reasoning}
          </p>
        )}

        {result.estimatedScoreIfCompleted > result.overallScore && (
          <div className='mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-3 py-1.5 rounded-full'>
            <BoltIcon className='w-3.5 h-3.5' />
            Complete top actions → reach {result.estimatedScoreIfCompleted}/100
          </div>
        )}
      </div>

      {/* ── Dimension breakdown ── */}
      <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-6'>
        <h3 className='text-sm font-semibold text-slate-800 dark:text-slate-200 mb-5'>
          Dimension Breakdown
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5'>
          <DimensionBar label='Profile' score={result.profileScore} />
          <DimensionBar label='Platform' score={result.platformScore} />
          <DimensionBar label='Release Planning' score={result.releaseScore} />
          <DimensionBar
            label='Business Readiness'
            score={result.businessScore}
          />
        </div>
      </div>

      {/* ── Top actions ── */}
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
                    'text-yellow-600  dark:text-yellow-400  bg-yellow-50  dark:bg-yellow-900/20',
                  HIGH: 'text-rose-600    dark:text-rose-400    bg-rose-50    dark:bg-rose-900/20',
                };
                const effortClass =
                  effortColors[action.effort ?? 'MEDIUM'] ??
                  effortColors.MEDIUM;

                return (
                  <li
                    key={action.id}
                    className='flex items-start gap-4 px-6 py-4'
                  >
                    {/* Rank */}
                    <span className='flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center mt-0.5'>
                      {i + 1}
                    </span>

                    {/* Body */}
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-semibold text-slate-800 dark:text-slate-200'>
                        {action.label}
                      </p>
                      {action.description && (
                        <p className='text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2'>
                          {action.description}
                        </p>
                      )}
                    </div>

                    {/* Meta */}
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

      {/* ── Missing capabilities summary ── */}
      {Array.isArray(result.missingCapabilities) &&
        result.missingCapabilities.length > 0 && (
          <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-6'>
            <h3 className='text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4'>
              Capability Gaps
            </h3>
            <div className='flex flex-wrap gap-2'>
              {(
                result.missingCapabilities as Array<{
                  id: string;
                  label: string;
                  category?: string;
                }>
              ).map(cap => (
                <span
                  key={cap.id}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-xs font-medium text-slate-700 dark:text-slate-300'
                >
                  <ExclamationCircleIcon className='w-3 h-3 text-orange-500' />
                  {cap.label}
                </span>
              ))}
            </div>
          </div>
        )}

      {/* ── Blocked revenue ── */}
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
                      className={`h-full rounded-full ${stream.completionPct >= 80 ? 'bg-emerald-500' : 'bg-orange-400'} transition-all duration-700`}
                      style={{ width: `${stream.completionPct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* ── All checks passed callout ── */}
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
