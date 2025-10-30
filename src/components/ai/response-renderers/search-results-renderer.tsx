'use client';

import type { SearchResultsResponse } from '@/types/ai-responses';
import { TrackListRenderer } from './track-list-renderer';
import { ArtistRenderer } from './artist-renderer';

interface SearchResultsRendererProps {
  response: SearchResultsResponse;
  onPlayTrack?: (_trackId: string, _track: any) => void;
  onViewArtist?: (_artistId: string) => void;
}

/**
 * Renders mixed search results (tracks and artists)
 */
export function SearchResultsRenderer({
  response,
  onPlayTrack,
  onViewArtist,
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
          />
        </div>
      )}
    </div>
  );
}
