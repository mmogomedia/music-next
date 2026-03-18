'use client';

import Image from 'next/image';
import FlemojiModal, {
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@/components/shared/FlemojiModal';
import { Chip } from '@heroui/react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import type { LeagueEntry, LeagueTier } from '../types';
import { getArtistImageUrl, formatPlacesMoved } from '../utils';
import ScoreWithArrow from '../ScoreWithArrow';

interface ScoreComparisonModalProps {
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
  entry: LeagueEntry | null;
  currentTier: LeagueTier | null;
}

export default function ScoreComparisonModal({
  isOpen,
  onOpenChange,
  entry,
  currentTier,
}: ScoreComparisonModalProps) {
  return (
    <FlemojiModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement='center'
      size='lg'
      scrollBehavior='inside'
      classNames={{
        base: 'bg-white dark:bg-slate-900 rounded-lg',
        header: 'border-b border-gray-200/60 dark:border-slate-800/60',
        body: 'py-5',
      }}
    >
      <ModalContent>
        <ModalHeader className='p-0 overflow-hidden rounded-t-lg'>
          <div className='w-full px-6 py-5 bg-gradient-to-r from-blue-50/70 via-purple-50/40 to-indigo-50/70 dark:from-blue-950/40 dark:via-purple-950/25 dark:to-indigo-950/40 border-b border-gray-200/60 dark:border-slate-800/60'>
            <div className='inline-flex items-center gap-2 mb-2 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-300/30 dark:border-blue-700/30'>
              <InformationCircleIcon className='w-4 h-4 text-blue-600 dark:text-blue-400' />
              <span className='text-[10px] font-bold tracking-wider text-blue-700 dark:text-blue-300 uppercase'>
                Score breakdown
              </span>
            </div>
            <div className='flex items-center gap-3'>
              {getArtistImageUrl(entry?.artist_image) ? (
                <div className='w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/50 dark:ring-slate-800/50'>
                  <Image
                    src={getArtistImageUrl(entry?.artist_image)!}
                    alt={entry?.artist_name ?? 'Artist'}
                    width={48}
                    height={48}
                    className='object-cover'
                  />
                </div>
              ) : entry?.artist_name ? (
                <div className='w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 ring-2 ring-white/50 dark:ring-slate-800/50'>
                  <span className='text-lg font-semibold text-gray-500 dark:text-gray-300'>
                    {entry.artist_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              ) : null}
              <h2 className='text-xl md:text-2xl font-black leading-tight flex-1'>
                <span className='bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent'>
                  {entry?.artist_name ?? 'Score details'}
                </span>
              </h2>
            </div>
            <div className='mt-2 text-xs text-gray-600 dark:text-gray-400'>
              <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                <span>
                  <span className='font-medium text-gray-700 dark:text-gray-300'>
                    Current run:
                  </span>{' '}
                  {currentTier?.run_at
                    ? new Date(currentTier.run_at).toLocaleString()
                    : '—'}
                </span>
                <span className='opacity-60'>•</span>
                <span>
                  <span className='font-medium text-gray-700 dark:text-gray-300'>
                    Previous run:
                  </span>{' '}
                  {currentTier?.previous_run_at
                    ? new Date(currentTier.previous_run_at).toLocaleString()
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className='px-6'>
          {entry && (
            <div className='space-y-4'>
              <div className='flex flex-wrap items-center gap-2'>
                {(() => {
                  const moved = formatPlacesMoved(
                    entry.previous_run_rank ?? entry.previous_rank,
                    entry.rank
                  );
                  const prevRank =
                    entry.previous_run_rank ?? entry.previous_rank ?? null;
                  return (
                    <>
                      <Chip
                        size='sm'
                        variant='flat'
                        className='h-7 text-[11px]'
                      >
                        Rank #{entry.rank}
                        {prevRank != null ? ` (prev #${prevRank})` : ''}
                      </Chip>
                      <Chip
                        size='sm'
                        variant='flat'
                        color={
                          moved?.moved != null && moved.moved > 0
                            ? 'success'
                            : moved?.moved != null && moved.moved < 0
                              ? 'danger'
                              : 'default'
                        }
                        className='h-7 text-[11px]'
                        startContent={
                          moved?.moved != null && moved.moved > 0 ? (
                            <ArrowUpIcon className='w-4 h-4' />
                          ) : moved?.moved != null && moved.moved < 0 ? (
                            <ArrowDownIcon className='w-4 h-4' />
                          ) : (
                            <MinusIcon className='w-4 h-4' />
                          )
                        }
                      >
                        {moved ? moved.label : 'No previous run'}
                      </Chip>
                    </>
                  );
                })()}
              </div>

              <div className='rounded-xl border border-gray-200/70 dark:border-slate-700/70 overflow-hidden bg-white dark:bg-slate-900'>
                <div className='grid grid-cols-3 gap-0 text-[11px] bg-gray-50/80 dark:bg-slate-800/40 border-b border-gray-200/70 dark:border-slate-700/70'>
                  <div className='px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200'>
                    Metric
                  </div>
                  <div className='px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200 text-right'>
                    Previous
                  </div>
                  <div className='px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200 text-right'>
                    Current
                  </div>
                </div>

                {[
                  {
                    label: 'Total score',
                    prev: entry.previous_run_score,
                    cur: entry.run_score ?? entry.score,
                  },
                  {
                    label: 'Audience',
                    prev: entry.previous_run_followerScore,
                    cur: entry.run_followerScore,
                  },
                  {
                    label: 'Engagement',
                    prev: entry.previous_run_engagementScore,
                    cur: entry.run_engagementScore,
                  },
                  {
                    label: 'Consistency',
                    prev: entry.previous_run_consistencyScore,
                    cur: entry.run_consistencyScore,
                  },
                  {
                    label: 'Presence',
                    prev: entry.previous_run_platformDiversityScore,
                    cur: entry.run_platformDiversityScore,
                  },
                ].map((row, idx) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-3 gap-0 text-sm border-b last:border-b-0 border-gray-200/50 dark:border-slate-700/50 ${
                      idx % 2 === 0
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-gray-50/40 dark:bg-slate-800/20'
                    }`}
                  >
                    <div className='px-4 py-3 text-gray-700 dark:text-gray-200'>
                      {row.label}
                    </div>
                    <div className='px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300'>
                      {row.prev == null ? '—' : row.prev.toFixed(1)}
                    </div>
                    <div className='px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white'>
                      <div className='flex justify-end'>
                        <ScoreWithArrow
                          value={row.cur ?? null}
                          delta={
                            row.cur == null || row.prev == null
                              ? null
                              : row.cur - row.prev
                          }
                          className='tabular-nums'
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className='text-[11px] text-gray-500 dark:text-gray-400'>
                Tip: scores are compared using the latest eligibility snapshot
                at (or before) each run time.
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </FlemojiModal>
  );
}
