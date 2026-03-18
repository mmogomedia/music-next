'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ToolShell } from '@/components/tools/ToolShell';
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  BookmarkIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  FolderOpenIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Collaborator {
  id: string;
  name: string;
  role: string;
  percentage: number;
  publisher?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MASTER_ROLES = [
  'Main Artist',
  'Featured Artist',
  'Producer',
  'Co-Producer',
  'Mixing Engineer',
  'Mastering Engineer',
  'Record Label',
  'Executive Producer',
  'Other',
];

const PUBLISHING_ROLES = [
  'Main Artist',
  'Co-Writer',
  'Composer',
  'Lyricist',
  'Arranger',
  'Publisher',
  'Sub-Publisher',
  'Other',
];

const MASTER_INFO = [
  {
    source: 'Streaming',
    detail:
      'Per-stream payouts from Spotify, Apple Music, Tidal, and other DSPs flow to master rights holders.',
  },
  {
    source: 'Digital downloads',
    detail:
      'Revenue from iTunes, Bandcamp, and other download platforms belongs to the master owner.',
  },
  {
    source: 'Sync licensing',
    detail:
      'When a track is placed in TV, film, or advertising, the master fee is split here.',
  },
  {
    source: 'Neighbouring rights',
    detail:
      'Radio and broadcast performance royalties — collected by SAMPRA in South Africa.',
  },
];

const PUBLISHING_INFO = [
  {
    source: 'Performance royalties',
    detail:
      'SAMRO collects when your song is played publicly — radio, live venues, TV, streaming.',
  },
  {
    source: 'Mechanical royalties',
    detail:
      'Paid every time your song is reproduced — streams, CDs, digital downloads.',
  },
  {
    source: 'Sync licensing',
    detail:
      'The publishing share of any placement in TV, film, games, or commercials.',
  },
  {
    source: 'Print rights',
    detail: 'Income from sheet music, lyric licensing, and educational use.',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}
function makeDefault(role: string, pct: number): Collaborator {
  return { id: uid(), name: '', role, percentage: pct };
}
function calcTotal(list: Collaborator[]) {
  return list.reduce((s, c) => s + (c.percentage || 0), 0);
}

// ─── Collaborator Row ─────────────────────────────────────────────────────────

function CollabRow({
  c,
  index,
  roles,
  accentRing,
  canRemove,
  showPublisher,
  onUpdate,
  onRemove,
}: {
  c: Collaborator;
  index: number;
  roles: string[];
  accentRing: string;
  canRemove: boolean;
  showPublisher?: boolean;
  onUpdate: (
    _id: string,
    _field: keyof Collaborator,
    _value: string | number
  ) => void;
  onRemove: (_id: string) => void;
}) {
  return (
    <div className='flex items-center gap-2.5'>
      <span className='flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-gray-400 dark:text-slate-500 select-none tabular-nums'>
        {index + 1}
      </span>
      <input
        type='text'
        value={c.name}
        onChange={e => onUpdate(c.id, 'name', e.target.value)}
        placeholder='Full name'
        className={`flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent transition-all`}
      />
      {showPublisher && (
        <input
          type='text'
          value={c.publisher ?? ''}
          onChange={e => onUpdate(c.id, 'publisher', e.target.value)}
          placeholder={c.name.trim() || 'Publisher'}
          title='Publisher (leave blank to use artist name)'
          className={`w-28 flex-shrink-0 px-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent transition-all`}
        />
      )}
      <select
        value={c.role}
        onChange={e => onUpdate(c.id, 'role', e.target.value)}
        className={`${showPublisher ? 'w-28' : 'w-36'} flex-shrink-0 px-2.5 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent transition-all`}
      >
        {roles.map(r => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <div className='flex items-center gap-1 flex-shrink-0'>
        <input
          type='number'
          min={0}
          max={100}
          step={0.5}
          value={c.percentage}
          onChange={e =>
            onUpdate(c.id, 'percentage', parseFloat(e.target.value) || 0)
          }
          className={`w-14 px-2 py-2 text-sm text-right border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${accentRing} focus:border-transparent transition-all tabular-nums`}
        />
        <span className='text-xs text-gray-400 dark:text-slate-500'>%</span>
      </div>
      <button
        type='button'
        onClick={() => onRemove(c.id)}
        disabled={!canRemove}
        className='flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-0 disabled:pointer-events-none transition-all'
      >
        <TrashIcon className='w-3.5 h-3.5' />
      </button>
    </div>
  );
}

// ─── Split Section ────────────────────────────────────────────────────────────

function SplitSection({
  step,
  label,
  sublabel,
  accentBg,
  accentText,
  accentRing,
  barColor,
  collaborators,
  roles,
  showPublisher,
  onAdd,
  onRemove,
  onUpdate,
  onDistribute,
  onCopyFrom,
  copyFromLabel,
}: {
  step: string;
  label: string;
  sublabel: string;
  accentBg: string;
  accentText: string;
  accentRing: string;
  barColor: string;
  collaborators: Collaborator[];
  roles: string[];
  showPublisher?: boolean;
  onAdd: () => void;
  onRemove: (_id: string) => void;
  onUpdate: (
    _id: string,
    _field: keyof Collaborator,
    _value: string | number
  ) => void;
  onDistribute: () => void;
  onCopyFrom?: () => void;
  copyFromLabel?: string;
}) {
  const total = calcTotal(collaborators);
  const done = total === 100 && collaborators.every(c => c.name.trim());
  const over = total > 100;

  return (
    <div className='space-y-5'>
      {/* Section header */}
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <div
            className={`w-8 h-8 rounded-full ${accentBg} flex items-center justify-center flex-shrink-0`}
          >
            <span className={`text-xs font-bold ${accentText}`}>{step}</span>
          </div>
          <div>
            <p className='text-sm font-bold text-gray-900 dark:text-white leading-none'>
              {label}
            </p>
            <p className='text-xs text-gray-400 dark:text-slate-500 mt-0.5'>
              {sublabel}
            </p>
          </div>
        </div>
        {done ? (
          <span className='flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0'>
            <CheckIcon className='w-3.5 h-3.5' /> Complete
          </span>
        ) : (
          <span
            className={`text-xs font-bold tabular-nums mt-1 flex-shrink-0 ${over ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'}`}
          >
            {total.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Column headers */}
      <div className='flex items-center gap-2.5 px-0.5'>
        <span className='w-5 flex-shrink-0' />
        <span className='flex-1 text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-slate-600'>
          Name
        </span>
        {showPublisher && (
          <span className='w-28 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-slate-600'>
            Publisher
          </span>
        )}
        <span
          className={`${showPublisher ? 'w-28' : 'w-36'} flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-slate-600`}
        >
          Role
        </span>
        <span className='w-14 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-slate-600 text-right'>
          Split
        </span>
        <span className='w-2 flex-shrink-0' />
        <span className='w-7 flex-shrink-0' />
      </div>

      {/* Rows */}
      <div className='space-y-2'>
        {collaborators.map((c, i) => (
          <CollabRow
            key={c.id}
            c={c}
            index={i}
            roles={roles}
            accentRing={accentRing}
            canRemove={collaborators.length > 1}
            showPublisher={showPublisher}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </div>

      {/* Footer controls */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={onAdd}
            className='flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors'
          >
            <PlusIcon className='w-3.5 h-3.5' />
            Add collaborator
          </button>
          {onCopyFrom && (
            <button
              type='button'
              onClick={onCopyFrom}
              className={`flex items-center gap-1.5 text-xs font-medium ${accentText} opacity-80 hover:opacity-100 transition-opacity`}
            >
              <DocumentDuplicateIcon className='w-3.5 h-3.5' />
              {copyFromLabel ?? 'Copy collaborators'}
            </button>
          )}
        </div>
        <button
          type='button'
          onClick={onDistribute}
          className='text-xs font-medium text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors'
        >
          Distribute evenly
        </button>
      </div>

      {/* Progress bar */}
      <div className='space-y-1.5'>
        <div className='h-1.5 rounded-full bg-gray-100 dark:bg-slate-700/60 overflow-hidden'>
          <div
            className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-400' : barColor}`}
            style={{ width: `${Math.min(total, 100)}%` }}
          />
        </div>
        <div className='flex items-center justify-between'>
          <span
            className={`text-[11px] font-medium ${done ? 'text-emerald-500 dark:text-emerald-400' : over ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'}`}
          >
            {done
              ? 'All splits allocated'
              : over
                ? `Over by ${(total - 100).toFixed(1)}%`
                : `${(100 - total).toFixed(1)}% remaining`}
          </span>
          <span
            className={`text-[11px] font-bold tabular-nums ${done ? 'text-emerald-600 dark:text-emerald-400' : over ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'}`}
          >
            {total.toFixed(total % 1 === 0 ? 0 : 1)} / 100%
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

function SplitBreakdownCard({
  label,
  collaborators,
  total,
  barColor,
  accentText,
}: {
  label: string;
  collaborators: Collaborator[];
  total: number;
  barColor: string;
  accentText: string;
}) {
  return (
    <div className='rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800'>
      <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700/60 flex items-center justify-between'>
        <p className='text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'>
          {label}
        </p>
        <span
          className={`text-xs font-bold tabular-nums ${total === 100 ? 'text-emerald-600 dark:text-emerald-400' : total > 100 ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'}`}
        >
          {total.toFixed(0)}%
        </span>
      </div>
      <div className='px-4 py-3.5'>
        {collaborators.every(c => !c.name && !c.percentage) ? (
          <p className='text-xs text-gray-400 dark:text-gray-500 italic'>
            No collaborators yet.
          </p>
        ) : (
          <div className='space-y-3'>
            {collaborators.map(c => {
              const pct = Math.min(Math.max(c.percentage || 0, 0), 100);
              return (
                <div key={c.id} className='space-y-1'>
                  <div className='flex items-center justify-between gap-2'>
                    <div className='min-w-0'>
                      <p className='text-xs font-medium text-gray-800 dark:text-gray-200 truncate leading-none'>
                        {c.name || (
                          <span className='text-gray-400 dark:text-gray-500 italic font-normal'>
                            Unnamed
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-[10px] mt-0.5 font-medium ${accentText}`}
                      >
                        {c.role}
                      </p>
                    </div>
                    <span className='text-xs font-bold tabular-nums text-gray-600 dark:text-gray-300 flex-shrink-0'>
                      {pct}%
                    </span>
                  </div>
                  <div className='h-1 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden'>
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  title,
  intro,
  items,
  accentDot,
}: {
  title: string;
  intro: string;
  items: { source: string; detail: string }[];
  accentDot: string;
}) {
  return (
    <div className='rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800'>
      <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700/60'>
        <p className='text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'>
          {title}
        </p>
        <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed'>
          {intro}
        </p>
      </div>
      <div className='divide-y divide-gray-50 dark:divide-slate-700/40'>
        {items.map(({ source, detail }) => (
          <div key={source} className='flex gap-3 px-4 py-3'>
            <span
              className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${accentDot} mt-1.5`}
            />
            <div>
              <p className='text-xs font-semibold text-gray-700 dark:text-gray-300 leading-none mb-0.5'>
                {source}
              </p>
              <p className='text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed'>
                {detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface LinkedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  readTime: number;
}

interface PickerArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  readTime: number;
  status: string;
}

function RightPanel({
  songTitle,
  masterCollabs,
  publishingCollabs,
  includeMaster,
}: {
  songTitle: string;
  masterCollabs: Collaborator[];
  publishingCollabs: Collaborator[];
  includeMaster: boolean;
}) {
  const masterTotal = calcTotal(masterCollabs);
  const publishingTotal = calcTotal(publishingCollabs);
  const masterDone =
    masterTotal === 100 && masterCollabs.every(c => c.name.trim());
  const publishingDone =
    publishingTotal === 100 && publishingCollabs.every(c => c.name.trim());

  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN';

  // Linked articles state
  const [linkedArticles, setLinkedArticles] = useState<LinkedArticle[]>([]);
  const [linkIds, setLinkIds] = useState<Record<string, string>>({}); // articleId → ContentLink.id
  const fetched = useRef(false);

  const loadLinked = () => {
    fetch('/api/tools/split-sheet/articles')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.articles)) setLinkedArticles(d.articles);
        if (d.linkIds && typeof d.linkIds === 'object') setLinkIds(d.linkIds);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    loadLinked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manage mode
  const [managing, setManaging] = useState(false);
  const [allArticles, setAllArticles] = useState<PickerArticle[]>([]);
  const [loadingPicker, setLoadingPicker] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const openManage = async () => {
    setManaging(true);
    if (allArticles.length > 0) return;
    setLoadingPicker(true);
    try {
      const res = await fetch('/api/admin/articles?status=PUBLISHED');
      const data = await res.json();
      setAllArticles(data.articles ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingPicker(false);
    }
  };

  const toggleLink = async (article: PickerArticle) => {
    const linked = !!linkIds[article.id];
    setToggling(article.id);
    try {
      if (linked) {
        const res = await fetch(`/api/graph/link/${linkIds[article.id]}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setLinkIds(prev => {
            const next = { ...prev };
            delete next[article.id];
            return next;
          });
          setLinkedArticles(prev => prev.filter(a => a.id !== article.id));
        }
      } else {
        const res = await fetch('/api/graph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromType: 'ARTICLE',
            fromId: article.id,
            toType: 'TOOL',
            toId: 'split-sheet',
            linkType: 'REFERENCES',
            order: linkedArticles.length,
          }),
        });
        const data = await res.json();
        if (data.link) {
          setLinkIds(prev => ({ ...prev, [article.id]: data.link.id }));
          setLinkedArticles(prev => [
            ...prev,
            {
              id: article.id,
              title: article.title,
              slug: article.slug,
              excerpt: article.excerpt,
              readTime: article.readTime,
            },
          ]);
        }
      }
    } catch {
      // ignore
    } finally {
      setToggling(null);
    }
  };

  const filteredPicker = pickerSearch.trim()
    ? allArticles.filter(a =>
        a.title.toLowerCase().includes(pickerSearch.toLowerCase())
      )
    : allArticles;

  return (
    <>
      {/* Status overview */}
      <div className='rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800'>
        <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700/60'>
          <p className='text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'>
            Overview
          </p>
          <p className='text-sm font-semibold text-gray-900 dark:text-white mt-0.5 truncate'>
            {songTitle || (
              <span className='text-gray-400 dark:text-gray-500 font-normal italic'>
                Untitled
              </span>
            )}
          </p>
        </div>
        <div className='divide-y divide-gray-50 dark:divide-slate-700/40'>
          {[
            {
              label: 'Publishing',
              total: publishingTotal,
              done: publishingDone,
              always: true,
            },
            {
              label: 'Master Recording',
              total: masterTotal,
              done: masterDone,
              always: false,
            },
          ]
            .filter(row => row.always || includeMaster)
            .map(({ label, total, done }) => (
              <div
                key={label}
                className='flex items-center justify-between px-4 py-3'
              >
                <div className='flex items-center gap-2.5 min-w-0'>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-slate-700'}`}
                  >
                    {done ? (
                      <CheckIcon className='w-3 h-3 text-emerald-600 dark:text-emerald-400' />
                    ) : (
                      <span className='w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-500' />
                    )}
                  </div>
                  <span className='text-sm text-gray-700 dark:text-gray-300'>
                    {label}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold tabular-nums ${total === 100 ? 'text-emerald-600 dark:text-emerald-400' : total > 100 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}
                >
                  {total.toFixed(0)}%
                </span>
              </div>
            ))}
        </div>
      </div>

      <SplitBreakdownCard
        label='Publishing Splits'
        collaborators={publishingCollabs}
        total={publishingTotal}
        barColor='bg-teal-500'
        accentText='text-teal-600 dark:text-teal-400'
      />
      {includeMaster && (
        <SplitBreakdownCard
          label='Master Splits'
          collaborators={masterCollabs}
          total={masterTotal}
          barColor='bg-indigo-500'
          accentText='text-indigo-500 dark:text-indigo-400'
        />
      )}

      {/* Related articles — with admin link manager */}
      <div className='rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800'>
        <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700/60 flex items-center justify-between'>
          <p className='text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500'>
            Related reading
            {linkedArticles.length > 0 && (
              <span className='ml-1.5 text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-full'>
                {linkedArticles.length}
              </span>
            )}
          </p>
          {isAdmin && (
            <button
              type='button'
              onClick={managing ? () => setManaging(false) : openManage}
              className={`flex items-center gap-1 text-[10px] font-semibold transition-colors px-2 py-0.5 rounded-md ${
                managing
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }`}
            >
              {managing ? (
                <>
                  <svg
                    className='w-3 h-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                  Done
                </>
              ) : (
                <>
                  <svg
                    className='w-3 h-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                    />
                  </svg>
                  Manage
                </>
              )}
            </button>
          )}
        </div>

        {/* Manage mode — article picker */}
        {managing && (
          <div className='border-b border-gray-100 dark:border-slate-700'>
            <div className='px-3 py-2.5'>
              <input
                type='text'
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                placeholder='Search articles…'
                className='w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              />
            </div>
            <div className='max-h-52 overflow-y-auto no-scrollbar divide-y divide-gray-50 dark:divide-slate-700/40'>
              {loadingPicker ? (
                <div className='px-4 py-6 text-center'>
                  <svg
                    className='w-4 h-4 text-indigo-400 animate-spin mx-auto'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8v8H4z'
                    />
                  </svg>
                </div>
              ) : filteredPicker.length === 0 ? (
                <p className='px-4 py-4 text-[11px] text-gray-400 dark:text-gray-500 text-center'>
                  {pickerSearch
                    ? 'No articles match.'
                    : 'No published articles found.'}
                </p>
              ) : (
                filteredPicker.map(article => {
                  const linked = !!linkIds[article.id];
                  const isToggling = toggling === article.id;
                  return (
                    <button
                      key={article.id}
                      type='button'
                      onClick={() => toggleLink(article)}
                      disabled={isToggling}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors disabled:opacity-60 ${
                        linked
                          ? 'bg-indigo-50 dark:bg-indigo-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors ${
                          linked
                            ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                            : 'border-gray-300 dark:border-slate-600'
                        }`}
                      >
                        {isToggling ? (
                          <svg
                            className='w-2.5 h-2.5 text-white animate-spin'
                            fill='none'
                            viewBox='0 0 24 24'
                          >
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                            />
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8v8H4z'
                            />
                          </svg>
                        ) : linked ? (
                          <svg
                            className='w-2.5 h-2.5 text-white'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={3}
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                        ) : null}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p
                          className={`text-xs font-medium leading-snug truncate ${linked ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          {article.title}
                        </p>
                        <p className='text-[10px] text-gray-400 dark:text-gray-500 mt-0.5'>
                          {article.readTime} min read
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Linked articles list */}
        {linkedArticles.length === 0 ? (
          <p className='px-4 py-4 text-[11px] text-gray-400 dark:text-gray-500 italic'>
            {isAdmin
              ? 'No articles linked. Use Manage to add some.'
              : 'No related articles yet.'}
          </p>
        ) : (
          <ul className='divide-y divide-gray-50 dark:divide-slate-700/40'>
            {linkedArticles.map(article => (
              <li key={article.id}>
                <Link
                  href={`/learn/${article.slug}`}
                  className='flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors group'
                >
                  <div className='flex-1 min-w-0'>
                    <p className='text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2'>
                      {article.title}
                    </p>
                    {article.excerpt && (
                      <p className='text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1'>
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                  <span className='flex-shrink-0 text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 whitespace-nowrap'>
                    {article.readTime}m
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Royalty info — fallback educational content */}
      <InfoCard
        title='What are Master Rights?'
        intro='The master is the recording. Whoever owns it collects:'
        accentDot='bg-indigo-500'
        items={MASTER_INFO}
      />
      <InfoCard
        title='What are Publishing Rights?'
        intro='Publishing covers the composition — melody and lyrics. Songwriters collect:'
        accentDot='bg-teal-500'
        items={PUBLISHING_INFO}
      />

      <div className='rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3.5'>
        <p className='text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed'>
          <span className='font-semibold'>South Africa:</span> Register
          compositions with <span className='font-semibold'>SAMRO</span> for
          performance royalties, and with{' '}
          <span className='font-semibold'>SAMPRA</span> for neighbouring rights
          on master recordings.
        </p>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface TrackResult {
  id: string;
  title: string;
  artist: string | null;
  coverImageUrl: string | null;
  albumArtwork: string | null;
  releaseDate?: string | null;
}

interface SavedSheet {
  id: string;
  name: string;
  songTitle: string;
  songDate: string;
  masterSplits: Collaborator[];
  publishingSplits: Collaborator[];
  trackId: string | null;
  track?: {
    id: string;
    title: string;
    coverImageUrl: string | null;
    albumArtwork: string | null;
    artist: string | null;
  } | null;
}

export default function SplitSheetTool() {
  const { data: session } = useSession();
  const [songTitle, setSongTitle] = useState('');
  const [songDate, setSongDate] = useState('');
  const [isrc, setIsrc] = useState('');
  const [masterCollabs, setMasterCollabs] = useState<Collaborator[]>([
    makeDefault('Main Artist', 100),
  ]);
  const [publishingCollabs, setPublishingCollabs] = useState<Collaborator[]>([
    makeDefault('Main Artist', 100),
  ]);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // ── Linked track ──
  const [linkedTrack, setLinkedTrack] = useState<TrackResult | null>(null);
  const [trackSearch, setTrackSearch] = useState('');
  const [trackResults, setTrackResults] = useState<TrackResult[]>([]);
  const [trackSearching, setTrackSearching] = useState(false);
  const [showTrackPicker, setShowTrackPicker] = useState(false);
  const trackSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchTracks = useCallback((q: string) => {
    if (trackSearchTimer.current) clearTimeout(trackSearchTimer.current);
    if (!q.trim()) {
      setTrackResults([]);
      return;
    }
    trackSearchTimer.current = setTimeout(async () => {
      setTrackSearching(true);
      try {
        const res = await fetch(
          `/api/tracks/search?q=${encodeURIComponent(q)}&limit=8`
        );
        const data = await res.json();
        setTrackResults(data.tracks ?? []);
      } catch {
        setTrackResults([]);
      } finally {
        setTrackSearching(false);
      }
    }, 300);
  }, []);

  const selectTrack = useCallback((track: TrackResult) => {
    setLinkedTrack(track);
    setSongTitle(track.title);
    if (track.releaseDate) {
      setSongDate(new Date(track.releaseDate).toISOString().split('T')[0]);
    }
    setShowTrackPicker(false);
    setTrackSearch('');
    setTrackResults([]);
  }, []);

  const clearTrack = useCallback(() => {
    setLinkedTrack(null);
  }, []);

  // ── Load saved sheets ──
  const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([]);
  const [showLoadPicker, setShowLoadPicker] = useState(false);
  const [loadSearch, setLoadSearch] = useState('');
  const [loadingSheets, setLoadingSheets] = useState(false);
  const sheetsLoadedRef = useRef(false);

  const fetchSavedSheets = useCallback(async () => {
    if (sheetsLoadedRef.current) return;
    sheetsLoadedRef.current = true;
    setLoadingSheets(true);
    try {
      const res = await fetch('/api/tools/split-sheets');
      const data = await res.json();
      setSavedSheets((data.sheets ?? []) as SavedSheet[]);
    } catch {
      // ignore
    } finally {
      setLoadingSheets(false);
    }
  }, []);

  const loadSheetIntoEditor = useCallback((sheet: SavedSheet) => {
    setSongTitle(sheet.songTitle);
    setSongDate(sheet.songDate);
    // Re-key collaborators so React treats them as fresh rows
    setMasterCollabs(sheet.masterSplits.map(c => ({ ...c, id: uid() })));
    setPublishingCollabs(
      sheet.publishingSplits.map(c => ({ ...c, id: uid() }))
    );
    if (sheet.track) {
      setLinkedTrack({
        id: sheet.track.id,
        title: sheet.track.title,
        artist: sheet.track.artist,
        coverImageUrl: sheet.track.coverImageUrl,
        albumArtwork: sheet.track.albumArtwork,
      });
    } else {
      setLinkedTrack(null);
    }
    setShowLoadPicker(false);
    setLoadSearch('');
    setSaveState('idle');
  }, []);

  const filteredSaved = loadSearch.trim()
    ? savedSheets.filter(
        s =>
          s.name.toLowerCase().includes(loadSearch.toLowerCase()) ||
          s.songTitle.toLowerCase().includes(loadSearch.toLowerCase())
      )
    : savedSheets;

  const [includeMaster, setIncludeMaster] = useState(false);

  const masterTotal = calcTotal(masterCollabs);
  const publishingTotal = calcTotal(publishingCollabs);
  const masterValid =
    masterTotal === 100 && masterCollabs.every(c => c.name.trim());
  const publishingValid =
    publishingTotal === 100 && publishingCollabs.every(c => c.name.trim());
  const canExport = (includeMaster ? masterValid : true) && publishingValid;

  // ── Handlers ──
  const addMaster = useCallback(() => {
    setMasterCollabs(prev => [
      ...prev,
      makeDefault(
        'Producer',
        Math.max(0, 100 - prev.reduce((s, c) => s + c.percentage, 0))
      ),
    ]);
  }, []);
  const removeMaster = useCallback(
    (id: string) => setMasterCollabs(prev => prev.filter(c => c.id !== id)),
    []
  );
  const updateMaster = useCallback(
    (id: string, field: keyof Collaborator, value: string | number) => {
      setMasterCollabs(prev =>
        prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
      );
    },
    []
  );
  const distributeMaster = useCallback(() => {
    const n = masterCollabs.length;
    const base = Math.floor(100 / n);
    setMasterCollabs(prev =>
      prev.map((c, i) => ({
        ...c,
        percentage: base + (i === 0 ? 100 - base * n : 0),
      }))
    );
  }, [masterCollabs.length]);

  const addPublishing = useCallback(() => {
    setPublishingCollabs(prev => [
      ...prev,
      makeDefault(
        'Co-Writer',
        Math.max(0, 100 - prev.reduce((s, c) => s + c.percentage, 0))
      ),
    ]);
  }, []);
  const removePublishing = useCallback(
    (id: string) => setPublishingCollabs(prev => prev.filter(c => c.id !== id)),
    []
  );
  const updatePublishing = useCallback(
    (id: string, field: keyof Collaborator, value: string | number) => {
      setPublishingCollabs(prev =>
        prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
      );
    },
    []
  );
  const distributePublishing = useCallback(() => {
    const n = publishingCollabs.length;
    const base = Math.floor(100 / n);
    setPublishingCollabs(prev =>
      prev.map((c, i) => ({
        ...c,
        percentage: base + (i === 0 ? 100 - base * n : 0),
      }))
    );
  }, [publishingCollabs.length]);

  // Copy master names → publishing (map roles to publishing equivalents)
  const copyMasterToPublishing = useCallback(() => {
    setPublishingCollabs(
      masterCollabs.map(c => ({
        ...c,
        id: uid(),
        role: PUBLISHING_ROLES.includes(c.role) ? c.role : 'Co-Writer',
      }))
    );
  }, [masterCollabs]);

  // Copy publishing names → master (map roles to master equivalents)
  const copyPublishingToMaster = useCallback(() => {
    setMasterCollabs(
      publishingCollabs.map(c => ({
        ...c,
        id: uid(),
        role: MASTER_ROLES.includes(c.role) ? c.role : 'Main Artist',
      }))
    );
  }, [publishingCollabs]);

  const masterHasNames = masterCollabs.some(c => c.name.trim());
  const publishingHasNames = publishingCollabs.some(c => c.name.trim());

  // ── Save ──
  const saveSplits = useCallback(async () => {
    if (!session) return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/tools/split-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: songTitle || 'Untitled',
          songTitle,
          songDate,
          masterSplits: masterCollabs,
          publishingSplits: publishingCollabs,
          trackId: linkedTrack?.id ?? undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 2500);
    }
  }, [session, songTitle, songDate, masterCollabs, publishingCollabs]);

  // ── Export PDF ──
  const exportPDF = useCallback(async () => {
    if (!canExport) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageW = 210;
    const lm = 18;
    const rm = 18;
    const contentW = pageW - lm - rm;

    // ── Brand colours ──
    const blue = [37, 99, 235] as const; // #2563EB
    const purple = [124, 58, 237] as const; // #7C3AED
    const pink = [236, 72, 153] as const; // #EC4899
    const navy = [15, 23, 42] as const; // #0F172A
    const body = [17, 24, 39] as const; // #111827
    const muted = [107, 114, 128] as const; // #6B7280
    const light = [249, 250, 251] as const; // #F9FAFB
    const border = [229, 231, 235] as const; // #E5E7EB

    let y = 0;

    const dateStr = songDate
      ? new Date(songDate).toLocaleDateString('en-ZA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('en-ZA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

    // ── Gradient accent bar (top) — blue → purple → pink ──
    const steps = 170;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      let r: number, g: number, b: number;
      if (t < 0.5) {
        const s = t * 2;
        r = Math.round(blue[0] + s * (purple[0] - blue[0]));
        g = Math.round(blue[1] + s * (purple[1] - blue[1]));
        b = Math.round(blue[2] + s * (purple[2] - blue[2]));
      } else {
        const s = (t - 0.5) * 2;
        r = Math.round(purple[0] + s * (pink[0] - purple[0]));
        g = Math.round(purple[1] + s * (pink[1] - purple[1]));
        b = Math.round(purple[2] + s * (pink[2] - purple[2]));
      }
      doc.setFillColor(r, g, b);
      doc.rect(i * (pageW / steps), 0, pageW / steps + 0.5, 4, 'F');
    }

    y = 4;

    // ── Header: white band ──
    doc.setFillColor(255, 255, 255);
    doc.rect(0, y, pageW, 40, 'F');

    // Load & place logo
    let logoPlaced = false;
    try {
      const res = await fetch('/main_logo.png');
      const blob = await res.blob();
      const logoData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const img = new Image();
      img.src = logoData;
      await new Promise(r => {
        img.onload = r;
        img.onerror = r;
      });
      const aspect = img.naturalWidth / (img.naturalHeight || 1);
      const logoH = 13;
      const logoW = Math.min(logoH * aspect, 50);
      doc.addImage(logoData, 'PNG', lm, y + 13, logoW, logoH);
      logoPlaced = true;
    } catch {
      /* continue */
    }

    if (!logoPlaced) {
      // Text fallback — draw "flemoji" in brand blue
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...blue);
      doc.text('flemoji', lm, y + 24);
    }

    // Document type — right side of header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...navy);
    doc.text('SPLIT SHEET', pageW - rm, y + 20, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text('Royalty Ownership Agreement', pageW - rm, y + 28, {
      align: 'right',
    });

    y += 40;

    // Thin separator line
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.line(0, y, pageW, y);

    // ── Song info band ──
    const bandH = isrc ? 24 : 18;
    doc.setFillColor(...light);
    doc.rect(0, y, pageW, bandH, 'F');
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...body);
    const displayTitle = songTitle || 'Untitled';
    doc.text(displayTitle, lm, y + 9);

    // Date — right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(dateStr, pageW - rm, y + 9, { align: 'right' });

    // ISRC — left, below title
    if (isrc) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text(`ISRC: ${isrc}`, lm, y + 18);
    }

    y += bandH + 4;

    // ── Column positions ──
    // Master layout: NAME | ROLE | SPLIT %
    const masterColName = lm;
    const masterColRole = lm + 95;
    const masterColSplit = pageW - rm - 6;
    const masterNameMaxW = masterColRole - masterColName - 6;
    const masterRoleMaxW = masterColSplit - masterColRole - 10;

    // Publishing layout: NAME | PUBLISHER | ROLE | SPLIT %
    const pubColName = lm;
    const pubColPublisher = lm + 65;
    const pubColRole = lm + 115;
    const pubColSplit = pageW - rm - 6;
    const pubNameMaxW = pubColPublisher - pubColName - 6;
    const pubPublisherMaxW = pubColRole - pubColPublisher - 6;
    const pubRoleMaxW = pubColSplit - pubColRole - 10;

    const rowH = 9;

    const truncText = (text: string, maxW: number): string => {
      if (!text || doc.getTextWidth(text) <= maxW) return text;
      let t = text;
      while (t.length > 0 && doc.getTextWidth(`${t}…`) > maxW)
        t = t.slice(0, -1);
      return `${t}…`;
    };

    // ── Master section drawer ──
    const drawMasterSection = (
      label: string,
      collabs: Collaborator[],
      total: number,
      accent: readonly [number, number, number]
    ) => {
      doc.setFillColor(accent[0], accent[1], accent[2]);
      doc.rect(lm, y, contentW, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(label.toUpperCase(), lm + 4, y + 6.8);
      y += 13;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...muted);
      doc.text('NAME', masterColName, y);
      doc.text('ROLE', masterColRole, y);
      doc.text('SPLIT %', masterColSplit, y, { align: 'right' });
      y += 2;
      doc.setDrawColor(...border);
      doc.setLineWidth(0.2);
      doc.line(lm, y, pageW - rm, y);
      y += 6;

      collabs.forEach((c, i) => {
        const rowColor: [number, number, number] =
          i % 2 === 0 ? [255, 255, 255] : [light[0], light[1], light[2]];
        doc.setFillColor(...rowColor);
        doc.rect(lm, y - 5, contentW, rowH, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...body);
        doc.text(
          truncText(c.name.trim() || '—', masterNameMaxW),
          masterColName,
          y
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...muted);
        doc.text(truncText(c.role, masterRoleMaxW), masterColRole, y);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(accent[0], accent[1], accent[2]);
        doc.text(`${c.percentage}%`, masterColSplit, y, { align: 'right' });

        y += rowH;
      });

      doc.setFillColor(...light);
      doc.rect(lm, y - 1, contentW, rowH, 'F');
      doc.setDrawColor(...border);
      doc.setLineWidth(0.3);
      doc.line(lm, y - 1, pageW - rm, y - 1);
      y += 3.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.text('TOTAL', masterColName, y);
      const totColor: [number, number, number] =
        total === 100 ? [16, 185, 129] : [239, 68, 68];
      doc.setTextColor(...totColor);
      doc.text(`${total}%`, masterColSplit, y, { align: 'right' });
      y += 12;
    };

    // ── Publishing section drawer (includes Publisher column) ──
    const drawPublishingSection = (
      label: string,
      collabs: Collaborator[],
      total: number,
      accent: readonly [number, number, number]
    ) => {
      doc.setFillColor(accent[0], accent[1], accent[2]);
      doc.rect(lm, y, contentW, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(label.toUpperCase(), lm + 4, y + 6.8);
      y += 13;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...muted);
      doc.text('NAME', pubColName, y);
      doc.text('PUBLISHER', pubColPublisher, y);
      doc.text('ROLE', pubColRole, y);
      doc.text('SPLIT %', pubColSplit, y, { align: 'right' });
      y += 2;
      doc.setDrawColor(...border);
      doc.setLineWidth(0.2);
      doc.line(lm, y, pageW - rm, y);
      y += 6;

      collabs.forEach((c, i) => {
        const rowColor: [number, number, number] =
          i % 2 === 0 ? [255, 255, 255] : [light[0], light[1], light[2]];
        doc.setFillColor(...rowColor);
        doc.rect(lm, y - 5, contentW, rowH, 'F');

        // Publisher value: explicit publisher field, fall back to artist name
        const publisherValue =
          (c.publisher ?? '').trim() || c.name.trim() || '—';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...body);
        doc.text(truncText(c.name.trim() || '—', pubNameMaxW), pubColName, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...muted);
        doc.text(
          truncText(publisherValue, pubPublisherMaxW),
          pubColPublisher,
          y
        );
        doc.text(truncText(c.role, pubRoleMaxW), pubColRole, y);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(accent[0], accent[1], accent[2]);
        doc.text(`${c.percentage}%`, pubColSplit, y, { align: 'right' });

        y += rowH;
      });

      doc.setFillColor(...light);
      doc.rect(lm, y - 1, contentW, rowH, 'F');
      doc.setDrawColor(...border);
      doc.setLineWidth(0.3);
      doc.line(lm, y - 1, pageW - rm, y - 1);
      y += 3.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.text('TOTAL', pubColName, y);
      const totColor: [number, number, number] =
        total === 100 ? [16, 185, 129] : [239, 68, 68];
      doc.setTextColor(...totColor);
      doc.text(`${total}%`, pubColSplit, y, { align: 'right' });
      y += 12;
    };

    if (includeMaster) {
      drawMasterSection('Master Recording', masterCollabs, masterTotal, blue);
    }
    drawPublishingSection(
      'Publishing / Composition',
      publishingCollabs,
      publishingTotal,
      purple
    );

    // ── Footer helper (drawn on every page) ──
    const drawFooter = () => {
      const footerY = 284;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        let r: number, g: number, b: number;
        if (t < 0.5) {
          const s = t * 2;
          r = Math.round(blue[0] + s * (purple[0] - blue[0]));
          g = Math.round(blue[1] + s * (purple[1] - blue[1]));
          b = Math.round(blue[2] + s * (purple[2] - blue[2]));
        } else {
          const s = (t - 0.5) * 2;
          r = Math.round(purple[0] + s * (pink[0] - purple[0]));
          g = Math.round(purple[1] + s * (pink[1] - purple[1]));
          b = Math.round(purple[2] + s * (pink[2] - purple[2]));
        }
        doc.setFillColor(r, g, b);
        doc.rect(i * (pageW / steps), footerY, pageW / steps + 0.5, 2, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...navy);
      doc.text('Flemoji', lm, footerY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...muted);
      doc.text('AI-Powered Music Platform', lm + 17, footerY + 8);
      doc.text(`Generated ${dateStr}`, pageW - rm, footerY + 8, {
        align: 'right',
      });
    };

    // Footer on page 1
    drawFooter();

    // ── Signature page ──
    doc.addPage();
    y = lm;

    // Gradient accent bar at top
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      let r: number, g: number, b: number;
      if (t < 0.5) {
        const s = t * 2;
        r = Math.round(blue[0] + s * (purple[0] - blue[0]));
        g = Math.round(blue[1] + s * (purple[1] - blue[1]));
        b = Math.round(blue[2] + s * (purple[2] - blue[2]));
      } else {
        const s = (t - 0.5) * 2;
        r = Math.round(purple[0] + s * (pink[0] - purple[0]));
        g = Math.round(purple[1] + s * (pink[1] - purple[1]));
        b = Math.round(purple[2] + s * (pink[2] - purple[2]));
      }
      doc.setFillColor(r, g, b);
      doc.rect(i * (pageW / steps), 0, pageW / steps + 0.5, 2, 'F');
    }

    // Page heading
    y += 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...navy);
    doc.text('SIGNATURES', lm, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    doc.text(
      'By signing below, all parties confirm agreement to the split percentages on page 1.',
      lm,
      y + 8
    );
    y += 22;

    // Thin rule under heading
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.line(lm, y, pageW - rm, y);
    y += 16;

    // ── Per-collaborator signature blocks ──
    // Collect unique named collaborators (master first if included, then publishing-only by name dedup)
    const seenNames = new Set<string>();
    const sigCollabs: { name: string; role: string }[] = [];
    [...(includeMaster ? masterCollabs : []), ...publishingCollabs].forEach(
      c => {
        const key = c.name.trim().toLowerCase();
        if (key && !seenNames.has(key)) {
          seenNames.add(key);
          sigCollabs.push({ name: c.name.trim(), role: c.role });
        }
      }
    );
    // Fall back to 3 blank slots if no named collabs
    const slots =
      sigCollabs.length > 0
        ? sigCollabs
        : [
            { name: '', role: '' },
            { name: '', role: '' },
            { name: '', role: '' },
          ];

    const cols = 3;
    const gap = 10;
    const sigW = (contentW - gap * (cols - 1)) / cols;
    const sigBlockH = 52; // taller blocks — more room to sign

    slots.forEach((slot, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = lm + col * (sigW + gap);
      const baseY = y + row * sigBlockH;

      // Name + role label
      if (slot.name) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...body);
        doc.text(truncText(slot.name, sigW - 4), x, baseY + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...muted);
        doc.text(truncText(slot.role, sigW - 4), x, baseY + 13);
      } else {
        // Blank slot — just label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...muted);
        doc.text(`Party ${i + 1}`, x, baseY + 7);
      }

      // Signature area (generous blank space)
      doc.setDrawColor(...border);
      doc.setLineWidth(0.2);
      doc.rect(x, baseY + 18, sigW, 18, 'S');

      // Signature line label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...muted);
      doc.text('Signature', x, baseY + 41);

      // Date field
      doc.setDrawColor(...border);
      doc.line(x, baseY + 49, x + sigW, baseY + 49);
      doc.text('Date', x, baseY + 48);
    });

    const rows = Math.ceil(slots.length / cols);
    y += rows * sigBlockH + 8;

    // Footer on signature page
    drawFooter();

    doc.save(
      `flemoji-split-sheet-${(songTitle || 'untitled').replace(/\s+/g, '-').toLowerCase()}.pdf`
    );
  }, [
    canExport,
    includeMaster,
    masterCollabs,
    publishingCollabs,
    songTitle,
    songDate,
    isrc,
    masterTotal,
    publishingTotal,
    linkedTrack,
  ]);

  // Reset save state on content change
  useEffect(() => {
    if (saveState === 'saved') setSaveState('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songTitle, songDate, masterCollabs, publishingCollabs]);

  const headerActions = (
    <>
      {session && (
        <>
          {/* Load saved sheet */}
          <div className='relative'>
            <button
              type='button'
              onClick={() => {
                setShowLoadPicker(v => !v);
                fetchSavedSheets();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all ${
                showLoadPicker
                  ? 'text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <FolderOpenIcon className='w-3.5 h-3.5' />
              <span className='hidden sm:inline'>Load</span>
            </button>

            {showLoadPicker && (
              <div className='absolute right-0 top-full mt-1.5 z-30 w-72 sm:w-80 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden'>
                <div className='flex items-center gap-2 p-2.5 border-b border-gray-100 dark:border-slate-700'>
                  <input
                    type='text'
                    value={loadSearch}
                    onChange={e => setLoadSearch(e.target.value)}
                    placeholder='Search your split sheets…'
                    className='flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  />
                  <button
                    type='button'
                    onClick={() => {
                      setShowLoadPicker(false);
                      setLoadSearch('');
                    }}
                    className='flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                  >
                    <XMarkIcon className='w-4 h-4' />
                  </button>
                </div>
                <div className='max-h-64 overflow-y-auto no-scrollbar'>
                  {loadingSheets ? (
                    <div className='flex items-center justify-center py-6'>
                      <ArrowPathIcon className='w-4 h-4 text-indigo-400 animate-spin' />
                    </div>
                  ) : filteredSaved.length === 0 ? (
                    <p className='px-4 py-5 text-xs text-gray-400 dark:text-gray-500 text-center'>
                      {savedSheets.length === 0
                        ? 'No saved split sheets yet.'
                        : 'No matches.'}
                    </p>
                  ) : (
                    filteredSaved.map(sheet => (
                      <button
                        key={sheet.id}
                        type='button'
                        onClick={() => loadSheetIntoEditor(sheet)}
                        className='w-full flex items-start gap-3 px-3.5 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left border-b border-gray-50 dark:border-slate-700/40 last:border-0'
                      >
                        <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5'>
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
                          <p className='text-sm font-semibold text-gray-800 dark:text-gray-200 truncate leading-none'>
                            {sheet.name}
                          </p>
                          <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate'>
                            {sheet.songTitle || 'No song title'}
                          </p>
                          <div className='flex items-center gap-2 mt-1'>
                            <span className='text-[10px] font-medium text-indigo-500 dark:text-indigo-400'>
                              {
                                sheet.masterSplits.filter(c => c.name.trim())
                                  .length
                              }{' '}
                              master
                            </span>
                            <span className='text-[10px] text-gray-300 dark:text-slate-600'>
                              ·
                            </span>
                            <span className='text-[10px] font-medium text-teal-500 dark:text-teal-400'>
                              {
                                sheet.publishingSplits.filter(c =>
                                  c.name.trim()
                                ).length
                              }{' '}
                              publishing
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          <button
            type='button'
            onClick={saveSplits}
            disabled={saveState === 'saving'}
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all disabled:opacity-60'
          >
            {saveState === 'saving' && (
              <ArrowPathIcon className='w-3.5 h-3.5 animate-spin' />
            )}
            {saveState === 'saved' && (
              <CheckIcon className='w-3.5 h-3.5 text-emerald-500' />
            )}
            {saveState === 'error' && (
              <span className='w-3.5 h-3.5 text-red-400'>!</span>
            )}
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
        </>
      )}
      <button
        type='button'
        onClick={exportPDF}
        disabled={!canExport}
        className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all shadow-sm shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed'
      >
        <ArrowDownTrayIcon className='w-3.5 h-3.5' />
        <span className='hidden sm:inline'>Export PDF</span>
      </button>
    </>
  );

  return (
    <ToolShell
      title='Split Sheet Calculator'
      subtitle='Master and publishing splits — separate and clear'
      gradient='from-purple-500 to-indigo-600'
      actions={headerActions}
      sidebar={
        <RightPanel
          songTitle={songTitle}
          masterCollabs={masterCollabs}
          publishingCollabs={publishingCollabs}
          includeMaster={includeMaster}
        />
      }
    >
      <div className='max-w-2xl px-4 sm:px-8 lg:px-12 py-6 sm:py-10 space-y-10'>
        {/* Step 01 — Song Details */}
        <div className='space-y-5'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0'>
              <span className='text-xs font-bold text-gray-400 dark:text-slate-400'>
                01
              </span>
            </div>
            <div>
              <p className='text-sm font-bold text-gray-900 dark:text-white leading-none'>
                Song Details
              </p>
              <p className='text-xs text-gray-400 dark:text-slate-500 mt-0.5'>
                Basic information about the track
              </p>
            </div>
          </div>

          {/* Link a track from the system */}
          {session && (
            <div className='space-y-2'>
              <span className='block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500'>
                Link Track
              </span>

              {linkedTrack ? (
                <div className='flex items-center gap-3 p-3 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20'>
                  {(linkedTrack.coverImageUrl || linkedTrack.albumArtwork) && (
                    <img
                      src={
                        linkedTrack.coverImageUrl ??
                        linkedTrack.albumArtwork ??
                        ''
                      }
                      alt=''
                      className='w-10 h-10 rounded-lg object-cover flex-shrink-0'
                    />
                  )}
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
                      {linkedTrack.title}
                    </p>
                    {linkedTrack.artist && (
                      <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                        {linkedTrack.artist}
                      </p>
                    )}
                  </div>
                  <button
                    type='button'
                    onClick={clearTrack}
                    className='flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all'
                  >
                    <TrashIcon className='w-3.5 h-3.5' />
                  </button>
                </div>
              ) : (
                <div className='relative'>
                  <button
                    type='button'
                    onClick={() => setShowTrackPicker(v => !v)}
                    className='w-full flex items-center gap-2.5 px-3.5 py-2.5 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all text-sm'
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
                        d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                      />
                    </svg>
                    Link a track from Flemoji
                    <span className='ml-auto text-[10px] font-medium text-gray-300 dark:text-slate-600'>
                      optional
                    </span>
                  </button>

                  {showTrackPicker && (
                    <div className='absolute top-full left-0 right-0 mt-1.5 z-20 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden'>
                      <div className='p-2.5 border-b border-gray-100 dark:border-slate-700'>
                        <input
                          type='text'
                          value={trackSearch}
                          onChange={e => {
                            setTrackSearch(e.target.value);
                            searchTracks(e.target.value);
                          }}
                          placeholder='Search by title or artist…'
                          className='w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                        />
                      </div>
                      <div className='max-h-48 overflow-y-auto no-scrollbar'>
                        {trackSearching ? (
                          <div className='flex items-center justify-center py-6'>
                            <svg
                              className='w-4 h-4 text-indigo-400 animate-spin'
                              fill='none'
                              viewBox='0 0 24 24'
                            >
                              <circle
                                className='opacity-25'
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='4'
                              />
                              <path
                                className='opacity-75'
                                fill='currentColor'
                                d='M4 12a8 8 0 018-8v8H4z'
                              />
                            </svg>
                          </div>
                        ) : trackResults.length === 0 ? (
                          <p className='px-4 py-4 text-xs text-gray-400 dark:text-gray-500 text-center'>
                            {trackSearch
                              ? 'No tracks found.'
                              : 'Start typing to search…'}
                          </p>
                        ) : (
                          trackResults.map(track => (
                            <button
                              key={track.id}
                              type='button'
                              onClick={() => selectTrack(track)}
                              className='w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left'
                            >
                              {track.coverImageUrl || track.albumArtwork ? (
                                <img
                                  src={
                                    track.coverImageUrl ??
                                    track.albumArtwork ??
                                    ''
                                  }
                                  alt=''
                                  className='w-8 h-8 rounded-md object-cover flex-shrink-0'
                                />
                              ) : (
                                <div className='w-8 h-8 rounded-md bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0'>
                                  <svg
                                    className='w-3.5 h-3.5 text-gray-400'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                                    />
                                  </svg>
                                </div>
                              )}
                              <div className='flex-1 min-w-0'>
                                <p className='text-sm font-medium text-gray-800 dark:text-gray-200 truncate'>
                                  {track.title}
                                </p>
                                {track.artist && (
                                  <p className='text-xs text-gray-400 dark:text-gray-500 truncate'>
                                    {track.artist}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className='grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-4'>
            <div className='space-y-1.5'>
              <label
                htmlFor='split-song-title'
                className='block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500'
              >
                Song Title
              </label>
              <input
                id='split-song-title'
                type='text'
                value={songTitle}
                onChange={e => setSongTitle(e.target.value)}
                placeholder='e.g. Midnight Drive'
                className='w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all'
              />
            </div>
            <div className='space-y-1.5'>
              <label
                htmlFor='split-song-date'
                className='block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500'
              >
                Date
              </label>
              <input
                id='split-song-date'
                type='date'
                value={songDate}
                onChange={e => setSongDate(e.target.value)}
                className='w-full px-3.5 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all'
              />
            </div>
          </div>

          <div className='space-y-1.5'>
            <label className='block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500'>
              ISRC{' '}
              <span className='normal-case font-normal tracking-normal'>
                (International Standard Recording Code)
              </span>
            </label>
            <input
              type='text'
              value={isrc}
              onChange={e => setIsrc(e.target.value.toUpperCase())}
              placeholder='e.g. ZAAR12300001'
              maxLength={12}
              className='w-full sm:w-56 px-3.5 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono tracking-widest transition-all'
            />
          </div>
        </div>

        <div className='border-t border-gray-100 dark:border-slate-800' />

        {/* Step 02 — Publishing */}
        <SplitSection
          step='02'
          label='Publishing / Composition'
          sublabel='Who wrote the song'
          accentBg='bg-teal-100 dark:bg-teal-900/40'
          accentText='text-teal-600 dark:text-teal-400'
          accentRing='focus:ring-teal-500'
          barColor='bg-teal-500'
          collaborators={publishingCollabs}
          roles={PUBLISHING_ROLES}
          showPublisher
          onAdd={addPublishing}
          onRemove={removePublishing}
          onUpdate={updatePublishing}
          onDistribute={distributePublishing}
          onCopyFrom={
            includeMaster && masterHasNames ? copyMasterToPublishing : undefined
          }
          copyFromLabel='Copy from Masters'
        />

        <div className='border-t border-gray-100 dark:border-slate-800' />

        {/* Include master toggle */}
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-sm font-semibold text-gray-800 dark:text-white'>
              Include Master Recording splits
            </p>
            <p className='text-xs text-gray-400 dark:text-slate-500 mt-0.5'>
              Add master ownership if different from publishing
            </p>
          </div>
          <button
            type='button'
            onClick={() => setIncludeMaster(v => !v)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              includeMaster ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'
            }`}
            role='switch'
            aria-checked={includeMaster}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                includeMaster ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Step 03 — Master Recording (conditional) */}
        {includeMaster && (
          <>
            <div className='border-t border-gray-100 dark:border-slate-800' />
            <SplitSection
              step='03'
              label='Master Recording'
              sublabel='Who owns the recording'
              accentBg='bg-indigo-100 dark:bg-indigo-900/40'
              accentText='text-indigo-600 dark:text-indigo-400'
              accentRing='focus:ring-indigo-500'
              barColor='bg-indigo-500'
              collaborators={masterCollabs}
              roles={MASTER_ROLES}
              onAdd={addMaster}
              onRemove={removeMaster}
              onUpdate={updateMaster}
              onDistribute={distributeMaster}
              onCopyFrom={
                publishingHasNames ? copyPublishingToMaster : undefined
              }
              copyFromLabel='Copy from Publishing'
            />
          </>
        )}

        <div className='border-t border-gray-100 dark:border-slate-800' />

        {/* Export note */}
        {!canExport && (
          <p className='text-xs text-gray-400 dark:text-slate-500 text-center'>
            {includeMaster
              ? 'Both sections must total 100% with all names filled in before exporting.'
              : 'Publishing splits must total 100% with all names filled in before exporting.'}
          </p>
        )}
        {!session && (
          <p className='text-xs text-center text-gray-400 dark:text-slate-500'>
            <Link
              href='/login'
              className='text-indigo-600 dark:text-indigo-400 font-semibold hover:underline'
            >
              Sign in
            </Link>{' '}
            to save your split sheets to your account.
          </p>
        )}

        <div className='pb-4' />
      </div>
    </ToolShell>
  );
}
