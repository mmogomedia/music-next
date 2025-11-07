'use client';

import React from 'react';
import { Track } from '@/types/track';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/components/ui/Toast';
import TrackArtwork from '@/components/music/TrackArtwork';
import {
  PlayIcon,
  PauseIcon,
  QueueListIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { constructFileUrl } from '@/lib/url-utils';

interface TrackCardProps {
  track: Track;
  onPlay?: (_track: Track) => void;
  size?: 'sm' | 'md' | 'lg';
  showDuration?: boolean;
  variant?: 'default' | 'compact' | 'spotlight';
  badge?: string;
  showActions?: boolean;
  onQueueAdd?: (_track: Track) => void;
  onDownload?: (_track: Track, _downloadUrl?: string) => void;
  onShare?: (_track: Track, _shareUrl?: string) => void;
  onShowStats?: (_track: Track) => void;
}

export default function TrackCard({
  track,
  onPlay,
  size = 'md',
  showDuration = true,
  variant = 'default',
  badge,
  showActions = true,
  onQueueAdd,
  onDownload,
  onShare,
  onShowStats,
}: TrackCardProps) {
        const { currentTrack, isPlaying, playPause, addToQueue } =
          useMusicPlayer();
  const { showToast } = useToast();
  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
  const isCurrentTrack = currentTrack?.id === track.id;

  const normalizeDuration = (value?: number | string | null) => {
    if (value === undefined || value === null) return undefined;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
    return numeric;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    if (isCurrentTrack) {
      // If this is the current track, toggle play/pause
      playPause();
    } else if (onPlay) {
      // Otherwise, play this track
      onPlay(track);
    }
  };

  const getPlayableUrl = () =>
    track.fileUrl || (track.filePath ? constructFileUrl(track.filePath) : '');

  const handleQueueAdd = () => {
    if (onQueueAdd) {
      onQueueAdd(track);
      showToast(`"${track.title}" added to queue`, 'success');
    } else {
      addToQueue(track, false); // Add to end of queue, not play next
      showToast(`"${track.title}" added to queue`, 'success');
    }
  };

  const handleDownload = () => {
    const url = getPlayableUrl();
    if (!url) return;
    if (onDownload) {
      onDownload(track, url);
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = `${track.title || 'track'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (onShare) {
      onShare(track, shareUrl);
      return;
    }
    const shareData = {
      title: track.title,
      text: `Listen to ${track.title} on Flemoji`,
      url: shareUrl,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share(shareData).catch(() => undefined);
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
    }
  };

  const handleShowStats = () => {
    if (onShowStats) {
      onShowStats(track);
      return;
    }
    const stats: string[] = [];
    stats.push(`Plays: ${track.playCount?.toLocaleString?.() ?? 'N/A'}`);
    if (track.likeCount !== undefined) {
      stats.push(`Likes: ${track.likeCount}`);
    }
    if (track.genre) {
      stats.push(`Genre: ${track.genre}`);
    }
    alert(stats.join('\n'));
  };

  const ActionButton = ({
    icon: Icon,
    label,
    onClick,
    disabled,
  }: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
  }) => (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 transition-colors ${
        disabled
          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className='w-4 h-4' />
    </button>
  );

  const buildActionHandler = (callback: () => void) =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();
      callback();
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const subTextSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
  };

  // Default variant (detailed row)
  if (variant === 'default') {
    return (
      <div className='space-y-2'>
      <button
        type='button'
          className={`flex items-center gap-3 rounded-xl bg-white/70 dark:bg-slate-900/50 p-3 border transition-colors cursor-pointer group text-left w-full relative overflow-hidden ${
          isCurrentTrack
              ? 'border-blue-500 dark:border-blue-400 shadow-md shadow-blue-500/20 hover:bg-white/80 dark:hover:bg-slate-800/60'
              : 'border-gray-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/60'
        }`}
        onClick={handleClick}
        aria-label={`Play ${track.title}`}
      >
          {isCurrentlyPlaying && (
            <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-10 animate-pulse' />
          )}
        <div
          className={`flex-shrink-0 ${sizeClasses[size]} rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700`}
        >
          {track.coverImageUrl || track.albumArtwork ? (
            <TrackArtwork
              artworkUrl={track.coverImageUrl || track.albumArtwork}
              title={track.title}
              size={size}
              className='w-full h-full'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
                <svg className='w-6 h-6 text-gray-400' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
              </svg>
            </div>
          )}
        </div>
        <div className='flex-1 min-w-0'>
            {(() => {
              const durationSeconds = normalizeDuration(track.duration);
              return (
                <div className='flex items-center justify-between gap-3'>
          <div
            className={`${textSizeClasses[size]} font-semibold truncate ${
              isCurrentTrack
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {track.title}
          </div>
                  {showDuration && durationSeconds && (
                    <span className='text-[11px] text-gray-500 dark:text-gray-300 flex-shrink-0'>
                      {formatDuration(durationSeconds)}
                    </span>
                  )}
                </div>
              );
            })()}
            <div className={`${subTextSizeClasses[size]} text-gray-600 dark:text-gray-400 truncate mb-1`}>
              {track.artist || 'Unknown Artist'}
            </div>
            <div className='flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 flex-wrap'>
              {typeof track.playCount === 'number' && (
                <span className='flex items-center gap-1'>
                  <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M8 5v14l11-7z' />
                  </svg>
                  {track.playCount.toLocaleString?.() ?? track.playCount}
                </span>
              )}
              {track.genre && (
                <span className='px-2 py-0.5 bg-gray-100 dark:bg-slate-800/60 rounded-full font-semibold uppercase tracking-wide'>
                  {track.genre}
                </span>
              )}
          </div>
        </div>
        {(onPlay || isCurrentTrack) && (
          <div className='p-2 rounded-full'>
            {isCurrentlyPlaying ? (
              <PauseIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
            ) : (
              <PlayIcon className='w-5 h-5 text-gray-700 dark:text-gray-300' />
            )}
          </div>
        )}
      </button>

        {showActions && (
          <div className='flex items-center gap-2'>
            <ActionButton icon={QueueListIcon} label='Add to queue' onClick={handleQueueAdd} />
            <ActionButton
              icon={ArrowDownTrayIcon}
              label='Download track'
              onClick={handleDownload}
              disabled={!getPlayableUrl()}
            />
            <ActionButton icon={ChartBarIcon} label='View stats' onClick={handleShowStats} />
            <ActionButton icon={ShareIcon} label='Share track' onClick={handleShare} />
          </div>
        )}
      </div>
    );
  }

  // Compact variant (smaller, less detailed)
  if (variant === 'compact') {
  return (
      <div className='flex items-center gap-2'>
    <button
      type='button'
          className={`flex-1 flex items-center gap-2 rounded-lg p-2 border transition-colors ${
        isCurrentTrack
              ? 'border-blue-500 dark:border-blue-400 bg-white/80 dark:bg-slate-800/60'
          : 'border-gray-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/60'
      }`}
      onClick={handleClick}
      aria-label={`Play ${track.title}`}
    >
      {isCurrentlyPlaying && (
        <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-10 animate-pulse' />
      )}
      <div
        className={`flex-shrink-0 ${sizeClasses[size]} rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700`}
      >
        {track.coverImageUrl || track.albumArtwork ? (
          <TrackArtwork
            artworkUrl={track.coverImageUrl || track.albumArtwork}
            title={track.title}
            size={size}
            className='w-full h-full'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center'>
                <svg className='w-6 h-6 text-gray-400' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
            </svg>
          </div>
        )}
      </div>
      <div className='flex-1 min-w-0'>
        <div
          className={`${textSizeClasses[size]} font-semibold truncate ${
            isCurrentTrack
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {track.title}
        </div>
            {showDuration && normalizeDuration(track.duration) && (
              <span className='text-[10px] text-gray-500 dark:text-gray-300'>
                {formatDuration(normalizeDuration(track.duration))}
              </span>
            )}
          </div>
        </button>

        {showActions && (
          <div className='flex items-center gap-2'>
            <ActionButton icon={QueueListIcon} label='Add to queue' onClick={handleQueueAdd} />
            <ActionButton
              icon={ArrowDownTrayIcon}
              label='Download track'
              onClick={handleDownload}
              disabled={!getPlayableUrl()}
            />
            <ActionButton icon={ChartBarIcon} label='View stats' onClick={handleShowStats} />
            <ActionButton icon={ShareIcon} label='Share track' onClick={handleShare} />
        </div>
        )}
      </div>
    );
  }

  // Spotlight variant (large tile with overlay info)
  if (variant === 'spotlight') {
    const durationSeconds = normalizeDuration(track.duration);

    const handleKeyActivate = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    };

    return (
      <div className='space-y-3'>
        <div className='relative'>
          <div className='absolute -inset-x-6 -top-8 h-24 bg-gradient-to-r from-blue-500/20 via-purple-400/15 to-pink-400/20 blur-3xl rounded-full pointer-events-none' />

          <div
            role='button'
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={handleKeyActivate}
            className={`group flex h-full flex-col overflow-hidden rounded-[32px] border transition-all duration-500 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 ${
              isCurrentTrack
                ? 'border-blue-500/70 dark:border-blue-400/70 shadow-2xl shadow-blue-500/20'
                : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/10'
            }`}
          >
            <div className='relative w-full min-h-[260px] overflow-hidden bg-gradient-to-br from-blue-300/30 via-purple-300/15 to-blue-400/25 dark:from-blue-900/30 dark:via-purple-900/25 dark:to-blue-900/35'>
              {track.coverImageUrl || track.albumArtwork ? (
                <TrackArtwork
                  artworkUrl={track.coverImageUrl || track.albumArtwork}
                  title={track.title}
                  size='xl'
                  className='absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                />
              ) : (
                <div className='absolute inset-0 flex items-center justify-center'>
                  <svg className='w-16 h-16 text-blue-300 dark:text-blue-500' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
                  </svg>
                </div>
              )}

              <div className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent transition-opacity duration-500 group-hover:opacity-100' />

              {badge && (
                <div className='absolute top-4 left-4 z-20'>
                  <span className='px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 text-[11px] font-bold uppercase shadow-lg'>
                    {badge}
                  </span>
                </div>
              )}

              {isCurrentTrack && (
                <div className='absolute top-4 right-4 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/90 text-white text-[10px] font-semibold uppercase shadow-lg'>
                  {isCurrentlyPlaying && (
                    <div className='flex gap-0.5 items-end h-3'>
                      <span className='w-1 h-3 bg-white rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]' />
                      <span className='w-1 h-4 bg-white rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]' style={{ animationDelay: '0.12s' }} />
                      <span className='w-1 h-3 bg-white rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]' style={{ animationDelay: '0.24s' }} />
                    </div>
                  )}
                  Now Playing
                </div>
              )}

              <div className='absolute inset-0 flex items-center justify-center opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-10 pointer-events-none'>
                <div className='w-18 h-18 rounded-full backdrop-blur-md flex items-center justify-center shadow-2xl ring-2 bg-white/90 dark:bg-slate-900/90 ring-blue-500/30'>
                  <PlayIcon className='w-9 h-9 text-blue-600 dark:text-blue-400 ml-0.5' />
                </div>
              </div>
            </div>

            <div className='flex flex-1 flex-col justify-between bg-white dark:bg-slate-900 px-5 pb-5 pt-4'>
              <div className='space-y-3 text-gray-900 dark:text-white'>
                <div className='space-y-1'>
                  <p className='text-lg font-semibold leading-tight'>{track.title}</p>
                  <p className='text-xs text-gray-600 dark:text-gray-300 truncate uppercase tracking-wide'>
                    {track.artist || 'Unknown Artist'}
                  </p>
                </div>

                <div className='flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 flex-wrap'>
                  {showDuration && durationSeconds && (
                    <span className='flex items-center gap-1 font-semibold text-gray-600 dark:text-gray-300'>
                      <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                      {formatDuration(durationSeconds)}
                    </span>
                  )}
                  {typeof track.playCount === 'number' && (
                    <span className='flex items-center gap-1'>
                      <svg className='w-3.5 h-3.5' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M8 5v14l11-7z' />
            </svg>
              {track.playCount.toLocaleString?.() ?? track.playCount}
            </span>
                  )}
                  {track.genre && (
                    <span className='px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800/60 text-gray-700 dark:text-gray-200 font-semibold uppercase tracking-wide'>
                      {track.genre}
                    </span>
                  )}
                </div>

                <div className='h-4 flex items-end'>
                  {isCurrentlyPlaying && (
                    <div className='flex gap-1 text-blue-500'>
                      <span className='w-1 bg-blue-500/70 rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]' />
                      <span className='w-1 bg-blue-500/70 rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]' style={{ animationDelay: '0.1s' }} />
                      <span className='w-1 bg-blue-500/70 rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]' style={{ animationDelay: '0.2s' }} />
                      <span className='w-1 bg-blue-500/70 rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]' style={{ animationDelay: '0.3s' }} />
          </div>
        )}
                </div>
              </div>

              {showActions && (
                <div className='mt-3 grid grid-cols-4 gap-2'>
                  <ActionButton
                    icon={QueueListIcon}
                    label='Add to queue'
                    onClick={buildActionHandler(handleQueueAdd)}
                  />
                  <ActionButton
                    icon={ArrowDownTrayIcon}
                    label='Download track'
                    onClick={buildActionHandler(handleDownload)}
                    disabled={!getPlayableUrl()}
                  />
                  <ActionButton
                    icon={ChartBarIcon}
                    label='View stats'
                    onClick={buildActionHandler(handleShowStats)}
                  />
                  <ActionButton
                    icon={ShareIcon}
                    label='Share track'
                    onClick={buildActionHandler(handleShare)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
  }
}
