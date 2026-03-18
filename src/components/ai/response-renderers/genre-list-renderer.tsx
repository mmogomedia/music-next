'use client';

import React, { useState } from 'react';
import type { GenreListResponse } from '@/types/ai-responses';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { SuggestedActions } from './suggested-actions';

interface GenreListRendererProps {
  response: GenreListResponse;
  onAction?: (_action: { type: string; data: any }) => void;
}

/**
 * Renders a list of genres as clickable pills/tags
 * When clicked, searches for top 10 songs in that genre
 */
export function GenreListRenderer({
  response,
  onAction,
}: GenreListRendererProps) {
  const { genres } = response.data;
  // Track which genre was most recently clicked for a brief pulse animation
  const [pulsingGenre, setPulsingGenre] = useState<string | null>(null);

  const handleGenreClick = (genre: (typeof genres)[0]) => {
    // Brief visual pulse, then reset — user can click the same genre again
    setPulsingGenre(genre.id);
    setTimeout(() => setPulsingGenre(null), 800);

    // Trigger search for top 10 songs in this genre
    if (onAction) {
      onAction({
        type: 'search_genre',
        data: {
          genre: genre.name,
          genreId: genre.id,
          limit: 10,
        },
      });
    }
  };

  if (!genres || genres.length === 0) {
    return (
      <div className='rounded-lg bg-gray-50 dark:bg-slate-800 p-4'>
        <p className='text-gray-500 dark:text-gray-400 text-sm'>
          No genres available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center gap-2'>
        <MusicalNoteIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
          Available Genres
        </h3>
        <span className='text-sm text-gray-500 dark:text-gray-400'>
          ({genres.length})
        </span>
      </div>

      {/* Genre Pills Grid */}
      <div className='flex flex-wrap gap-2.5'>
        {genres.map(genre => {
          const isPulsing = pulsingGenre === genre.id;

          return (
            <button
              key={genre.id || genre.slug || genre.name}
              onClick={() => handleGenreClick(genre)}
              className={`
                group relative px-4 py-2.5 rounded-full
                font-medium text-sm transition-all duration-200
                border-2 backdrop-blur-sm cursor-pointer
                hover:scale-105 hover:shadow-lg active:scale-95
                bg-white/90 dark:bg-slate-800/90 border-blue-200 dark:border-blue-700 text-gray-900 dark:text-white hover:border-blue-400 dark:hover:border-blue-500
                ${isPulsing ? 'ring-2 ring-blue-400 dark:ring-blue-500 ring-offset-1' : ''}
              `}
              style={
                genre.colorHex
                  ? {
                      borderColor: genre.colorHex,
                      color: genre.colorHex,
                    }
                  : undefined
              }
              title={
                genre.description
                  ? `${genre.name}: ${genre.description}`
                  : genre.name
              }
            >
              <div className='flex items-center gap-2'>
                {/* Genre Icon or Music Note */}
                {genre.icon ? (
                  <span className='text-base'>{genre.icon}</span>
                ) : (
                  <MusicalNoteIcon className='w-4 h-4' />
                )}

                {/* Genre Name */}
                <span className='font-semibold'>{genre.name}</span>

                {/* Track Count Badge */}
                {typeof genre.trackCount === 'number' && (
                  <span
                    className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    style={
                      genre.colorHex
                        ? {
                            backgroundColor: `${genre.colorHex}20`,
                            color: genre.colorHex,
                          }
                        : undefined
                    }
                  >
                    {genre.trackCount}
                  </span>
                )}
              </div>

              {/* Hover Tooltip */}
              {genre.description && (
                <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 max-w-[200px] truncate'>
                  {genre.description}
                  <div className='absolute top-full left-1/2 transform -translate-x-1/2 -mt-1'>
                    <div className='border-4 border-transparent border-t-gray-900 dark:border-t-gray-700' />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <p className='text-xs text-gray-500 dark:text-gray-400 italic'>
        Click any genre to discover the top 10 songs in that genre
      </p>

      {/* Context-aware follow-up suggestions */}
      {(() => {
        const lastClickedGenre = pulsingGenre
          ? genres.find(g => g.id === pulsingGenre)?.name
          : null;
        return (
          <SuggestedActions
            suggestions={[
              lastClickedGenre
                ? {
                    label: `More ${lastClickedGenre}`,
                    message: `Show me more ${lastClickedGenre} tracks`,
                  }
                : {
                    label: 'Recommend for me',
                    message: 'Recommend music based on my taste',
                  },
              {
                label: 'Search instead',
                message: "I'm looking for a specific track",
              },
            ]}
            onAction={onAction}
          />
        );
      })()}
    </div>
  );
}
