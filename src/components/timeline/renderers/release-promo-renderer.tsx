'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PlayIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { TimelinePostRendererProps } from './index';
import { logger } from '@/lib/utils/logger';

/**
 * Renderer for release promotions (RELEASE_PROMO type)
 * Distinctive promo design with date emphasis
 */
export function ReleasePromoRenderer({
  post,
  onLike,
  onComment,
  onShare,
  onPlayTrack,
}: TimelinePostRendererProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(
    post.likeCount || post._count?.likes || 0
  );
  const [isLiked, setIsLiked] = useState(post.userLiked || false);

  const content = (post.content as any) || {};
  const releaseDate = content.releaseDate;
  const trackId = content.trackId;
  const isUpcoming = releaseDate && new Date(releaseDate) > new Date();

  const handleLike = async () => {
    if (isLiking || !onLike) return;
    setIsLiking(true);
    try {
      await onLike(post.id);
      setIsLiked(!isLiked);
      setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));
    } catch (error) {
      logger.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handlePlay = () => {
    if (trackId && onPlayTrack) {
      onPlayTrack(trackId);
    }
  };

  return (
    <div className='bg-gray-100 dark:bg-slate-800 rounded-xl p-4 hover:bg-gray-200/50 dark:hover:bg-slate-700/50 transition-all duration-200 relative overflow-hidden'>
      {/* Accent stripe */}
      <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500' />

      {/* Header */}
      <div className='flex items-center gap-2.5 mb-3'>
        <div className='w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden'>
          {post.author.image ? (
            <Image
              src={post.author.image}
              alt={post.author.name || post.author.email}
              width={32}
              height={32}
              className='rounded-full'
            />
          ) : (
            <span className='text-white text-xs font-semibold'>
              {(post.author.name || post.author.email)[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-xs font-medium text-gray-900 dark:text-white truncate'>
            {post.author.name || post.author.email}
          </p>
        </div>
        <span className='px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'>
          {isUpcoming ? 'COMING SOON' : 'NEW RELEASE'}
        </span>
      </div>

      {/* Release Content */}
      <div className='flex gap-3 mb-3'>
        {post.coverImageUrl && (
          <div className='relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700 flex-shrink-0 group'>
            <Image
              src={post.coverImageUrl}
              alt={post.title || 'Release cover'}
              fill
              className='object-cover'
            />
            {trackId && !isUpcoming && (
              <button
                onClick={handlePlay}
                className='absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100'
              >
                <PlayIcon className='w-5 h-5 text-white ml-0.5' />
              </button>
            )}
          </div>
        )}

        <div className='flex-1 min-w-0'>
          {post.title && (
            <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-1 truncate'>
              {post.title}
            </h3>
          )}
          {content.artist && (
            <p className='text-xs text-gray-600 dark:text-gray-400 mb-1.5 truncate'>
              {content.artist}
            </p>
          )}
          {releaseDate && (
            <div className='flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium'>
              <CalendarIcon className='w-3.5 h-3.5' />
              <span>
                {isUpcoming ? 'Releases' : 'Released'}{' '}
                {new Date(releaseDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Engagement */}
      <div className='flex items-center gap-3 pt-2 border-t border-gray-200/50 dark:border-slate-700/50'>
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-1.5 transition-colors ${
            isLiked
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
          }`}
        >
          {isLiked ? (
            <HeartSolidIcon className='w-4 h-4' />
          ) : (
            <HeartIcon className='w-4 h-4' />
          )}
          <span className='text-xs font-medium'>{likeCount}</span>
        </button>
        <button
          onClick={() => onComment?.(post.id, '')}
          className='flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
        >
          <ChatBubbleLeftIcon className='w-4 h-4' />
          <span className='text-xs font-medium'>
            {post.commentCount || post._count?.comments || 0}
          </span>
        </button>
        <button
          onClick={() => onShare?.(post.id)}
          className='flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
        >
          <ShareIcon className='w-4 h-4' />
          <span className='text-xs font-medium'>
            {post.shareCount || post._count?.shares || 0}
          </span>
        </button>
      </div>
    </div>
  );
}
