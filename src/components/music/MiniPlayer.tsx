'use client';

import React from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import TrackArtwork from './TrackArtwork';

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playPause,
  } = useMusicPlayer();

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='flex items-center border border-gray-200/60 dark:border-slate-700/60 rounded-lg px-3 py-2'>
      {/* Artwork */}
      {currentTrack ? (
        <div className='flex-shrink-0 mr-3'>
          <TrackArtwork
            artworkUrl={currentTrack.albumArtwork || currentTrack.coverImageUrl}
            title={currentTrack.title}
            size='sm'
          />
        </div>
      ) : (
        <div className='flex-shrink-0 mr-3 w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center'>
          <svg
            className='w-5 h-5 text-gray-400 dark:text-gray-500'
            fill='currentColor'
            viewBox='0 0 24 24'
          >
            <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
          </svg>
        </div>
      )}

      {/* Track info */}
      <div className='min-w-0'>
        {currentTrack ? (
          <>
            <div className='text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight'>
              {currentTrack.title}
            </div>
            <div className='flex items-center gap-2 text-xs leading-tight mt-0.5'>
              <span className='text-gray-600 dark:text-gray-400 truncate'>
                {currentTrack.artist || 'Unknown Artist'}
              </span>
              <span className='text-[10px] text-gray-500 dark:text-gray-500 font-mono flex-shrink-0'>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className='text-sm font-semibold text-gray-900 dark:text-white leading-tight'>
              No track playing
            </div>
            <div className='text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5'>
              Select a track to play
            </div>
          </>
        )}
      </div>

      {/* Controls - grouped together */}
      <div className='flex items-center gap-0.5 flex-shrink-0 bg-gray-200/70 dark:bg-slate-700/70 rounded-lg px-1.5 py-1 ml-3'>
        <Button
          isIconOnly
          size='sm'
          variant='light'
          radius='full'
          className='bg-transparent hover:bg-gray-300 dark:hover:bg-slate-600 h-7 w-7 min-w-7'
          aria-label='Previous'
          isDisabled
        >
          <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
        </Button>
        <Button
          isIconOnly
          size='sm'
          variant='light'
          radius='full'
          className='bg-transparent hover:bg-gray-300 dark:hover:bg-slate-600 h-7 w-7 min-w-7'
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={playPause}
          isDisabled={!currentTrack}
        >
          {isPlaying ? (
            <svg className='w-3.5 h-3.5' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M6 4h4v16H6V4zm8 0h4v16h-4V4z' />
            </svg>
          ) : (
            <svg className='w-3.5 h-3.5' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M8 5v14l11-7z' />
            </svg>
          )}
        </Button>
        <Button
          isIconOnly
          size='sm'
          variant='light'
          radius='full'
          className='bg-transparent hover:bg-gray-300 dark:hover:bg-slate-600 h-7 w-7 min-w-7'
          aria-label='Next'
          isDisabled
        >
          <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
          </svg>
        </Button>
        <div className='w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1' />
        <Dropdown>
          <DropdownTrigger>
            <Button
              isIconOnly
              size='sm'
              variant='light'
              radius='full'
              className='bg-transparent hover:bg-gray-300 dark:hover:bg-slate-600 h-7 w-7 min-w-7'
              aria-label='More options'
            >
              <svg className='w-3.5 h-3.5' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z' />
              </svg>
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label='Player options'>
            <DropdownItem key='repeat'>Repeat</DropdownItem>
            <DropdownItem key='shuffle'>Shuffle</DropdownItem>
            <DropdownItem key='queue'>View Queue</DropdownItem>
            <DropdownItem key='share'>Share</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </div>
  );
}

