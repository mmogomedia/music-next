'use client';

import React from 'react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import TrackArtwork from './TrackArtwork';
import { XMarkIcon, PlayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Track } from '@/types/track';

interface QueueViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueueView({ isOpen, onClose }: QueueViewProps) {
  const { queue, queueIndex, currentTrack, playTrack, removeFromQueue } =
    useMusicPlayer();

  if (!isOpen) return null;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTrackClick = (track: Track) => {
    // If clicking the current track, do nothing
    if (currentTrack?.id === track.id) return;
    // Otherwise, play the track (this will update queueIndex)
    playTrack(track);
  };

  const handleRemove = (trackId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (removeFromQueue) {
      removeFromQueue(trackId);
    }
  };

  const handleBackdropKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center pointer-events-none'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity pointer-events-auto'
        onClick={onClose}
        role='button'
        tabIndex={0}
        onKeyDown={handleBackdropKeyDown}
      />

      {/* Queue Panel */}
      <div className='relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0'>
          <div>
            <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
              Queue
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors'
            aria-label='Close queue'
          >
            <XMarkIcon className='w-5 h-5 text-gray-600 dark:text-gray-400' />
          </button>
        </div>

        {/* Queue List */}
        <div className='flex-1 overflow-y-auto'>
          {queue.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-16 px-6'>
              <div className='w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4'>
                <PlayIcon className='w-8 h-8 text-gray-400 dark:text-gray-500' />
              </div>
              <p className='text-gray-600 dark:text-gray-400 font-medium mb-1'>
                Your queue is empty
              </p>
              <p className='text-sm text-gray-500 dark:text-gray-500 text-center'>
                Add tracks to your queue to see them here
              </p>
            </div>
          ) : (
            <div className='divide-y divide-gray-200 dark:divide-slate-700'>
              {queue.map((track, index) => {
                const isCurrent = currentTrack?.id === track.id;
                const isPlaying = isCurrent && index === queueIndex;
                const durationSeconds =
                  typeof track.duration === 'number' && track.duration > 0
                    ? track.duration
                    : undefined;

                return (
                  <button
                    key={`${track.id}-${index}`}
                    type='button'
                    onClick={() => handleTrackClick(track)}
                    className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left ${
                      isCurrent
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 dark:border-blue-400'
                        : ''
                    }`}
                  >
                    {/* Track Number / Play Indicator */}
                    <div className='flex-shrink-0 w-8 flex items-center justify-center'>
                      {isPlaying ? (
                        <div className='flex gap-1'>
                          <span className='w-1 h-4 bg-blue-500 rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]' />
                          <span
                            className='w-1 h-4 bg-blue-500 rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]'
                            style={{ animationDelay: '0.15s' }}
                          />
                          <span
                            className='w-1 h-4 bg-blue-500 rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]'
                            style={{ animationDelay: '0.3s' }}
                          />
                        </div>
                      ) : (
                        <span className='text-sm text-gray-400 dark:text-gray-500 font-medium'>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Artwork */}
                    <div className='flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700'>
                      {track.coverImageUrl || track.albumArtwork ? (
                        <TrackArtwork
                          artworkUrl={track.coverImageUrl || track.albumArtwork}
                          title={track.title}
                          size='sm'
                          className='w-full h-full'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                          <PlayIcon className='w-6 h-6 text-gray-400 dark:text-gray-500' />
                        </div>
                      )}
                    </div>

                    {/* Track Info */}
                    <div className='flex-1 min-w-0'>
                      <div
                        className={`font-medium truncate ${
                          isCurrent
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {track.title}
                      </div>
                      <div className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                        {track.artist || 'Unknown Artist'}
                      </div>
                    </div>

                    {/* Duration */}
                    {durationSeconds && (
                      <div className='flex-shrink-0 text-sm text-gray-500 dark:text-gray-400'>
                        {formatDuration(durationSeconds)}
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      type='button'
                      onClick={e => handleRemove(track.id, e)}
                      className='flex-shrink-0 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors'
                      aria-label={`Remove ${track.title} from queue`}
                    >
                      <TrashIcon className='w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400' />
                    </button>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
