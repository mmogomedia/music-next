'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { TimelinePostRendererProps } from './index';
import { logger } from '@/lib/utils/logger';

/**
 * Renderer for SONG posts (external song links)
 * Modern card with external link styling
 */
export function SongRenderer({
  post,
  onLike,
  onComment,
  onShare,
}: TimelinePostRendererProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(
    post.likeCount || post._count?.likes || 0
  );
  const [isLiked, setIsLiked] = useState(post.userLiked || false);

  const content = (post.content as any) || {};
  const songUrl = post.songUrl || content.songUrl;
  const platform = content.platform || 'External';

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
    if (songUrl) {
      window.open(songUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className='bg-gray-100 dark:bg-slate-800 rounded-xl p-4 hover:bg-gray-200/50 dark:hover:bg-slate-700/50 transition-all duration-200'>
      {/* Header */}
      <div className='flex items-center gap-2.5 mb-3'>
        <div className='w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 overflow-hidden'>
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
          <p className='text-[10px] text-gray-500 dark:text-gray-400'>
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : new Date(post.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
          </p>
        </div>
        <span className='px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1'>
          <MusicalNoteIcon className='w-2.5 h-2.5' />
          SONG
        </span>
      </div>

      {/* Song Content - Side by Side */}
      <div className='flex gap-3 mb-3'>
        {post.coverImageUrl && (
          <div className='relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700 flex-shrink-0 group'>
            <Image
              src={post.coverImageUrl}
              alt={post.title || 'Song cover'}
              fill
              className='object-cover'
            />
            {songUrl && (
              <button
                onClick={handlePlay}
                className='absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100'
              >
                <ArrowTopRightOnSquareIcon className='w-5 h-5 text-white' />
              </button>
            )}
          </div>
        )}

        <div className='flex-1 min-w-0'>
          {post.title && (
            <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-0.5 truncate'>
              {post.title}
            </h3>
          )}
          {content.artist && (
            <p className='text-xs text-gray-600 dark:text-gray-400 mb-1.5 truncate'>
              {content.artist}
            </p>
          )}
          {songUrl && (
            <a
              href={songUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors'
            >
              <span>Listen on {platform}</span>
              <ArrowTopRightOnSquareIcon className='w-3 h-3' />
            </a>
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
