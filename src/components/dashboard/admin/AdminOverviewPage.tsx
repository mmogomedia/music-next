'use client';

import React, { useMemo } from 'react';
import {
  ExclamationTriangleIcon,
  PlusIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import StatCard from '@/components/ui/StatCard';
import FCard from '@/components/ui/FCard';
import AdminNavigation from './AdminNavigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────

type HealthStatus = 'healthy' | 'warning' | 'critical';

const HEALTH: Record<
  HealthStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  healthy: {
    label: 'Healthy',
    dot: 'bg-emerald-500 animate-pulse',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  warning: {
    label: 'Warning',
    dot: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  critical: {
    label: 'Critical',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
  },
};

const PRIORITY_CLASSES: Record<string, string> = {
  high: 'text-red-600 dark:text-red-400',
  medium: 'text-yellow-600 dark:text-yellow-500',
  low: 'text-emerald-600 dark:text-emerald-400',
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-emerald-400',
};

function actionHref(type: string): string {
  const routes: Record<string, string> = {
    submission: '/admin/dashboard/submissions',
    user: '/admin/dashboard/users',
    track: '/admin/dashboard/track-completion',
    playlist: '/admin/dashboard/playlists',
    content: '/admin/dashboard/content',
    article: '/admin/dashboard/content',
    timeline: '/admin/dashboard/timeline-posts',
  };
  const match = Object.keys(routes).find(k => type.toLowerCase().includes(k));
  return match ? routes[match] : '/admin/dashboard/overview';
}

// ── Shared primitives ──────────────────────────────────────────────────────

function SkeletonRows({ rows = 4, h = 'h-4' }: { rows?: number; h?: string }) {
  return (
    <div className='animate-pulse space-y-3'>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${h} bg-gray-100 dark:bg-slate-700 rounded`} />
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const router = useRouter();
  const { stats, loading, error, refetch } = useAdminDashboardStats();

  const systemMetrics = stats?.systemMetrics ?? {
    totalUsers: 0,
    totalArtists: 0,
    totalTracks: 0,
    totalPlays: 0,
    totalDownloads: 0,
    totalPageViews: 0,
    totalRevenue: 0,
    platformHealth: 'healthy' as HealthStatus,
  };

  const pendingActions = stats?.pendingActions ?? [];
  const health = HEALTH[systemMetrics.platformHealth];

  // ── Derived data ───────────────────────────────────────────────────────

  // Top tracks: aggregate play events by track
  const topTracks = useMemo(() => {
    const plays = stats?.recentActivity?.plays ?? [];
    const map = new Map<
      string,
      { id: string; title: string; artist: string; count: number }
    >();
    plays.forEach(({ track }) => {
      const existing = map.get(track.id);
      if (existing) {
        existing.count++;
      } else {
        map.set(track.id, { ...track, count: 1 });
      }
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [stats?.recentActivity?.plays]);

  // Activity sparkline: count play events per day (last 7 days)
  const activityByDay = useMemo(() => {
    const plays = stats?.recentActivity?.plays ?? [];
    const days: { label: string; key: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString('en-ZA', { weekday: 'narrow' }),
        key: d.toDateString(),
        count: 0,
      });
    }
    plays.forEach(({ timestamp }) => {
      const key = new Date(timestamp).toDateString();
      const slot = days.find(d => d.key === key);
      if (slot) slot.count++;
    });
    return days;
  }, [stats?.recentActivity?.plays]);

  const maxActivity = Math.max(...activityByDay.map(d => d.count), 1);

  // Submissions breakdown from pendingActions + totalSubmissions
  const submissionsAction = pendingActions.find(a =>
    a.type.toLowerCase().includes('submission')
  );
  const pendingCount = submissionsAction?.count ?? 0;
  const totalSubmissions = stats?.totalSubmissions ?? 0;
  const reviewedCount = Math.max(0, totalSubmissions - pendingCount);

  // Content health: high/medium priority pending actions as flags
  const healthFlags = pendingActions.filter(
    a => a.priority === 'high' || a.priority === 'medium'
  );

  // ── Page header ───────────────────────────────────────────────────────

  const today = new Date().toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const header = (
    <header className='bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-5 py-3.5'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-base font-semibold text-gray-900 dark:text-white'>
            Overview
          </h1>
          <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
            {today}
          </p>
        </div>
        <div className='flex items-center gap-2.5'>
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${health.bg} ${health.border} ${health.text}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${health.dot}`}
            />
            {health.label}
          </div>
          <button
            onClick={() =>
              router.push('/admin/dashboard/timeline-posts/create')
            }
            className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors'
          >
            <PlusIcon className='w-3.5 h-3.5' />
            <span className='hidden sm:inline'>New Post</span>
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <UnifiedLayout
      sidebar={<AdminNavigation systemHealth={systemMetrics.platformHealth} />}
      header={header}
    >
      <div className='min-h-full bg-gray-50 dark:bg-slate-950/50 p-4 sm:p-5 space-y-4'>
        {/* Error banner */}
        {error && (
          <div className='flex items-center justify-between gap-3 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-sm'>
            <div className='flex items-center gap-2 text-red-600 dark:text-red-400 text-xs'>
              <ExclamationTriangleIcon className='w-4 h-4 flex-shrink-0' />
              Failed to load dashboard data
            </div>
            <button
              onClick={refetch}
              className='text-xs font-medium text-red-600 dark:text-red-400 hover:underline flex-shrink-0'
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Stats: number-first, no decoration ─────────────────────── */}
        <FCard padding='none'>
          <div className='grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-6 divide-x divide-gray-100 dark:divide-slate-700 px-6 py-5'>
            <StatCard label='Users' value={systemMetrics.totalUsers} />
            <StatCard label='Artists' value={systemMetrics.totalArtists} />
            <StatCard label='Tracks' value={systemMetrics.totalTracks} />
            <StatCard label='Plays' value={systemMetrics.totalPlays} />
            <StatCard label='Playlists' value={stats?.totalPlaylists ?? 0} />
            <StatCard
              label='Submissions'
              value={stats?.totalSubmissions ?? 0}
            />
          </div>
        </FCard>

        {/* ── Row 1: Submissions queue + Top tracks ───────────────────── */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* Submissions queue */}
          <FCard
            title='Submissions Queue'
            action={
              <Link
                href='/admin/dashboard/submissions'
                className='text-xs text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium'
              >
                View all →
              </Link>
            }
          >
            {loading ? (
              <SkeletonRows rows={3} h='h-9' />
            ) : totalSubmissions === 0 ? (
              <p className='text-sm text-gray-400 dark:text-gray-500 py-3 text-center'>
                No submissions yet
              </p>
            ) : (
              <div className='divide-y divide-gray-100 dark:divide-slate-700/50'>
                {[
                  {
                    label: 'Pending review',
                    value: pendingCount,
                    dot: 'bg-yellow-400',
                  },
                  {
                    label: 'Reviewed',
                    value: reviewedCount,
                    dot: 'bg-emerald-400',
                  },
                  {
                    label: 'Total',
                    value: totalSubmissions,
                    dot: 'bg-gray-300 dark:bg-gray-600',
                  },
                ].map(({ label, value, dot }) => (
                  <div
                    key={label}
                    className='flex items-center justify-between py-3 first:pt-0 last:pb-0'
                  >
                    <div className='flex items-center gap-2.5'>
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`}
                      />
                      <span className='text-sm text-gray-600 dark:text-gray-300'>
                        {label}
                      </span>
                    </div>
                    <span className='text-sm font-semibold text-gray-900 dark:text-white tabular-nums'>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </FCard>

          {/* Top tracks */}
          <FCard
            title='Top Tracks This Week'
            action={
              <Link
                href='/admin/dashboard/analytics'
                className='text-xs text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium'
              >
                Analytics →
              </Link>
            }
          >
            {loading ? (
              <SkeletonRows rows={5} h='h-9' />
            ) : topTracks.length === 0 ? (
              <p className='text-sm text-gray-400 dark:text-gray-500 py-3 text-center'>
                No play data yet
              </p>
            ) : (
              <div className='divide-y divide-gray-100 dark:divide-slate-700/50'>
                {topTracks.map((track, i) => (
                  <div
                    key={track.id}
                    className='flex items-center gap-3 py-2.5 first:pt-0 last:pb-0'
                  >
                    <span
                      className={`text-xs font-bold w-4 flex-shrink-0 tabular-nums ${i === 0 ? 'text-primary-500 dark:text-primary-400' : 'text-gray-300 dark:text-gray-600'}`}
                    >
                      {i + 1}
                    </span>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                        {track.title}
                      </p>
                      <p className='text-xs text-gray-400 dark:text-gray-500 truncate'>
                        {track.artist}
                      </p>
                    </div>
                    <span className='text-xs text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0'>
                      {track.count} plays
                    </span>
                  </div>
                ))}
              </div>
            )}
          </FCard>
        </div>

        {/* ── Row 2: New users + Content health ───────────────────────── */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* New users / activity sparkline */}
          <FCard
            title='New Users'
            action={
              <Link
                href='/admin/dashboard/users'
                className='text-xs text-primary-500 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium'
              >
                Manage →
              </Link>
            }
          >
            {loading ? (
              <div className='space-y-4'>
                <SkeletonRows rows={1} h='h-10' />
                <SkeletonRows rows={1} h='h-14' />
                <SkeletonRows rows={1} h='h-4' />
              </div>
            ) : (
              <div className='space-y-5'>
                {/* Activity sparkline — bars and labels in separate rows */}
                <div>
                  <p className='text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2'>
                    Play activity · last 7 days
                  </p>
                  {/* Bar row */}
                  <div className='flex items-end gap-1.5 h-16'>
                    {activityByDay.map(({ count }, i) => {
                      const heightPx = Math.max(
                        3,
                        Math.round((count / maxActivity) * 64)
                      );
                      const isMax = count === maxActivity && count > 0;
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm ${isMax ? 'bg-blue-500 dark:bg-blue-400' : 'bg-blue-200 dark:bg-blue-900/60'}`}
                          style={{ height: `${heightPx}px` }}
                        />
                      );
                    })}
                  </div>
                  {/* Label row */}
                  <div className='flex gap-1.5 mt-1.5'>
                    {activityByDay.map(({ label }, i) => (
                      <span
                        key={i}
                        className='flex-1 text-center text-[9px] text-gray-400 dark:text-gray-500 font-medium'
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Artist conversion */}
                <div className='pt-1'>
                  <div className='flex items-center justify-between text-xs mb-2'>
                    <span className='text-gray-400 dark:text-gray-500'>
                      Artist conversion
                    </span>
                    <span className='font-semibold text-gray-700 dark:text-gray-300 tabular-nums'>
                      {systemMetrics.totalUsers > 0
                        ? `${((systemMetrics.totalArtists / systemMetrics.totalUsers) * 100).toFixed(1)}%`
                        : '—'}
                    </span>
                  </div>
                  <div className='h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all'
                      style={{
                        width: `${
                          systemMetrics.totalUsers > 0
                            ? Math.min(
                                100,
                                (systemMetrics.totalArtists /
                                  systemMetrics.totalUsers) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </FCard>

          {/* Content health */}
          <FCard title='Content Health'>
            {loading ? (
              <SkeletonRows rows={4} h='h-11' />
            ) : healthFlags.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-8 gap-2.5'>
                <CheckCircleIcon className='w-8 h-8 text-emerald-400' />
                <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
                  All clear
                </p>
                <p className='text-xs text-gray-400 dark:text-gray-500'>
                  No content issues detected
                </p>
              </div>
            ) : (
              <div className='divide-y divide-gray-100 dark:divide-slate-700/50'>
                {healthFlags.map(flag => (
                  <Link
                    key={flag.id}
                    href={actionHref(flag.type)}
                    className='flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80 transition-opacity group'
                  >
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[flag.priority] ?? 'bg-gray-300'}`}
                    />
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                        {flag.title}
                      </p>
                      <p className='text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5'>
                        {flag.description}
                      </p>
                    </div>
                    <div className='flex items-center gap-2 flex-shrink-0'>
                      <span
                        className={`text-xs font-semibold capitalize ${PRIORITY_CLASSES[flag.priority] ?? ''}`}
                      >
                        {flag.priority}
                      </span>
                      <span className='text-sm font-bold text-gray-900 dark:text-white tabular-nums'>
                        {flag.count}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </FCard>
        </div>

        {/* ── Row 3: Recent activity + Pending actions ─────────────────── */}
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-4'>
          {/* Activity feed */}
          <FCard
            className='lg:col-span-3'
            title='Recent Activity'
            action={
              <span className='flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
                Live
              </span>
            }
          >
            {loading ? (
              <div className='animate-pulse space-y-4'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className='flex gap-3'>
                    <div className='w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-700 flex-shrink-0' />
                    <div className='flex-1 space-y-1.5'>
                      <div className='h-3 bg-gray-100 dark:bg-slate-700 rounded w-3/4' />
                      <div className='h-2.5 bg-gray-100 dark:bg-slate-700 rounded w-1/2' />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <RecentActivity
                activity={stats?.recentActivity}
                useSSE={true}
                scope='admin'
                noCard={true}
                noHeader={true}
              />
            )}
          </FCard>

          {/* Pending actions */}
          <FCard
            className='lg:col-span-2'
            title='Pending Actions'
            action={
              !loading && pendingActions.length > 0 ? (
                <span className='inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[11px] font-bold text-white bg-rose-500 rounded-full tabular-nums'>
                  {pendingActions.reduce((s, a) => s + a.count, 0)}
                </span>
              ) : undefined
            }
          >
            {loading ? (
              <SkeletonRows rows={4} h='h-12' />
            ) : pendingActions.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-8 gap-2.5'>
                <CheckCircleIcon className='w-8 h-8 text-emerald-400' />
                <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
                  All clear
                </p>
                <p className='text-xs text-gray-400 dark:text-gray-500'>
                  No pending actions
                </p>
              </div>
            ) : (
              <div className='divide-y divide-gray-100 dark:divide-slate-700/50'>
                {pendingActions.map(action => (
                  <Link
                    key={action.id}
                    href={actionHref(action.type)}
                    className='flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80 transition-opacity'
                  >
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[action.priority] ?? 'bg-gray-300'}`}
                    />
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                        {action.title}
                      </p>
                      <p className='text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5'>
                        {action.description}
                      </p>
                    </div>
                    <div className='flex items-center gap-2.5 flex-shrink-0'>
                      <span
                        className={`text-xs font-semibold capitalize ${PRIORITY_CLASSES[action.priority] ?? ''}`}
                      >
                        {action.priority}
                      </span>
                      <span className='text-sm font-bold text-gray-900 dark:text-white tabular-nums min-w-[1rem] text-right'>
                        {action.count}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </FCard>
        </div>
      </div>
    </UnifiedLayout>
  );
}
