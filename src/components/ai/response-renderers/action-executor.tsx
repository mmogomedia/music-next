'use client';

import type { ActionResponse } from '@/types/ai-responses';
import { useEffect } from 'react';

interface ActionExecutorProps {
  response: ActionResponse;
  onPlayTrack?: (_trackId: string) => void;
  onPlayPlaylist?: (_playlistId: string) => void;
  onOpenArtist?: (_artistId: string) => void;
}

/**
 * Executes actions from AI responses
 */
export function ActionExecutor({
  response,
  onPlayTrack,
  onPlayPlaylist,
  onOpenArtist,
}: ActionExecutorProps) {
  const { action } = response;

  useEffect(() => {
    // Execute action based on type
    switch (action.type) {
      case 'play_track':
        if (action.data.trackId && onPlayTrack) {
          onPlayTrack(action.data.trackId as unknown as string);
        }
        break;

      case 'play_playlist':
        if (action.data.playlistId && onPlayPlaylist) {
          onPlayPlaylist(action.data.playlistId as unknown as string);
        }
        break;

      case 'view_artist':
        if (action.data.artistId && onOpenArtist) {
          onOpenArtist(action.data.artistId as unknown as string);
        }
        break;

      default:
        // Unhandled action type
        break;
    }
  }, [action, onPlayTrack, onPlayPlaylist, onOpenArtist]);

  // Return a visual indicator that action is executing
  return (
    <div className='rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 flex items-center gap-2'>
      <svg
        className='w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin'
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
          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
      <span className='text-sm text-blue-800 dark:text-blue-300'>
        {response.message || 'Executing action...'}
      </span>
    </div>
  );
}
