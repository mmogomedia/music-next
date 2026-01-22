'use client';

import Image from 'next/image';
import { Chip } from '@heroui/react';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import type { LeagueTier, LeagueEntry, SubscoreType } from './types';
import { getArtistImageUrl, getStatusLabel, formatPlacesMoved } from './utils';
import StatusIcon from './StatusIcon';
import ScoreWithArrow from './ScoreWithArrow';

interface LeagueTableProps {
  tier: LeagueTier | null;
  onScoreClick: (_entry: LeagueEntry) => void;
  onArtistClick: (_entry: LeagueEntry) => void;
  onSubscoreClick: (_entry: LeagueEntry, _type: SubscoreType) => void;
}

export default function LeagueTable({
  tier,
  onScoreClick,
  onArtistClick,
  onSubscoreClick,
}: LeagueTableProps) {
  if (!tier) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-gray-500 dark:text-gray-400'>
          No league data available yet
        </p>
      </div>
    );
  }

  if (tier.entries.length === 0) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-gray-500 dark:text-gray-400'>
          No entries in this tier yet
        </p>
      </div>
    );
  }

  return (
    <div className='w-full'>
      {/* Mobile table (no horizontal scroll) */}
      <div className='lg:hidden border border-gray-200/70 dark:border-slate-700/70 rounded-xl overflow-hidden bg-white dark:bg-slate-900'>
        <table className='w-full table-fixed border-separate border-spacing-0 text-sm'>
          <thead>
            <tr>
              <th className='text-left py-3 px-4 text-[12px] font-semibold tracking-wide text-gray-600 dark:text-gray-300 bg-gray-50/95 dark:bg-slate-800/60 border-b border-gray-200/70 dark:border-slate-700/70'>
                Artist
              </th>
              <th className='text-right py-3 px-4 text-[12px] font-semibold tracking-wide text-gray-600 dark:text-gray-300 bg-gray-50/95 dark:bg-slate-800/60 border-b border-gray-200/70 dark:border-slate-700/70 w-[88px]'>
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {tier.entries.map(entry => (
              <tr
                key={entry.artist_id}
                className='border-b border-gray-100/70 dark:border-slate-800/60 hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors'
              >
                <td className='py-3 px-4'>
                  <button
                    type='button'
                    onClick={() => onArtistClick(entry)}
                    className='w-full flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition-opacity active:opacity-70 rounded-md hover:bg-blue-50/50 dark:hover:bg-blue-950/20 px-2 -mx-2 py-1 -my-1 group'
                  >
                    <div className='w-6 text-[11px] font-semibold text-gray-400 dark:text-gray-500 flex-shrink-0'>
                      #{entry.rank}
                    </div>
                    <div className='flex items-center gap-2 min-w-0 flex-1'>
                      <div className='w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-gray-200/70 dark:ring-slate-700/70'>
                        {getArtistImageUrl(entry.artist_image) ? (
                          <Image
                            src={getArtistImageUrl(entry.artist_image)!}
                            alt={entry.artist_name}
                            width={28}
                            height={28}
                            className='object-cover'
                          />
                        ) : (
                          <span className='text-[12px] font-semibold text-gray-500 dark:text-gray-300'>
                            {entry.artist_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='font-medium text-gray-800 dark:text-slate-100 truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                          {entry.artist_name}
                        </div>
                        <div className='mt-1 flex items-center gap-2 flex-wrap'>
                          {getStatusLabel(entry.status_change) && (
                            <span
                              className={`text-[10px] font-medium ${
                                entry.status_change === 'UP' ||
                                entry.status_change === 'PROMOTED'
                                  ? 'text-green-600 dark:text-green-400'
                                  : entry.status_change === 'DOWN' ||
                                      entry.status_change === 'DEMOTED'
                                    ? 'text-red-600 dark:text-red-400'
                                    : entry.status_change === 'NEW'
                                      ? 'text-blue-600 dark:text-blue-400'
                                      : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {(() => {
                                const label = getStatusLabel(
                                  entry.status_change
                                );
                                const moved = formatPlacesMoved(
                                  entry.previous_run_rank ??
                                    entry.previous_rank,
                                  entry.rank
                                );
                                if (!label) return '';
                                if (!moved || !moved.moved) return label;
                                const sign = moved.moved > 0 ? '+' : '';
                                return `${label} (${sign}${moved.moved})`;
                              })()}
                            </span>
                          )}

                          {entry.band_state === 'BELOW_RANGE' && (
                            <Chip
                              size='sm'
                              variant='flat'
                              color='warning'
                              startContent={
                                <ExclamationTriangleIcon className='w-3 h-3' />
                              }
                              className='h-6 text-[11px]'
                            >
                              At Risk
                            </Chip>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </td>

                <td className='py-3 px-4 text-right'>
                  <button
                    type='button'
                    className='w-full flex justify-end items-center gap-1.5 cursor-pointer hover:opacity-80 active:opacity-70 transition-opacity group rounded-md hover:bg-blue-50/50 dark:hover:bg-blue-950/20 px-2 -mx-2 py-1 -my-1'
                    onClick={() => onScoreClick(entry)}
                  >
                    <ScoreWithArrow
                      value={entry.score}
                      delta={entry.scoreDelta}
                      className='font-bold text-gray-900 dark:text-white whitespace-nowrap tabular-nums group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'
                    />
                    <InformationCircleIcon className='w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0' />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Desktop table */}
      <div className='hidden lg:block overflow-x-auto'>
        <div className='inline-block min-w-full align-middle border border-gray-200/70 dark:border-slate-700/70 rounded-xl overflow-hidden bg-white dark:bg-slate-900'>
          <table className='w-full min-w-[1040px] table-fixed border-separate border-spacing-0 text-sm'>
            <thead>
              <tr>
                <th className='sticky left-0 z-20 w-[300px] bg-gray-50/95 dark:bg-slate-800/60 backdrop-blur text-left py-3.5 px-4 text-[12px] font-semibold tracking-wide text-gray-600 dark:text-gray-300 border-b border-gray-200/70 dark:border-slate-700/70 border-r border-gray-200/60 dark:border-slate-700/60'>
                  Artist
                </th>
                <th className='sticky left-[300px] z-20 w-[140px] bg-gray-50/95 dark:bg-slate-800/60 backdrop-blur text-left py-3.5 px-4 text-[12px] font-semibold tracking-wide text-gray-600 dark:text-gray-300 whitespace-nowrap border-b border-gray-200/70 dark:border-slate-700/70 border-r border-gray-200/60 dark:border-slate-700/60'>
                  Movement
                </th>
                <th className='bg-gray-50/95 dark:bg-slate-800/60 text-left py-3.5 px-4 text-[12px] font-semibold tracking-wide text-gray-600 dark:text-gray-300 whitespace-nowrap border-b border-gray-200/70 dark:border-slate-700/70'>
                  Audience
                </th>
                <th className='bg-gray-50/95 dark:bg-slate-800/60 text-left py-3.5 px-4 text-[12px] font-semibold tracking-wide text-gray-600 dark:text-gray-300 whitespace-nowrap border-b border-gray-200/70 dark:border-slate-700/70'>
                  Engagement
                </th>
                <th className='bg-gray-50/95 dark:bg-slate-800/60 text-left py-3.5 px-4 text-[12px] font-semibold tracking-wide text-gray-600 dark:text-gray-300 whitespace-nowrap border-b border-gray-200/70 dark:border-slate-700/70'>
                  Consistency
                </th>
                <th className='bg-gray-50/95 dark:bg-slate-800/60 text-left py-3.5 px-4 text-[12px] font-semibold tracking-wide text-gray-600 dark:text-gray-300 whitespace-nowrap border-b border-gray-200/70 dark:border-slate-700/70'>
                  Presence
                </th>
                <th className='sticky right-0 z-20 w-[88px] bg-gray-50/95 dark:bg-slate-800/60 backdrop-blur text-right py-3.5 px-4 text-[12px] font-semibold tracking-wide text-gray-600 dark:text-gray-300 whitespace-nowrap border-b border-gray-200/70 dark:border-slate-700/70 border-l border-gray-200/60 dark:border-slate-700/60'>
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {tier.entries.map(entry => (
                <tr
                  key={entry.artist_id}
                  className='border-b border-gray-100/70 dark:border-slate-800/60 hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors'
                >
                  <td className='sticky left-0 z-10 w-[300px] bg-white dark:bg-slate-900 py-3 px-4 border-r border-gray-200/60 dark:border-slate-700/60'>
                    <button
                      type='button'
                      onClick={() => onArtistClick(entry)}
                      className='w-full flex items-center gap-2 text-left hover:opacity-80 transition-opacity active:opacity-70 cursor-pointer'
                    >
                      <div className='w-6 text-[11px] font-semibold text-gray-400 dark:text-gray-500 flex-shrink-0'>
                        #{entry.rank}
                      </div>
                      <div className='flex items-center gap-2 min-w-0 flex-1'>
                        <div className='w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-gray-200/70 dark:ring-slate-700/70'>
                          {getArtistImageUrl(entry.artist_image) ? (
                            <Image
                              src={getArtistImageUrl(entry.artist_image)!}
                              alt={entry.artist_name}
                              width={28}
                              height={28}
                              className='object-cover'
                            />
                          ) : (
                            <span className='text-[12px] font-semibold text-gray-500 dark:text-gray-300'>
                              {entry.artist_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='font-medium text-gray-800 dark:text-slate-100 truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                            {entry.artist_name}
                          </div>
                          <div className='mt-1 flex items-center gap-2'>
                            {entry.band_state === 'BELOW_RANGE' && (
                              <Chip
                                size='sm'
                                variant='flat'
                                color='warning'
                                startContent={
                                  <ExclamationTriangleIcon className='w-3 h-3' />
                                }
                                className='h-6 text-[11px]'
                              >
                                At Risk
                              </Chip>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </td>

                  <td className='sticky left-[300px] z-10 w-[140px] bg-white dark:bg-slate-900 py-3 px-4 whitespace-nowrap border-r border-gray-200/60 dark:border-slate-700/60'>
                    <Chip
                      size='sm'
                      variant='flat'
                      color={
                        entry.status_change === 'UP' ||
                        entry.status_change === 'PROMOTED'
                          ? 'success'
                          : entry.status_change === 'DOWN' ||
                              entry.status_change === 'DEMOTED'
                            ? 'danger'
                            : 'default'
                      }
                      startContent={
                        <StatusIcon statusChange={entry.status_change} />
                      }
                      className='h-6 text-[11px]'
                    >
                      {(() => {
                        const label = getStatusLabel(entry.status_change);
                        const moved = formatPlacesMoved(
                          entry.previous_run_rank ?? entry.previous_rank,
                          entry.rank
                        );
                        if (!label) return '—';
                        if (!moved || !moved.moved) return label;
                        const sign = moved.moved > 0 ? '+' : '';
                        return `${label} (${sign}${moved.moved})`;
                      })()}
                    </Chip>
                  </td>

                  <td className='py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-300 tabular-nums'>
                    <button
                      type='button'
                      onClick={() => onSubscoreClick(entry, 'audience')}
                      className='w-full flex items-center gap-1.5 cursor-pointer rounded-md hover:bg-blue-50/50 dark:hover:bg-blue-950/20 px-2 -mx-2 py-1 -my-1 transition-colors group'
                    >
                      <ScoreWithArrow
                        value={entry.run_followerScore ?? entry.followerScore}
                        delta={entry.followerScoreDelta}
                        className='tabular-nums group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'
                      />
                    </button>
                  </td>
                  <td className='py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-300 tabular-nums'>
                    <button
                      type='button'
                      onClick={() => onSubscoreClick(entry, 'engagement')}
                      className='w-full flex items-center gap-1.5 cursor-pointer rounded-md hover:bg-blue-50/50 dark:hover:bg-blue-950/20 px-2 -mx-2 py-1 -my-1 transition-colors group'
                    >
                      <ScoreWithArrow
                        value={
                          entry.run_engagementScore ?? entry.engagementScore
                        }
                        delta={entry.engagementScoreDelta}
                        className='tabular-nums group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'
                      />
                    </button>
                  </td>
                  <td className='py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-300 tabular-nums'>
                    <button
                      type='button'
                      onClick={() => onSubscoreClick(entry, 'consistency')}
                      className='w-full flex items-center gap-1.5 cursor-pointer rounded-md hover:bg-blue-50/50 dark:hover:bg-blue-950/20 px-2 -mx-2 py-1 -my-1 transition-colors group'
                    >
                      <ScoreWithArrow
                        value={
                          entry.run_consistencyScore ?? entry.consistencyScore
                        }
                        delta={entry.consistencyScoreDelta}
                        className='tabular-nums group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'
                      />
                    </button>
                  </td>
                  <td className='py-3 px-4 whitespace-nowrap text-gray-600 dark:text-gray-300 tabular-nums'>
                    <button
                      type='button'
                      onClick={() => onSubscoreClick(entry, 'presence')}
                      className='w-full flex items-center gap-1.5 cursor-pointer rounded-md hover:bg-blue-50/50 dark:hover:bg-blue-950/20 px-2 -mx-2 py-1 -my-1 transition-colors group'
                    >
                      <ScoreWithArrow
                        value={
                          entry.run_platformDiversityScore ??
                          entry.platformDiversityScore
                        }
                        delta={entry.platformDiversityScoreDelta}
                        className='tabular-nums group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'
                      />
                    </button>
                  </td>

                  <td className='sticky right-0 z-10 w-[88px] bg-white dark:bg-slate-900 py-3 px-4 text-right border-l border-gray-200/60 dark:border-slate-700/60'>
                    <button
                      type='button'
                      className='w-full flex items-center justify-end gap-1.5 cursor-pointer rounded-md hover:bg-blue-50/50 dark:hover:bg-blue-950/20 px-2 -mx-2 py-1 -my-1 transition-colors group'
                      onClick={() => onScoreClick(entry)}
                    >
                      <ScoreWithArrow
                        value={entry.score}
                        delta={entry.scoreDelta}
                        className='font-bold text-gray-900 dark:text-white whitespace-nowrap tabular-nums group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
