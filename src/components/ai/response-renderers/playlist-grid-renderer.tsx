'use client';

import type { PlaylistGridResponse } from '@/types/ai-responses';

interface PlaylistGridRendererProps {
  response: PlaylistGridResponse;
  onSelectPlaylist?: (_playlistId: string) => void;
}

/**
 * Renders a grid of playlists for browsing
 */
export function PlaylistGridRenderer({
  response,
  onSelectPlaylist,
}: PlaylistGridRendererProps) {
  const { playlists } = response.data;

  if (playlists.length === 0) {
    return (
      <div className='rounded-lg bg-gray-50 dark:bg-slate-800 p-4'>
        <p className='text-gray-600 dark:text-gray-400'>No playlists found.</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
      {playlists.map(playlist => (
        <button
          type='button'
          key={playlist.id}
          className='rounded-lg bg-gray-50 dark:bg-slate-800 p-4 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer w-full text-left'
          onClick={() => onSelectPlaylist?.(playlist.id)}
          aria-label={`Select playlist ${playlist.name}`}
        >
          <div className='flex items-start gap-3'>
            {/* Playlist Icon */}
            <div className='w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0'>
              <svg
                className='w-6 h-6 text-blue-600 dark:text-blue-400'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path d='M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' />
              </svg>
            </div>

            {/* Playlist Info */}
            <div className='flex-1 min-w-0'>
              <h4 className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
                {playlist.name}
              </h4>
              {playlist.description && (
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2'>
                  {playlist.description}
                </p>
              )}
              <p className='text-xs text-gray-500 dark:text-gray-500 mt-2'>
                {playlist.trackCount}{' '}
                {playlist.trackCount === 1 ? 'track' : 'tracks'}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
