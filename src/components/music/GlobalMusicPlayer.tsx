'use client';

import React from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

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
  } = useMusicPlayer();

  if (!currentTrack) return null;

  return (
    <div className='fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 z-50'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-center gap-4'>
          {/* Track Info */}
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            <div className='w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0'>
              {isPlaying ? (
                <PauseIcon className='w-6 h-6 text-white' />
              ) : (
                <PlayIcon className='w-6 h-6 text-white ml-0.5' />
              )}
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

          {/* Volume */}
          <div className='flex items-center gap-2 min-w-0'>
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
    </div>
  );
}
