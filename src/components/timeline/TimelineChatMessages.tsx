'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ResponseRenderer } from '@/components/ai/response-renderers';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import type { AIResponse } from '@/types/ai-responses';
import type { Track } from '@/types/track';
import { logger } from '@/lib/utils/logger';
import GhostLoader from '@/components/ui/GhostLoader';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: AIResponse;
  timestamp: Date;
}

interface TimelineChatMessagesProps {
  messages: ChatMessage[];
  statusMessage?: string | null;
  loading?: boolean;
  error?: string | null;
  onPlayTrack?: (_trackId: string) => void;
  onViewArtist?: (_artistId: string) => void;
  onAction?: (_action: any) => void;
  onClarificationAnswer?: (_answers: Record<string, string | string[]>) => void;
}

export default function TimelineChatMessages({
  messages,
  statusMessage,
  loading = false,
  error = null,
  onPlayTrack,
  onViewArtist,
  onAction,
  onClarificationAnswer,
}: TimelineChatMessagesProps) {
  const { playTrack: contextPlayTrack, setQueue } = useMusicPlayer();
  const router = useRouter();
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handlePlayTrack = async (trackId: string, track?: Track) => {
    // If track object is provided, use it directly
    if (track) {
      if (onPlayTrack) {
        onPlayTrack(trackId);
      } else if (contextPlayTrack) {
        contextPlayTrack(track, 'player');
      }
      return;
    }

    // Otherwise, fetch the track by ID
    if (loadingTrack === trackId) return; // Prevent duplicate requests

    try {
      setLoadingTrack(trackId);
      const response = await fetch(`/api/tracks/${trackId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch track');
      }
      const data = await response.json();
      const fetchedTrack: Track = data.track;

      if (onPlayTrack) {
        onPlayTrack(trackId);
      } else if (contextPlayTrack) {
        contextPlayTrack(fetchedTrack, 'player');
      }
    } catch (error) {
      logger.error('Error fetching track for playback:', error);
    } finally {
      setLoadingTrack(null);
    }
  };

  const handleViewArtist = (artistId: string) => {
    if (onViewArtist) {
      onViewArtist(artistId);
    } else {
      // Navigate to artist profile page
      router.push(`/artists/${artistId}`);
    }
  };

  const handlePlayPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/tracks`);
      if (!response.ok) {
        throw new Error('Failed to fetch playlist tracks');
      }
      const data = await response.json();
      const tracks: Track[] = data.tracks;

      if (tracks.length > 0 && contextPlayTrack && setQueue) {
        // Set queue and play first track
        setQueue(tracks, 0, 'playlist', playlistId);
        contextPlayTrack(tracks[0], 'playlist', playlistId);
      }
    } catch (error) {
      logger.error('Error playing playlist:', error);
    }
  };

  // Auto-scroll to bottom when new messages are added or loading state changes
  useEffect(() => {
    if (messages.length > 0 || loading || statusMessage || error) {
      // Use requestAnimationFrame and setTimeout to ensure DOM has fully updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (messagesEndRef.current) {
            // Find the scrollable parent container (timeline-scroll)
            let scrollContainer: HTMLElement | null =
              messagesEndRef.current.parentElement;
            while (
              scrollContainer &&
              !scrollContainer.classList.contains('timeline-scroll')
            ) {
              scrollContainer = scrollContainer.parentElement;
            }

            if (scrollContainer) {
              // Scroll the container to show the bottom element
              const scrollHeight = scrollContainer.scrollHeight;
              const clientHeight = scrollContainer.clientHeight;
              scrollContainer.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth',
              });
            } else {
              // Fallback to scrollIntoView if parent not found
              messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
              });
            }
          }
        }, 100);
      });
    }
  }, [messages, loading, statusMessage, error]);

  return (
    <div className='space-y-4 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto mb-6'>
      {/* Loading State */}
      {loading && messages.length === 0 && (
        <div className='px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pt-4 pb-2'>
          <GhostLoader variant='conversation' count={4} />
        </div>
      )}

      {/* Empty State Placeholder */}
      {!loading && messages.length === 0 && !statusMessage && (
        <div className='flex flex-col items-center justify-center py-20 text-center'>
          <div className='w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl flex items-center justify-center mb-6 border border-blue-200/50 dark:border-blue-800/50'>
            <svg
              className='w-12 h-12 text-blue-600 dark:text-blue-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
              />
            </svg>
          </div>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
            Start a conversation
          </h3>
          <p className='text-gray-600 dark:text-gray-400 max-w-md'>
            Ask me anything about music, artists, playlists, or discover new
            tracks. I&apos;m here to help you explore!
          </p>
        </div>
      )}

      {messages.map(msg => (
        <div key={msg.id} className='space-y-2'>
          {/* User Message */}
          {msg.role === 'user' && (
            <div className='flex justify-end'>
              <div className='max-w-[80%]'>
                <div className='px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm'>
                  {msg.content}
                </div>
                <div className='mt-1 text-xs text-gray-500 dark:text-gray-400 text-right'>
                  {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                </div>
              </div>
            </div>
          )}

          {/* Assistant Response */}
          {msg.role === 'assistant' && (
            <div className='flex justify-start'>
              <div className='max-w-[85%] w-full'>
                {msg.data?.type ? (
                  <ResponseRenderer
                    response={msg.data}
                    onPlayTrack={handlePlayTrack}
                    onPlayPlaylist={handlePlayPlaylist}
                    onViewArtist={handleViewArtist}
                    onAction={onAction}
                    onClarificationAnswer={onClarificationAnswer}
                  />
                ) : (
                  <div className='px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm border border-gray-200 dark:border-slate-700'>
                    {msg.content}
                  </div>
                )}
                <div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Status Message */}
      {statusMessage && (
        <div className='flex justify-start'>
          <div className='px-4 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm border border-blue-200 dark:border-blue-800/50 flex items-center gap-2'>
            <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
            {statusMessage}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && messages.length > 0 && (
        <div className='flex justify-start'>
          <div className='px-4 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm border border-blue-200 dark:border-blue-800/50 flex items-center gap-2'>
            <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
            Thinking...
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='flex justify-start'>
          <div className='max-w-[85%] w-full'>
            <div className='px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'>
              <div className='flex items-start gap-2'>
                <ExclamationTriangleIcon className='w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5' />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-red-800 dark:text-red-200 mb-1'>
                    Error
                  </p>
                  <p className='text-sm text-red-600 dark:text-red-400'>
                    {error}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor - invisible element at the bottom for auto-scrolling */}
      <div ref={messagesEndRef} className='h-0' />
    </div>
  );
}
