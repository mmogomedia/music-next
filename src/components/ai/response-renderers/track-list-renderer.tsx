'use client';

import type { TrackListResponse } from '@/types/ai-responses';
import { Button } from '@heroui/react';
import Image from 'next/image';

interface TrackListRendererProps {
  response: TrackListResponse;
  onPlayTrack?: (_trackId: string, _track: any) => void;
}

/**
 * Renders a list of tracks with playback controls
 */
export function TrackListRenderer({
  response,
  onPlayTrack,
}: TrackListRendererProps) {
  const { tracks, metadata } = response.data;

  const handlePlayTrack = (track: any) => {
    if (onPlayTrack) {
      onPlayTrack(track.id, track);
    } else {
      console.warn('onPlayTrack handler not provided');
    }
  };

  if (tracks.length === 0) {
    return (
      <div className='rounded-lg bg-gray-50 dark:bg-slate-800 p-4'>
        <p className='text-gray-600 dark:text-gray-400'>No tracks found.</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {tracks.map(track => (
        <div
          key={track.id}
          className='flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors'
        >
          {/* Cover Image */}
          <div className='flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700'>
            {track.coverImageUrl ? (
              <Image
                src={track.coverImageUrl}
                alt={track.title}
                width={56}
                height={56}
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-gray-400'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path d='M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z' />
                </svg>
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className='flex-1 min-w-0'>
            <h4 className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
              {track.title}
            </h4>
            <p className='text-xs text-gray-600 dark:text-gray-400 truncate'>
              {track.artist ||
                track.artistProfile?.artistName ||
                'Unknown Artist'}
            </p>
            {metadata?.genre && (
              <span className='inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full'>
                {metadata.genre}
              </span>
            )}
          </div>

          {/* Play Button */}
          <Button
            isIconOnly
            size='sm'
            className='flex-shrink-0'
            onClick={() => handlePlayTrack(track)}
            aria-label={`Play ${track.title}`}
          >
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z' />
            </svg>
          </Button>
        </div>
      ))}

      {/* Actions */}
      {response.actions && response.actions.length > 0 && (
        <div className='flex gap-2 pt-2'>
          {response.actions.map((action, index) => (
            <Button
              key={index}
              size='sm'
              variant='bordered'
              onClick={() => {
                // TODO: Implement action handling
              }}
            >
              {action.icon && <span className='mr-1'>{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
