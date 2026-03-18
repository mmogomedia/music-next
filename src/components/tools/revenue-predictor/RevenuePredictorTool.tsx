'use client';

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  BookmarkIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ToolShell } from '@/components/tools/ToolShell';

// ─── Platform Icons ───────────────────────────────────────────────────────────

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 24 24' className={className} aria-hidden>
      <circle cx='12' cy='12' r='12' fill='#1DB954' />
      <path
        fill='white'
        d='M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15C9.3 6.9 15.15 7.1 18.85 9.3c.45.25.6.85.35 1.3-.25.35-.85.5-1.3.25zm-.1 2.8c-.25.35-.7.5-1.05.25-2.7-1.65-6.8-2.15-9.95-1.15-.4.1-.85-.1-.95-.5-.1-.4.1-.85.5-.95 3.65-1.1 8.15-.55 11.25 1.35.3.15.45.65.2 1zm-1.2 2.75c-.2.3-.55.4-.85.2-2.35-1.45-5.3-1.75-8.8-.95-.35.1-.65-.15-.75-.45-.1-.35.15-.65.45-.75 3.8-.85 7.1-.5 9.7 1.1.3.15.4.55.25.85z'
      />
    </svg>
  );
}

function AppleMusicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 24 24' className={className} aria-hidden>
      <defs>
        <linearGradient id='amGrad' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stopColor='#FC5C7D' />
          <stop offset='100%' stopColor='#E5002B' />
        </linearGradient>
      </defs>
      <rect width='24' height='24' rx='5.5' fill='url(#amGrad)' />
      <path
        fill='white'
        d='M16 7h-5v7.5A2.5 2.5 0 1013 17V9h3V7zM10.5 18a1.5 1.5 0 110-3 1.5 1.5 0 010 3z'
      />
    </svg>
  );
}

function YouTubeMusicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 24 24' className={className} aria-hidden>
      <circle cx='12' cy='12' r='12' fill='#FF0000' />
      <path fill='white' d='M9.5 7.5v9l7-4.5-7-4.5z' />
      <circle cx='15.5' cy='8.5' r='1' fill='white' opacity='0.8' />
    </svg>
  );
}

function TidalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 24 24' className={className} aria-hidden>
      <rect width='24' height='24' rx='4' fill='#000000' />
      <g fill='white'>
        <polygon points='5.5,8 8,11.5 10.5,8' />
        <polygon points='9.5,8 12,11.5 14.5,8' />
        <polygon points='13.5,8 16,11.5 18.5,8' />
        <polygon points='7.5,12 10,15.5 12.5,12' />
        <polygon points='11.5,12 14,15.5 16.5,12' />
      </g>
    </svg>
  );
}

function DeezerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 24 24' className={className} aria-hidden>
      <rect width='24' height='24' rx='4' fill='#A238FF' />
      <g>
        <rect x='4' y='10' width='2.5' height='6' rx='1' fill='#FF6F00' />
        <rect x='7.5' y='8' width='2.5' height='8' rx='1' fill='#FFD700' />
        <rect x='11' y='5' width='2.5' height='11' rx='1' fill='white' />
        <rect x='14.5' y='8' width='2.5' height='8' rx='1' fill='#00C7FF' />
        <rect x='18' y='10' width='2.5' height='6' rx='1' fill='#00E676' />
      </g>
    </svg>
  );
}

// ─── Types & constants ────────────────────────────────────────────────────────

interface Platform {
  id: string;
  name: string;
  icon: React.FC<{ className?: string }>;
  ratePerStream: number;
  barColor: string;
}

interface Collaborator {
  id: string;
  name: string;
  role: string;
  percentage: number;
}

interface SplitSheetPreview {
  id: string;
  name: string;
  songTitle: string;
  masterSplits: Collaborator[];
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const PLATFORMS: Platform[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    icon: SpotifyIcon,
    ratePerStream: 0.004,
    barColor: 'from-emerald-400 to-emerald-600',
  },
  {
    id: 'apple',
    name: 'Apple Music',
    icon: AppleMusicIcon,
    ratePerStream: 0.01,
    barColor: 'from-rose-400 to-red-600',
  },
  {
    id: 'youtube',
    name: 'YouTube Music',
    icon: YouTubeMusicIcon,
    ratePerStream: 0.002,
    barColor: 'from-red-400 to-red-600',
  },
  {
    id: 'tidal',
    name: 'TIDAL',
    icon: TidalIcon,
    ratePerStream: 0.0125,
    barColor: 'from-slate-400 to-slate-700',
  },
  {
    id: 'deezer',
    name: 'Deezer',
    icon: DeezerIcon,
    ratePerStream: 0.0064,
    barColor: 'from-violet-400 to-violet-600',
  },
];

const DEFAULT_ZAR_RATE = 18.5;

const HOW_IT_WORKS = [
  {
    heading: 'Per-stream rates vary',
    body: "Platforms pay a fraction of a cent per stream. Rates depend on your listener's country, their subscription tier (free vs paid), and platform agreements.",
  },
  {
    heading: 'Location affects earnings',
    body: 'A stream from the US or UK pays significantly more than one from a developing market. Where your audience is matters as much as how many streams you get.',
  },
  {
    heading: 'Distributor cut',
    body: 'Most distributors keep 10–20% of gross earnings. Your net payout is after their commission. Check your distribution agreement.',
  },
];

const SA_TIPS = [
  {
    heading: 'ZAR conversion',
    body: 'Streaming platforms pay in USD. When you receive ZAR via your distributor, they convert at the daily rate minus fees — update the exchange rate above to keep estimates current.',
  },
  {
    heading: 'Register with collecting societies',
    body: 'Join SAMRO (performance royalties on compositions) and SAMPRA (neighbouring rights on recordings) to collect royalties on top of DSP payouts.',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatUsd(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatZar(amount: number) {
  return `R ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function formatStreams(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

// ─── Platform input row ───────────────────────────────────────────────────────

function PlatformRow({
  platform,
  value,
  usd,
  zarRate,
  onChange,
}: {
  platform: Platform;
  value: string;
  usd: number;
  zarRate: number;
  onChange: (_v: string) => void;
}) {
  return (
    <div className='flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-xl'>
      <div className='flex items-center gap-2.5 w-28 sm:w-36 flex-shrink-0'>
        <platform.icon className='w-8 h-8 flex-shrink-0' />
        <div>
          <p className='text-xs font-semibold text-gray-900 dark:text-white leading-none'>
            {platform.name}
          </p>
          <p className='text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 tabular-nums'>
            ~${platform.ratePerStream.toFixed(4)}/stream
          </p>
        </div>
      </div>
      <input
        type='text'
        inputMode='numeric'
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder='0'
        className='flex-1 px-3 py-1.5 text-sm text-right border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors tabular-nums'
      />
      <div className='w-20 sm:w-28 text-right flex-shrink-0'>
        <p className='text-sm font-bold text-gray-900 dark:text-white tabular-nums'>
          {formatUsd(usd)}
        </p>
        <p className='text-[10px] text-gray-400 dark:text-slate-500 tabular-nums'>
          {formatZar(usd * zarRate)}
        </p>
      </div>
    </div>
  );
}

// ─── Info card ────────────────────────────────────────────────────────────────

function InfoCard({
  title,
  accentDot,
  items,
}: {
  title: string;
  accentDot: string;
  items: { heading: string; body: string }[];
}) {
  return (
    <div className='rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800'>
      <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700/60'>
        <p className='text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'>
          {title}
        </p>
      </div>
      <div className='divide-y divide-gray-50 dark:divide-slate-700/40'>
        {items.map(({ heading, body }) => (
          <div key={heading} className='flex gap-3 px-4 py-3'>
            <span
              className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${accentDot} mt-1.5`}
            />
            <div>
              <p className='text-xs font-semibold text-gray-700 dark:text-gray-300 leading-none mb-0.5'>
                {heading}
              </p>
              <p className='text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed'>
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Holder Earnings Card ─────────────────────────────────────────────────────

function HolderEarningsCard({
  sheet,
  totalUsd,
  zarRate,
}: {
  sheet: SplitSheetPreview;
  totalUsd: number;
  zarRate: number;
}) {
  const holders = sheet.masterSplits.filter(
    c => c.name.trim() && c.percentage > 0
  );

  return (
    <div className='rounded-xl border border-purple-100 dark:border-purple-900/40 overflow-hidden bg-white dark:bg-slate-800'>
      <div className='px-4 py-3 border-b border-purple-100 dark:border-purple-800/40 bg-purple-50 dark:bg-purple-900/20'>
        <p className='text-[10px] font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400'>
          Holder Earnings
        </p>
        <p className='text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate'>
          From: {sheet.name}
          {sheet.songTitle ? ` · ${sheet.songTitle}` : ''}
        </p>
      </div>

      {totalUsd === 0 ? (
        <p className='px-4 py-4 text-xs text-gray-400 dark:text-gray-500 italic'>
          Enter stream counts above to see holder earnings.
        </p>
      ) : holders.length === 0 ? (
        <p className='px-4 py-4 text-xs text-gray-400 dark:text-gray-500 italic'>
          No named master holders in this split sheet.
        </p>
      ) : (
        <div className='divide-y divide-gray-50 dark:divide-slate-700/40'>
          {holders.map(c => {
            const earningsUsd = totalUsd * (c.percentage / 100);
            const earningsZar = earningsUsd * zarRate;
            return (
              <div key={c.id} className='px-4 py-3'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold text-gray-800 dark:text-gray-200 truncate'>
                      {c.name}
                    </p>
                    <p className='text-[10px] text-purple-500 dark:text-purple-400 mt-0.5'>
                      {c.role} · {c.percentage}%
                    </p>
                  </div>
                  <div className='text-right flex-shrink-0'>
                    <p className='text-xs font-bold text-gray-800 dark:text-gray-200 tabular-nums'>
                      {formatUsd(earningsUsd)}
                    </p>
                    <p className='text-[10px] text-gray-400 dark:text-gray-500 tabular-nums'>
                      {formatZar(earningsZar)}
                    </p>
                  </div>
                </div>
                <div className='mt-2 h-1 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden'>
                  <div
                    className='h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500'
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface PlatformResult {
  platform: Platform;
  streams: number;
  usd: number;
  zar: number;
}

function RevenueSidebar({
  results,
  totalUsd,
  totalZar,
  totalStreams,
  zarRate,
  linkedSheet,
}: {
  results: PlatformResult[];
  totalUsd: number;
  totalZar: number;
  totalStreams: number;
  zarRate: number;
  linkedSheet: SplitSheetPreview | null;
}) {
  const hasData = totalUsd > 0;
  const activeResults = results
    .filter(r => r.usd > 0)
    .sort((a, b) => b.usd - a.usd);

  return (
    <>
      {/* Summary stats */}
      <div className='rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800'>
        <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700/60'>
          <p className='text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'>
            Estimated Monthly Revenue
          </p>
        </div>
        <div className='px-4 py-4 space-y-3'>
          <div>
            <p
              className={`text-2xl font-extrabold tabular-nums leading-none ${hasData ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-slate-600'}`}
            >
              {formatUsd(totalUsd)}
            </p>
            <p className='text-[11px] text-gray-400 dark:text-slate-500 mt-0.5'>
              US Dollars
            </p>
          </div>
          <div>
            <p
              className={`text-xl font-extrabold tabular-nums leading-none ${hasData ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-300 dark:text-slate-600'}`}
            >
              {formatZar(totalZar)}
            </p>
            <p className='text-[11px] text-gray-400 dark:text-slate-500 mt-0.5'>
              South African Rand
            </p>
          </div>
          <div className='pt-2 border-t border-gray-100 dark:border-slate-700/60'>
            <p
              className={`text-sm font-bold tabular-nums ${hasData ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-slate-600'}`}
            >
              {formatStreams(totalStreams)} streams
            </p>
            <p className='text-[11px] text-gray-400 dark:text-slate-500 mt-0.5'>
              across all platforms
            </p>
          </div>
        </div>
      </div>

      {/* Holder earnings — shown when split sheet is linked */}
      {linkedSheet && (
        <HolderEarningsCard
          sheet={linkedSheet}
          totalUsd={totalUsd}
          zarRate={zarRate}
        />
      )}

      {/* Platform breakdown */}
      <div className='rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800'>
        <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700/60'>
          <p className='text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'>
            Revenue breakdown
          </p>
        </div>
        <div className='px-4 py-3.5'>
          {!hasData ? (
            <p className='text-xs text-gray-400 dark:text-gray-500 italic'>
              Enter stream counts to see your breakdown.
            </p>
          ) : (
            <div className='space-y-3'>
              {activeResults.map(r => (
                <div key={r.platform.id} className='space-y-1'>
                  <div className='flex items-center justify-between gap-2'>
                    <div className='flex items-center gap-1.5 min-w-0'>
                      <r.platform.icon className='w-4 h-4 flex-shrink-0' />
                      <p className='text-xs font-medium text-gray-700 dark:text-gray-300 truncate'>
                        {r.platform.name}
                      </p>
                    </div>
                    <span className='text-xs font-bold tabular-nums text-gray-600 dark:text-gray-300 flex-shrink-0'>
                      {formatUsd(r.usd)}
                    </span>
                  </div>
                  <div className='h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden'>
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${r.platform.barColor} transition-all duration-500`}
                      style={{ width: `${(r.usd / totalUsd) * 100}%` }}
                    />
                  </div>
                  <p className='text-[10px] text-gray-400 dark:text-slate-500 text-right tabular-nums'>
                    {((r.usd / totalUsd) * 100).toFixed(1)}% ·{' '}
                    {formatStreams(r.streams)} streams
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rate reference */}
      <div className='rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800'>
        <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700/60'>
          <p className='text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'>
            Rate reference
          </p>
        </div>
        <div className='divide-y divide-gray-50 dark:divide-slate-700/40'>
          {PLATFORMS.map(p => (
            <div
              key={p.id}
              className='flex items-center justify-between px-4 py-2.5'
            >
              <div className='flex items-center gap-2'>
                <p.icon className='w-4 h-4 flex-shrink-0' />
                <p className='text-xs text-gray-700 dark:text-gray-300'>
                  {p.name}
                </p>
              </div>
              <span className='text-xs font-semibold tabular-nums text-gray-500 dark:text-gray-400'>
                ${p.ratePerStream.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
        <div className='px-4 py-2.5 bg-gray-50 dark:bg-slate-900/40 border-t border-gray-100 dark:border-slate-700/60'>
          <p className='text-[10px] text-gray-400 dark:text-slate-500 leading-relaxed'>
            Per-stream rates are averages and vary by region, tier, and
            agreements.
          </p>
        </div>
      </div>

      <InfoCard
        title='How streaming pays'
        accentDot='bg-emerald-500'
        items={HOW_IT_WORKS}
      />
      <InfoCard title='South Africa' accentDot='bg-blue-500' items={SA_TIPS} />
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RevenuePredictorTool() {
  const { data: session } = useSession();

  const [streams, setStreams] = useState<Record<string, string>>({
    spotify: '10000',
    apple: '',
    youtube: '',
    tidal: '',
    deezer: '',
  });
  const [zarRate, setZarRate] = useState(DEFAULT_ZAR_RATE);
  const [estimateName, setEstimateName] = useState('My Prediction');
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // Split sheet attachment
  const [linkedSheet, setLinkedSheet] = useState<SplitSheetPreview | null>(
    null
  );
  const [sheetList, setSheetList] = useState<SplitSheetPreview[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [loadingSheets, setLoadingSheets] = useState(false);
  const sheetsLoaded = useRef(false);

  const loadSheets = useCallback(async () => {
    if (sheetsLoaded.current) return;
    sheetsLoaded.current = true;
    setLoadingSheets(true);
    try {
      const res = await fetch('/api/tools/split-sheets');
      const data = await res.json();
      if (Array.isArray(data.sheets)) {
        setSheetList(
          (data.sheets as any[]).map(s => ({
            id: s.id,
            name: s.name,
            songTitle: s.songTitle ?? '',
            masterSplits: (s.masterSplits ?? []) as Collaborator[],
          }))
        );
      }
    } catch {
      // ignore
    } finally {
      setLoadingSheets(false);
    }
  }, []);

  const openPicker = useCallback(() => {
    setShowPicker(true);
    loadSheets();
  }, [loadSheets]);

  // Computed totals
  const results = useMemo<PlatformResult[]>(() => {
    return PLATFORMS.map(p => {
      const count = parseFloat(streams[p.id]?.replace(/,/g, '') || '0') || 0;
      const usd = count * p.ratePerStream;
      return { platform: p, streams: count, usd, zar: usd * zarRate };
    });
  }, [streams, zarRate]);

  const totalUsd = results.reduce((s, r) => s + r.usd, 0);
  const totalZar = totalUsd * zarRate;
  const totalStreams = results.reduce((s, r) => s + r.streams, 0);

  const updateStream = useCallback((id: string, value: string) => {
    setStreams(prev => ({ ...prev, [id]: value }));
  }, []);

  // Reset saved badge when inputs change
  useEffect(() => {
    if (saveState === 'saved') setSaveState('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streams, zarRate]);

  const saveEstimate = useCallback(async () => {
    if (!session) return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/tools/revenue-estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: estimateName || 'Untitled',
          streams,
          zarRate,
          splitSheetId: linkedSheet?.id,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 2500);
    }
  }, [session, estimateName, streams, zarRate, linkedSheet]);

  const filteredSheets = pickerSearch.trim()
    ? sheetList.filter(
        s =>
          s.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
          s.songTitle.toLowerCase().includes(pickerSearch.toLowerCase())
      )
    : sheetList;

  const headerActions = session ? (
    <button
      type='button'
      onClick={saveEstimate}
      disabled={saveState === 'saving'}
      className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all disabled:opacity-60'
    >
      {saveState === 'saving' && (
        <ArrowPathIcon className='w-3.5 h-3.5 animate-spin' />
      )}
      {saveState === 'saved' && (
        <CheckIcon className='w-3.5 h-3.5 text-emerald-500' />
      )}
      {saveState === 'error' && <span className='text-red-400 text-xs'>!</span>}
      {saveState === 'idle' && <BookmarkIcon className='w-3.5 h-3.5' />}
      <span className='hidden sm:inline'>
        {saveState === 'saving'
          ? 'Saving…'
          : saveState === 'saved'
            ? 'Saved'
            : saveState === 'error'
              ? 'Failed'
              : 'Save'}
      </span>
    </button>
  ) : null;

  return (
    <ToolShell
      title='Revenue Predictor'
      subtitle='Estimate your streaming earnings across platforms'
      gradient='from-emerald-500 to-teal-600'
      actions={headerActions ?? undefined}
      sidebar={
        <RevenueSidebar
          results={results}
          totalUsd={totalUsd}
          totalZar={totalZar}
          totalStreams={totalStreams}
          zarRate={zarRate}
          linkedSheet={linkedSheet}
        />
      }
    >
      <div className='max-w-2xl px-4 sm:px-8 lg:px-12 py-6 sm:py-10 space-y-10'>
        {/* Step 01 — Exchange Rate */}
        <div className='space-y-5'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0'>
              <span className='text-xs font-bold text-gray-400 dark:text-slate-400'>
                01
              </span>
            </div>
            <div>
              <p className='text-sm font-bold text-gray-900 dark:text-white leading-none'>
                Exchange Rate
              </p>
              <p className='text-xs text-gray-400 dark:text-slate-500 mt-0.5'>
                Set the USD to ZAR rate for local estimates
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl'>
            <span className='text-lg'>💱</span>
            <p className='text-xs text-emerald-700 dark:text-emerald-400 font-medium flex-1'>
              USD to ZAR exchange rate
            </p>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                1 USD =
              </span>
              <input
                type='number'
                min={1}
                step={0.1}
                value={zarRate}
                onChange={e =>
                  setZarRate(parseFloat(e.target.value) || DEFAULT_ZAR_RATE)
                }
                className='w-20 px-2 py-1.5 text-sm text-center border border-emerald-200 dark:border-emerald-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors tabular-nums'
              />
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                ZAR
              </span>
            </div>
          </div>
        </div>

        {/* Step 02 — Monthly Streams */}
        <div className='space-y-5'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0'>
              <span className='text-xs font-bold text-gray-400 dark:text-slate-400'>
                02
              </span>
            </div>
            <div>
              <p className='text-sm font-bold text-gray-900 dark:text-white leading-none'>
                Monthly Streams
              </p>
              <p className='text-xs text-gray-400 dark:text-slate-500 mt-0.5'>
                Enter your stream counts for each platform
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2.5 px-1'>
            <span className='w-28 sm:w-36 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-slate-600'>
              Platform
            </span>
            <span className='flex-1 text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-slate-600 text-right'>
              Monthly Streams
            </span>
            <span className='w-20 sm:w-28 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-slate-600 text-right'>
              Earnings
            </span>
          </div>

          <div className='space-y-2'>
            {PLATFORMS.map(p => (
              <PlatformRow
                key={p.id}
                platform={p}
                value={streams[p.id] ?? ''}
                usd={results.find(r => r.platform.id === p.id)?.usd ?? 0}
                zarRate={zarRate}
                onChange={v => updateStream(p.id, v)}
              />
            ))}
          </div>
        </div>

        {/* Step 03 — Split Sheet Attribution (signed-in only) */}
        {session && (
          <div className='space-y-5'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0'>
                <span className='text-xs font-bold text-gray-400 dark:text-slate-400'>
                  03
                </span>
              </div>
              <div>
                <p className='text-sm font-bold text-gray-900 dark:text-white leading-none'>
                  Royalty Attribution
                </p>
                <p className='text-xs text-gray-400 dark:text-slate-500 mt-0.5'>
                  Attach a split sheet to see per-holder earnings
                </p>
              </div>
            </div>

            {/* Linked sheet */}
            {linkedSheet ? (
              <div className='flex items-center gap-3 p-3.5 rounded-xl border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20'>
                <div className='w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0'>
                  <svg
                    className='w-4 h-4 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
                    {linkedSheet.name}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                    {linkedSheet.songTitle || 'No song title'} ·{' '}
                    {linkedSheet.masterSplits.filter(c => c.name.trim()).length}{' '}
                    master holder
                    {linkedSheet.masterSplits.filter(c => c.name.trim())
                      .length !== 1
                      ? 's'
                      : ''}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setLinkedSheet(null)}
                  className='flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all'
                >
                  <XMarkIcon className='w-4 h-4' />
                </button>
              </div>
            ) : (
              <div className='relative'>
                <button
                  type='button'
                  onClick={openPicker}
                  className='w-full flex items-center gap-2.5 px-3.5 py-2.5 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-500 dark:hover:text-purple-400 transition-all text-sm'
                >
                  <svg
                    className='w-4 h-4 flex-shrink-0'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  Attach a split sheet
                  <span className='ml-auto text-[10px] font-medium text-gray-300 dark:text-slate-600'>
                    optional
                  </span>
                </button>

                {showPicker && (
                  <div className='absolute top-full left-0 right-0 mt-1.5 z-20 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden'>
                    <div className='flex items-center gap-2 p-2.5 border-b border-gray-100 dark:border-slate-700'>
                      <input
                        type='text'
                        value={pickerSearch}
                        onChange={e => setPickerSearch(e.target.value)}
                        placeholder='Search split sheets…'
                        className='flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                      />
                      <button
                        type='button'
                        onClick={() => {
                          setShowPicker(false);
                          setPickerSearch('');
                        }}
                        className='flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                      >
                        <XMarkIcon className='w-4 h-4' />
                      </button>
                    </div>
                    <div className='max-h-52 overflow-y-auto no-scrollbar'>
                      {loadingSheets ? (
                        <div className='flex items-center justify-center py-6'>
                          <ArrowPathIcon className='w-4 h-4 text-purple-400 animate-spin' />
                        </div>
                      ) : filteredSheets.length === 0 ? (
                        <p className='px-4 py-4 text-xs text-gray-400 dark:text-gray-500 text-center'>
                          {sheetList.length === 0
                            ? 'No saved split sheets found.'
                            : 'No matches.'}
                        </p>
                      ) : (
                        filteredSheets.map(sheet => (
                          <button
                            key={sheet.id}
                            type='button'
                            onClick={() => {
                              setLinkedSheet(sheet);
                              setShowPicker(false);
                              setPickerSearch('');
                            }}
                            className='w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left'
                          >
                            <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0'>
                              <svg
                                className='w-3.5 h-3.5 text-white'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                />
                              </svg>
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-medium text-gray-800 dark:text-gray-200 truncate'>
                                {sheet.name}
                              </p>
                              <p className='text-xs text-gray-400 dark:text-gray-500 truncate'>
                                {sheet.songTitle || 'No song title'} ·{' '}
                                {
                                  sheet.masterSplits.filter(c => c.name.trim())
                                    .length
                                }{' '}
                                holders
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prediction name for saving */}
            <div className='space-y-1.5'>
              <label
                htmlFor='prediction-name'
                className='block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500'
              >
                Prediction name
              </label>
              <input
                id='prediction-name'
                type='text'
                value={estimateName}
                onChange={e => setEstimateName(e.target.value)}
                placeholder='e.g. Q1 2026 estimate'
                className='w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors'
              />
              <p className='text-[11px] text-gray-400 dark:text-slate-500'>
                Click <span className='font-semibold'>Save</span> in the header
                to store this prediction to your account.
              </p>
            </div>
          </div>
        )}

        {!session && (
          <p className='text-xs text-center text-gray-400 dark:text-slate-500 pb-4'>
            <a
              href='/login'
              className='text-emerald-600 dark:text-emerald-400 font-semibold hover:underline'
            >
              Sign in
            </a>{' '}
            to save predictions and attach split sheets.
          </p>
        )}

        {/* Disclaimer */}
        <p className='text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed pb-4'>
          Estimates are based on average per-stream rates and vary significantly
          by listener location, subscription tier, and platform agreements. For
          accurate royalty data, check your distributor dashboard.
        </p>
      </div>
    </ToolShell>
  );
}
