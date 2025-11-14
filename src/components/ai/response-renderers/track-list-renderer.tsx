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
import type { Track } from '@/types/track';

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
  const [openReasons, setOpenReasons] = useState<Set<string>>(new Set());

  const normalizeTrack = (track: any): Track & { summary?: string } => ({
    id: track.id,
    title: track.title ?? 'Untitled',
    filePath: track.filePath ?? '',
    fileUrl: track.fileUrl ?? '',
    coverImageUrl: track.coverImageUrl ?? track.albumArtwork ?? undefined,
    albumArtwork: track.albumArtwork ?? undefined,
    genre: track.genre ?? undefined,
    album: track.album ?? undefined,
    description: track.description ?? undefined,
    duration:
      typeof track.duration === 'number' && Number.isFinite(track.duration)
        ? track.duration
        : undefined,
    playCount: track.playCount ?? 0,
    likeCount: track.likeCount ?? 0,
    artistId: track.artistId ?? track.artistProfileId ?? '',
    artistProfileId: track.artistProfileId ?? undefined,
    userId: track.userId ?? '',
    createdAt: track.createdAt ?? new Date().toISOString(),
    updatedAt: track.updatedAt ?? new Date().toISOString(),
    artist: track.artist ?? track.artistProfile?.artistName ?? 'Unknown Artist',
    composer: track.composer ?? undefined,
    year: track.year ?? undefined,
    releaseDate: track.releaseDate ?? undefined,
    bpm: track.bpm ?? undefined,
    isrc: track.isrc ?? undefined,
    lyrics: track.lyrics ?? undefined,
    isPublic: track.isPublic ?? true,
    isDownloadable: track.isDownloadable ?? false,
    isExplicit: track.isExplicit ?? false,
    watermarkId: track.watermarkId ?? undefined,
    copyrightInfo: track.copyrightInfo ?? undefined,
    licenseType: track.licenseType ?? undefined,
    distributionRights: track.distributionRights ?? undefined,
    downloadCount: track.downloadCount ?? undefined,
    shareCount: track.shareCount ?? undefined,
    summary: track.summary ?? undefined,
    reason: track.reason ?? undefined, // Include reason for recommendations
  });

  const handlePlayTrack = (track: Track) => {
    if (onPlayTrack) {
      onPlayTrack(track.id, track);
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

  const toggleReason = (trackId: string) => {
    setOpenReasons(prev => {
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
        break;
      default:
        break;
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
          const trackWithSummary = normalizeTrack(track);
          const hasSummary = !!trackWithSummary.summary;
          const hasReason = !!trackWithSummary.reason;
          const isSummaryOpen = openSummaries.has(track.id);
          const isReasonOpen = openReasons.has(track.id);

          return (
            <div key={track.id} className='space-y-2'>
              <TrackCard
                track={trackWithSummary}
                onPlay={handlePlayTrack}
                size='md'
                showDuration
                variant='default'
              />

              {/* Reason Drawer - Show for recommendation reasons (if no summary) */}
              {hasReason && !hasSummary && (
                <div className='relative border-l-2 border-purple-200 dark:border-purple-800/50 ml-2'>
                  {/* Toggle Button */}
                  <button
                    type='button'
                    onClick={() => toggleReason(track.id)}
                    className='w-full flex items-center gap-3 py-3 px-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors rounded-r-lg group'
                    aria-label={
                      isReasonOpen
                        ? 'Hide recommendation reason'
                        : 'Show recommendation reason'
                    }
                  >
                    <div className='flex-shrink-0 -ml-2'>
                      <div className='rounded-full bg-purple-100/80 dark:bg-purple-900/30 p-1.5 group-hover:bg-purple-200/80 dark:group-hover:bg-purple-800/40 transition-colors'>
                        {/* AI Icon - Neural network / Brain style */}
                        <svg
                          className='w-5 h-5 text-purple-600 dark:text-purple-400'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                          xmlns='http://www.w3.org/2000/svg'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                          />
                        </svg>
                      </div>
                    </div>
                    <span className='flex-1 text-left text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider'>
                      AI Recommendation
                    </span>
                    {isReasonOpen ? (
                      <ChevronUpIcon className='w-4 h-4 text-purple-400 dark:text-purple-500 flex-shrink-0' />
                    ) : (
                      <ChevronDownIcon className='w-4 h-4 text-purple-400 dark:text-purple-500 flex-shrink-0' />
                    )}
                  </button>

                  {/* Drawer Content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isReasonOpen
                        ? 'max-h-96 opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className='py-4 pl-6 pr-4'>
                      <p className='text-sm text-purple-700 dark:text-purple-300 leading-relaxed italic font-light tracking-wide'>
                        {trackWithSummary.reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Drawer - Show for each track with summary */}
              {hasSummary && (
                <div className='relative border-l-2 border-gray-200 dark:border-slate-700 ml-2'>
                  {/* Toggle Button */}
                  <button
                    type='button'
                    onClick={() => toggleSummary(track.id)}
                    className='w-full flex items-center gap-3 py-3 px-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors rounded-r-lg group'
                    aria-label={
                      isSummaryOpen
                        ? 'Hide track summary'
                        : 'Show track summary'
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
                    {isSummaryOpen ? (
                      <ChevronUpIcon className='w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0' />
                    ) : (
                      <ChevronDownIcon className='w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0' />
                    )}
                  </button>

                  {/* Drawer Content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isSummaryOpen
                        ? 'max-h-96 opacity-100'
                        : 'max-h-0 opacity-0'
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
