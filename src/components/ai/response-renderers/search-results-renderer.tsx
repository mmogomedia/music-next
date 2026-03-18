'use client';

import type { SearchResultsResponse } from '@/types/ai-responses';
import { TrackListRenderer } from './track-list-renderer';
import { ArtistRenderer } from './artist-renderer';
import { SuggestedActions } from './suggested-actions';

interface SearchResultsRendererProps {
  response: SearchResultsResponse;
  onPlayTrack?: (_trackId: string, _track: any) => void;
  onViewArtist?: (_artistId: string) => void;
  onAction?: (_action: any) => void;
}

/**
 * Renders mixed search results (tracks and artists)
 */
export function SearchResultsRenderer({
  response,
  onPlayTrack,
  onViewArtist,
  onAction,
}: SearchResultsRendererProps) {
  const { tracks, artists, metadata } = response.data;

  if ((!tracks || tracks.length === 0) && (!artists || artists.length === 0)) {
    return (
      <div className='rounded-lg bg-gray-50 dark:bg-slate-800 p-4'>
        <p className='text-gray-600 dark:text-gray-400'>
          No results found for &quot;{metadata?.query}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Artists Section */}
      {artists && artists.length > 0 && (
        <div>
          <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-3'>
            Artists
          </h3>
          <div className='space-y-3'>
            {artists.map(artist => (
              <ArtistRenderer
                key={artist.id}
                response={{
                  ...response,
                  type: 'artist',
                  data: artist,
                }}
                onViewArtist={onViewArtist}
                onAction={onAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tracks Section */}
      {tracks && tracks.length > 0 && (
        <div>
          <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-3'>
            Tracks
          </h3>
          <TrackListRenderer
            response={{
              ...response,
              type: 'track_list',
              data: { tracks, metadata },
            }}
            onPlayTrack={onPlayTrack}
            onAction={onAction}
          />
        </div>
      )}

      {/* Context-aware follow-up suggestions */}
      {(() => {
        const query = response.data.metadata?.query;
        return (
          <SuggestedActions
            suggestions={[
              query
                ? {
                    label: `More "${query}"`,
                    message: `Find more music matching "${query}"`,
                  }
                : {
                    label: 'More results',
                    message: 'Show me more results like these',
                  },
              {
                label: 'Different search',
                message: "I'm looking for something different",
              },
              { label: 'Browse genres', message: 'Show me all genres' },
            ]}
            onAction={onAction}
          />
        );
      })()}
    </div>
  );
}
