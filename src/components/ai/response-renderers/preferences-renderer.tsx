'use client';

import type {
  UserPreferencesResponse,
  PreferenceItem,
} from '@/types/ai-responses';
import {
  MusicalNoteIcon,
  UserIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { SuggestedActions } from './suggested-actions';

interface PreferencesRendererProps {
  response: UserPreferencesResponse;
  onAction?: (_action: any) => void;
}

function strengthBar(score: number) {
  // Normalize to 0-100 range for display (scores can be unbounded)
  const pct = Math.min(100, Math.round(score * 33));
  return pct;
}

function Chip({
  item,
  onAction,
}: {
  item: PreferenceItem;
  onAction?: (_action: any) => void;
}) {
  const handleClick = () => {
    if (!onAction) return;
    if (item.type === 'GENRE') {
      onAction({ type: 'search_genre', data: { genre: item.name } });
    } else if (item.type === 'ARTIST') {
      onAction({
        type: 'search_artist',
        data: { query: item.name },
      });
    }
  };

  const isClickable = item.type === 'GENRE' || item.type === 'ARTIST';
  const pct = strengthBar(item.score);

  return (
    <button
      onClick={isClickable ? handleClick : undefined}
      disabled={!isClickable}
      title={isClickable ? `Find ${item.name} music` : item.name}
      className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border
        ${
          item.type === 'GENRE'
            ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer'
            : item.type === 'ARTIST'
              ? 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 cursor-pointer'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300 cursor-default'
        }`}
    >
      {item.name}
      {/* Subtle strength indicator */}
      <span
        className='inline-block w-1.5 h-1.5 rounded-full opacity-60'
        style={{
          backgroundColor: `hsl(${pct * 1.2}, 70%, 50%)`,
        }}
      />
    </button>
  );
}

export function PreferencesRenderer({
  response,
  onAction,
}: PreferencesRendererProps) {
  const { genres, artists, moods, hasHistory } = response.data;

  if (!hasHistory) {
    return (
      <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-5'>
        <div className='flex items-center gap-2 mb-3'>
          <SparklesIcon className='w-5 h-5 text-gray-400' />
          <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>
            Your Taste Profile
          </h3>
        </div>
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          No listening history yet. Start exploring music to build your profile!
        </p>
      </div>
    );
  }

  return (
    <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 divide-y divide-gray-100 dark:divide-slate-700 overflow-hidden'>
      {/* Header */}
      <div className='px-4 py-3 flex items-center gap-2 bg-gray-50 dark:bg-slate-800'>
        <SparklesIcon className='w-4 h-4 text-indigo-500' />
        <span className='text-sm font-semibold text-gray-800 dark:text-gray-200'>
          Your Taste Profile
        </span>
        <span className='ml-auto text-xs text-gray-400 dark:text-gray-500'>
          Click to explore
        </span>
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div className='px-4 py-3'>
          <div className='flex items-center gap-1.5 mb-2'>
            <MusicalNoteIcon className='w-3.5 h-3.5 text-blue-500' />
            <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
              Genres
            </span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {genres.map(item => (
              <Chip key={item.name} item={item} onAction={onAction} />
            ))}
          </div>
        </div>
      )}

      {/* Artists */}
      {artists.length > 0 && (
        <div className='px-4 py-3'>
          <div className='flex items-center gap-1.5 mb-2'>
            <UserIcon className='w-3.5 h-3.5 text-purple-500' />
            <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
              Artists
            </span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {artists.map(item => (
              <Chip key={item.name} item={item} onAction={onAction} />
            ))}
          </div>
        </div>
      )}

      {/* Moods */}
      {moods.length > 0 && (
        <div className='px-4 py-3'>
          <div className='flex items-center gap-1.5 mb-2'>
            <SparklesIcon className='w-3.5 h-3.5 text-emerald-500' />
            <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
              Moods
            </span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {moods.map(item => (
              <Chip key={item.name} item={item} onAction={onAction} />
            ))}
          </div>
        </div>
      )}

      {/* Context-aware follow-up suggestions */}
      <div className='px-4 pb-3'>
        <SuggestedActions
          suggestions={[
            genres[0]?.name
              ? {
                  label: `Play ${genres[0].name}`,
                  message: `Show me ${genres[0].name} tracks`,
                }
              : {
                  label: 'Recommend music',
                  message: 'Recommend music based on my taste',
                },
            artists[0]?.name
              ? {
                  label: `More ${artists[0].name}`,
                  message: `Show me tracks by ${artists[0].name}`,
                }
              : {
                  label: 'Discover something new',
                  message: 'Surprise me with something outside my usual taste',
                },
            {
              label: 'Discover something new',
              message: 'Surprise me with something outside my usual taste',
            },
          ]}
          onAction={onAction}
        />
      </div>
    </div>
  );
}
