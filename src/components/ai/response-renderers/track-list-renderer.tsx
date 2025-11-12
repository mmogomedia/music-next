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
  const { tracks, other } = response.data;
  const [openSummaries, setOpenSummaries] = useState<Set<string>>(new Set());

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
          const isOpen = openSummaries.has(track.id);

          return (
            <div key={track.id} className='space-y-2'>
              <TrackCard
                track={trackWithSummary}
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

      {/* Other/Featured Tracks Section */}
      {other && other.length > 0 && (
        <div className='mt-6 pt-6 border-t border-gray-200 dark:border-slate-700'>
          <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide'>
            More Music You Might Like
          </h3>
          <div className='space-y-3'>
            {other.map(track => {
              const trackWithSummary = normalizeTrack(track);
              return (
                <TrackCard
                  key={track.id}
                  track={trackWithSummary}
                  onPlay={handlePlayTrack}
                  size='md'
                  showDuration
                  variant='default'
                />
              );
            })}
          </div>
        </div>
      )}

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
