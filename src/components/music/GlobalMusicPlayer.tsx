'use client';

import React from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import {
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsRightLeftIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import TrackArtwork from './TrackArtwork';
import QueueView from './QueueView';

export default function GlobalMusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playPause,
    seekTo,
    setVolume,
    next,
    previous,
    shuffle,
    toggleShuffle,
    repeatMode,
    setRepeatMode,
    queue,
  } = useMusicPlayer();

  const [isQueueOpen, setIsQueueOpen] = React.useState(false);

  if (!currentTrack) return null;

  return (
    <div className='fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 z-50'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-center gap-4'>
          {/* Track Info */}
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            <div className='relative flex-shrink-0'>
              <TrackArtwork
                artworkUrl={
                  currentTrack.albumArtwork || currentTrack.coverImageUrl
                }
                title={currentTrack.title}
                size='md'
              />
              <div className='absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity'>
                {isPlaying ? (
                  <PauseIcon className='w-6 h-6 text-white' />
                ) : (
                  <PlayIcon className='w-6 h-6 text-white ml-0.5' />
                )}
              </div>
            </div>
            <div className='min-w-0 flex-1'>
              <h4 className='font-semibold text-gray-900 dark:text-white truncate'>
                {currentTrack.title}
              </h4>
              <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                {currentTrack.artist || 'Unknown Artist'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className='flex items-center gap-4 flex-1 max-w-md'>
            {/* Previous */}
            <button
              onClick={previous}
              className='w-10 h-10 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-100 transition-colors'
              aria-label='Previous track'
            >
              <ChevronLeftIcon className='w-5 h-5' />
            </button>
            <button
              onClick={playPause}
              className='w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white transition-colors'
            >
              {isPlaying ? (
                <PauseIcon className='w-5 h-5' />
              ) : (
                <PlayIcon className='w-5 h-5 ml-0.5' />
              )}
            </button>
            {/* Next */}
            <button
              onClick={next}
              className='w-10 h-10 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-100 transition-colors'
              aria-label='Next track'
            >
              <ChevronRightIcon className='w-5 h-5' />
            </button>

            {/* Progress Bar */}
            <div className='flex-1'>
              <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                <span>
                  {Math.floor(currentTime / 60)}:
                  {(currentTime % 60).toFixed(0).padStart(2, '0')}
                </span>
                <div
                  className='flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1 cursor-pointer'
                  role='slider'
                  tabIndex={0}
                  aria-label='Seek to position in track'
                  aria-valuemin={0}
                  aria-valuemax={duration}
                  aria-valuenow={currentTime}
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newTime = (clickX / rect.width) * duration;
                    seekTo(newTime);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault();
                      const change = e.key === 'ArrowLeft' ? -5 : 5;
                      const newTime = Math.max(
                        0,
                        Math.min(duration, currentTime + change)
                      );
                      seekTo(newTime);
                    }
                  }}
                >
                  <div
                    className='bg-blue-600 h-1 rounded-full transition-all duration-300'
                    style={{
                      width:
                        duration > 0
                          ? `${(currentTime / duration) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
                <span>
                  {Math.floor(duration / 60)}:
                  {(duration % 60).toFixed(0).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Volume + Shuffle/Repeat */}
          <div className='flex items-center gap-3 min-w-0'>
            {/* Queue Button */}
            <button
              onClick={() => setIsQueueOpen(true)}
              className='relative w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
              aria-label='View queue'
              title={`Queue (${queue.length})`}
            >
              <QueueListIcon className='w-4 h-4' />
              {queue.length > 0 && (
                <span className='absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center'>
                  {queue.length > 9 ? '9+' : queue.length}
                </span>
              )}
            </button>
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${shuffle ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100'}`}
              aria-pressed={shuffle}
              aria-label='Toggle shuffle'
              title='Shuffle'
            >
              <ArrowsRightLeftIcon className='w-4 h-4' />
            </button>
            {/* Repeat */}
            <select
              aria-label='Repeat mode'
              className='text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded px-2 py-1'
              value={repeatMode}
              onChange={e => setRepeatMode(e.target.value as any)}
            >
              <option value='off'>Repeat: Off</option>
              <option value='one'>Repeat: One</option>
              <option value='all'>Repeat: All</option>
            </select>
            {/* Volume */}
            <span className='text-xs text-gray-500 dark:text-gray-400'>
              Vol
            </span>
            <input
              type='range'
              min='0'
              max='1'
              step='0.1'
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className='w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer'
            />
          </div>
        </div>
      </div>

      {/* Queue View */}
      <QueueView isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
    </div>
  );
}
