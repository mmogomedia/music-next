'use client';

import React from 'react';
import { Button } from '@heroui/react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import TrackArtwork from './TrackArtwork';
import ArtistDisplay from '@/components/track/ArtistDisplay';
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  QueueListIcon,
  ShareIcon,
  XMarkIcon,
  TrashIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playPause,
    next,
    previous,
    shuffle,
    toggleShuffle,
    repeatMode,
    setRepeatMode,
    queue,
    queueIndex,
    playTrack,
    removeFromQueue,
  } = useMusicPlayer();

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isQueueOpen, setIsQueueOpen] = React.useState(false);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Detect mobile for responsive layout
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`relative ${isMobile ? 'w-full' : 'w-full max-w-md'}`}>
      <div
        className={`flex items-center border border-gray-200/60 dark:border-slate-700/60 rounded-lg ${
          isMobile ? 'px-2 py-1.5' : 'px-3 py-2'
        }`}
      >
        {/* Artwork */}
        {currentTrack ? (
          <div className={`flex-shrink-0 ${isMobile ? 'mr-2' : 'mr-3'}`}>
            <TrackArtwork
              artworkUrl={
                currentTrack.albumArtwork || currentTrack.coverImageUrl
              }
              title={currentTrack.title}
              size={isMobile ? 'xs' : 'sm'}
            />
          </div>
        ) : (
          <div
            className={`flex-shrink-0 ${
              isMobile ? 'mr-2 w-8 h-8' : 'mr-3 w-10 h-10'
            } bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center`}
          >
            <svg
              className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 dark:text-gray-500`}
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
            </svg>
          </div>
        )}

        {/* Track info */}
        <div className='min-w-0 flex-1 overflow-hidden'>
          {currentTrack ? (
            <>
              <div
                className={`${
                  isMobile ? 'text-xs' : 'text-sm'
                } font-semibold text-gray-900 dark:text-white truncate leading-tight whitespace-nowrap`}
                title={currentTrack.title}
              >
                {currentTrack.title}
              </div>
              <div
                className={`${
                  isMobile ? 'text-[10px]' : 'text-xs'
                } text-gray-600 dark:text-gray-400 truncate leading-tight mt-0.5 whitespace-nowrap`}
                title={currentTrack.artist || 'Unknown Artist'}
              >
                {currentTrack.artist || 'Unknown Artist'}
                {!isMobile && (
                  <span className='text-[10px] text-gray-500 dark:text-gray-500 font-mono ml-2 flex-shrink-0'>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div
                className={`${
                  isMobile ? 'text-xs' : 'text-sm'
                } font-semibold text-gray-900 dark:text-white truncate leading-tight whitespace-nowrap`}
              >
                No track playing
              </div>
              <div
                className={`${
                  isMobile ? 'text-[10px]' : 'text-xs'
                } text-gray-500 dark:text-gray-400 truncate leading-tight mt-0.5 whitespace-nowrap`}
              >
                Select a track to play
              </div>
            </>
          )}
        </div>

        {/* Controls - grouped together */}
        <div
          className={`flex items-center gap-0.5 flex-shrink-0 bg-gray-200/70 dark:bg-slate-700/70 rounded-lg px-1.5 py-1 ${
            isMobile ? 'ml-2' : 'ml-3'
          }`}
        >
          {/* Previous button - hidden on mobile */}
          {!isMobile && (
            <Button
              isIconOnly
              size='sm'
              variant='light'
              radius='full'
              className='bg-transparent hover:bg-gray-300 dark:hover:bg-slate-600 h-7 w-7 min-w-7'
              aria-label='Previous'
              isDisabled={!currentTrack}
              onClick={previous}
            >
              <svg
                className='w-3.5 h-3.5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </Button>
          )}

          {/* Play/Pause button - always visible */}
          <Button
            isIconOnly
            size='sm'
            variant='light'
            radius='full'
            className={`bg-transparent hover:bg-gray-300 dark:hover:bg-slate-600 ${
              isMobile ? 'h-6 w-6 min-w-6' : 'h-7 w-7 min-w-7'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={playPause}
            isDisabled={!currentTrack}
          >
            {isPlaying ? (
              <svg
                className={isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'}
                fill='currentColor'
                viewBox='0 0 24 24'
              >
                <path d='M6 4h4v16H6V4zm8 0h4v16h-4V4z' />
              </svg>
            ) : (
              <svg
                className={isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'}
                fill='currentColor'
                viewBox='0 0 24 24'
              >
                <path d='M8 5v14l11-7z' />
              </svg>
            )}
          </Button>

          {/* Next button - hidden on mobile */}
          {!isMobile && (
            <Button
              isIconOnly
              size='sm'
              variant='light'
              radius='full'
              className='bg-transparent hover:bg-gray-300 dark:hover:bg-slate-600 h-7 w-7 min-w-7'
              aria-label='Next'
              isDisabled={!currentTrack}
              onClick={next}
            >
              <svg
                className='w-3.5 h-3.5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </Button>
          )}

          {/* Divider - only on desktop */}
          {!isMobile && (
            <div className='w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1' />
          )}

          {/* 3-dot menu button - always visible */}
          <Button
            isIconOnly
            size='sm'
            variant='light'
            radius='full'
            className={`bg-transparent hover:bg-gray-300 dark:hover:bg-slate-600 ${
              isMobile ? 'h-6 w-6 min-w-6' : 'h-7 w-7 min-w-7'
            }`}
            aria-label='More options'
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className={isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'}
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z' />
            </svg>
          </Button>
        </div>
      </div>

      {/* Sliding div below player */}
      {isMenuOpen && (
        <div
          className={`absolute left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 shadow-lg transition-transform duration-300 ease-out rounded-b-lg overflow-hidden ${
            isMenuOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{
            top: '100%',
            maxHeight: isMobile ? '60vh' : '320px',
          }}
        >
          {/* Compact Header */}
          <div className='flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-slate-700'>
            <h3 className='text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide'>
              Options
            </h3>
            <button
              onClick={() => setIsMenuOpen(false)}
              className='p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors'
              aria-label='Close menu'
            >
              <XMarkIcon className='w-4 h-4' />
            </button>
          </div>

          {/* Compact Content */}
          <div
            className='overflow-y-auto'
            style={{ maxHeight: isMobile ? 'calc(60vh - 40px)' : '280px' }}
          >
            <div className='p-2'>
              {/* Previous/Next - only shown on mobile */}
              {isMobile && (
                <div className='flex gap-1 mb-2'>
                  <button
                    onClick={() => {
                      previous();
                      setIsMenuOpen(false);
                    }}
                    disabled={!currentTrack}
                    className='flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <ArrowUturnLeftIcon className='w-4 h-4 text-gray-700 dark:text-gray-300' />
                    <span className='text-xs font-medium text-gray-700 dark:text-gray-300'>
                      Prev
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      next();
                      setIsMenuOpen(false);
                    }}
                    disabled={!currentTrack}
                    className='flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <ArrowUturnRightIcon className='w-4 h-4 text-gray-700 dark:text-gray-300' />
                    <span className='text-xs font-medium text-gray-700 dark:text-gray-300'>
                      Next
                    </span>
                  </button>
                </div>
              )}

              {/* Compact Control Grid */}
              <div className='grid grid-cols-2 gap-1.5 mb-2'>
                {/* Shuffle */}
                <button
                  onClick={toggleShuffle}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    shuffle
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <ArrowPathIcon className='w-4 h-4' />
                  <span className='text-xs font-medium'>Shuffle</span>
                </button>

                {/* Repeat - cycles through modes */}
                <button
                  onClick={() => {
                    if (repeatMode === 'off') setRepeatMode('one');
                    else if (repeatMode === 'one') setRepeatMode('all');
                    else setRepeatMode('off');
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    repeatMode !== 'off'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    {repeatMode === 'one' ? (
                      <>
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 9l6 6m0-6l-6 6'
                        />
                      </>
                    ) : (
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                      />
                    )}
                  </svg>
                  <span className='text-xs font-medium'>
                    {repeatMode === 'off'
                      ? 'Repeat'
                      : repeatMode === 'one'
                        ? 'Repeat 1'
                        : 'Repeat All'}
                  </span>
                </button>
              </div>

              {/* Quick Actions */}
              <div className='flex gap-1.5'>
                <button
                  onClick={() => setIsQueueOpen(!isQueueOpen)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors ${
                    isQueueOpen
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <QueueListIcon className='w-3.5 h-3.5' />
                  <span className='text-xs font-medium'>Queue</span>
                  {queue.length > 0 && (
                    <span className='text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full'>
                      {queue.length > 9 ? '9+' : queue.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    // TODO: Implement share functionality
                  }}
                  className='flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors'
                >
                  <ShareIcon className='w-3.5 h-3.5 text-gray-700 dark:text-gray-300' />
                  <span className='text-xs text-gray-700 dark:text-gray-300'>
                    Share
                  </span>
                </button>
              </div>

              {/* Queue Section */}
              {isQueueOpen && (
                <div className='mt-3 border-t border-gray-200 dark:border-slate-700 pt-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide'>
                      Queue ({queue.length})
                    </h4>
                  </div>
                  {queue.length === 0 ? (
                    <div className='text-center py-6'>
                      <QueueListIcon className='w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2' />
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        Your queue is empty
                      </p>
                      <p className='text-[10px] text-gray-400 dark:text-gray-500 mt-1'>
                        Add tracks to see them here
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-1 max-h-48 overflow-y-auto'>
                      {queue.map((track, index) => {
                        const isCurrent =
                          currentTrack?.id === track.id && index === queueIndex;
                        const formatDuration = (seconds?: number) => {
                          if (!seconds) return '0:00';
                          const mins = Math.floor(seconds / 60);
                          const secs = Math.floor(seconds % 60);
                          return `${mins}:${secs.toString().padStart(2, '0')}`;
                        };
                        const durationSeconds =
                          typeof track.duration === 'number' &&
                          track.duration > 0
                            ? track.duration
                            : undefined;

                        return (
                          <button
                            key={`${track.id}-${index}`}
                            type='button'
                            onClick={() => {
                              if (currentTrack?.id !== track.id) {
                                playTrack(track);
                              }
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                              isCurrent
                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {/* Track Number / Play Indicator */}
                            <div className='flex-shrink-0 w-5 flex items-center justify-center'>
                              {isCurrent && isPlaying ? (
                                <div className='flex gap-0.5'>
                                  <span className='w-0.5 h-3 bg-blue-500 rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]' />
                                  <span
                                    className='w-0.5 h-3 bg-blue-500 rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]'
                                    style={{ animationDelay: '0.15s' }}
                                  />
                                  <span
                                    className='w-0.5 h-3 bg-blue-500 rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]'
                                    style={{ animationDelay: '0.3s' }}
                                  />
                                </div>
                              ) : (
                                <span className='text-[10px] text-gray-400 dark:text-gray-500 font-medium'>
                                  {index + 1}
                                </span>
                              )}
                            </div>

                            {/* Artwork */}
                            <div className='flex-shrink-0 w-8 h-8 rounded overflow-hidden bg-gray-200 dark:bg-slate-700'>
                              {track.coverImageUrl || track.albumArtwork ? (
                                <TrackArtwork
                                  artworkUrl={
                                    track.coverImageUrl || track.albumArtwork
                                  }
                                  title={track.title}
                                  size='xs'
                                  className='w-full h-full'
                                />
                              ) : (
                                <div className='w-full h-full flex items-center justify-center'>
                                  <PlayIcon className='w-4 h-4 text-gray-400 dark:text-gray-500' />
                                </div>
                              )}
                            </div>

                            {/* Track Info */}
                            <div className='flex-1 min-w-0'>
                              <div
                                className={`text-xs font-medium truncate ${
                                  isCurrent
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-900 dark:text-white'
                                }`}
                              >
                                {track.title}
                              </div>
                              <div className='text-[10px] text-gray-500 dark:text-gray-400 truncate'>
                                <ArtistDisplay track={track} />
                              </div>
                            </div>

                            {/* Duration */}
                            {durationSeconds && (
                              <div className='flex-shrink-0 text-[10px] text-gray-500 dark:text-gray-400'>
                                {formatDuration(durationSeconds)}
                              </div>
                            )}

                            {/* Remove Button */}
                            <button
                              type='button'
                              onClick={e => {
                                e.stopPropagation();
                                if (removeFromQueue) {
                                  removeFromQueue(track.id);
                                }
                              }}
                              className='flex-shrink-0 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors'
                              aria-label={`Remove ${track.title} from queue`}
                            >
                              <TrashIcon className='w-3.5 h-3.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400' />
                            </button>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
