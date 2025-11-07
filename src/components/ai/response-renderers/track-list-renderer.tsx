'use client';

import { useState } from 'react';
import type { TrackListResponse } from '@/types/ai-responses';
import { Button } from '@heroui/react';
import {
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import TrackCard from '@/components/ai/TrackCard';
import { Track } from '@/types/track';

interface TrackListRendererProps {
  response: TrackListResponse;
  onPlayTrack?: (_trackId: string, _track: any) => void;
  onAction?: (_action: any) => void;
}

/**
 * Renders a list of tracks with playback controls
 */
export function TrackListRenderer({
  response,
  onPlayTrack,
  onAction,
}: TrackListRendererProps) {
  const { tracks } = response.data;
  const [openSummaries, setOpenSummaries] = useState<Set<string>>(new Set());

  const handlePlayTrack = (track: Track) => {
    if (onPlayTrack) {
      onPlayTrack(track.id, track);
    } else {
      console.warn('onPlayTrack handler not provided');
    }
  };

  const toggleSummary = (trackId: string) => {
    setOpenSummaries(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const handleAction = (action: any) => {
    switch (action.type) {
      case 'play_track':
        if (action.data.trackId && onPlayTrack) {
          const track = tracks.find(t => t.id === action.data.trackId);
          if (track) {
            onPlayTrack(action.data.trackId, track);
          }
        }
        break;
      case 'play_playlist':
        // Play all tracks in sequence (start with first)
        if (tracks.length > 0 && onPlayTrack) {
          onPlayTrack(tracks[0].id, tracks[0]);
        }
        break;
      case 'queue_add':
        // Add all tracks to queue (for now, just play first track)
        if (tracks.length > 0 && onPlayTrack) {
          onPlayTrack(tracks[0].id, tracks[0]);
        }
        break;
      case 'shuffle':
        // Shuffle and play (for now, just play random track)
        if (tracks.length > 0 && onPlayTrack) {
          const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
          onPlayTrack(randomTrack.id, randomTrack);
        }
        break;
      case 'share_track':
        if (action.data.trackId) {
          const track = tracks.find(t => t.id === action.data.trackId);
          if (track && navigator.share) {
            navigator
              .share({
                title: track.title,
                text: `Check out "${track.title}" by ${track.artist}`,
                url: window.location.href,
              })
              .catch(() => {
                // Share failed or cancelled
              });
          }
        }
        break;
      case 'save_playlist':
        // TODO: Implement save playlist functionality
        console.log('Save playlist action:', action);
        break;
      default:
        console.log('Unhandled action type:', action.type);
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
      {/* Tracks with individual summaries */}
      <div className='space-y-3'>
        {tracks.map(track => {
          const trackWithSummary = track as Track & { summary?: string };
          const hasSummary = !!trackWithSummary.summary;
          const isOpen = openSummaries.has(track.id);

          return (
            <div key={track.id} className='space-y-2'>
              <TrackCard
                track={track as unknown as Track}
                onPlay={handlePlayTrack}
                size='md'
                showDuration
                variant='default'
              />

              {/* Summary Drawer - Show for each track with summary */}
              {hasSummary && (
                <div className='relative border-l-2 border-gray-200 dark:border-slate-700 ml-2'>
                  {/* Toggle Button */}
                  <button
                    type='button'
                    onClick={() => toggleSummary(track.id)}
                    className='w-full flex items-center gap-3 py-3 px-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors rounded-r-lg group'
                    aria-label={
                      isOpen ? 'Hide track summary' : 'Show track summary'
                    }
                  >
                    <div className='flex-shrink-0 -ml-2'>
                      <div className='rounded-full bg-gray-100 dark:bg-slate-800 p-1.5 group-hover:bg-gray-200 dark:group-hover:bg-slate-700 transition-colors'>
                        <InformationCircleIcon className='w-5 h-5 text-gray-500 dark:text-gray-400' />
                      </div>
                    </div>
                    <span className='flex-1 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                      Track Summary
                    </span>
                    {isOpen ? (
                      <ChevronUpIcon className='w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0' />
                    ) : (
                      <ChevronDownIcon className='w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0' />
                    )}
                  </button>

                  {/* Drawer Content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className='py-4 pl-6 pr-4'>
                      <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic font-light tracking-wide'>
                        {trackWithSummary.summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {response.actions && response.actions.length > 0 && (
        <div className='flex gap-2 pt-2 flex-wrap'>
          {response.actions.map((action, index) => (
            <Button
              key={index}
              size='sm'
              variant='bordered'
              onClick={() => {
                if (onAction) {
                  onAction(action);
                } else {
                  handleAction(action);
                }
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
