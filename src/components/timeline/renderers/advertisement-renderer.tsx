'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  HeartIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { TimelinePostRendererProps } from './index';
import { logger } from '@/lib/utils/logger';

export function AdvertisementRenderer({
  post,
  onLike,
  onShare,
}: TimelinePostRendererProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(
    post.likeCount || post._count?.likes || 0
  );
  const [isLiked, setIsLiked] = useState(post.userLiked || false);

  const content = (post.content as any) || {};
  const adUrl = content.url || content.linkUrl;
  const ctaText = content.ctaText || 'Learn More';

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

  return (
    <div className='relative bg-white dark:bg-slate-900 rounded-2xl border border-blue-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden'>
      {/* Top stripe */}
      <div className='h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500' />

      <div className='px-4 pt-3 pb-3'>
        {/* Sponsored label */}
        <div className='flex items-center gap-1.5 mb-3'>
          <span className='inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-widest'>
            <svg
              className='w-2.5 h-2.5'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M11.953 2C6.465 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.493 2 11.953 2zM13 17h-2v-5h2v5zm0-8h-2V7h2v2z' />
            </svg>
            Sponsored
          </span>
        </div>

        {/* Ad content */}
        {adUrl ? (
          <a
            href={adUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='block group mb-3'
          >
            {post.coverImageUrl && (
              <div className='relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-gray-100 dark:bg-slate-800'>
                <Image
                  src={post.coverImageUrl}
                  alt={post.title || 'Advertisement'}
                  fill
                  className='object-cover group-hover:scale-105 transition-transform duration-400'
                />
              </div>
            )}
            {post.title && (
              <h3 className='text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug'>
                {post.title}
              </h3>
            )}
          </a>
        ) : (
          <div className='mb-3'>
            {post.coverImageUrl && (
              <div className='relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-gray-100 dark:bg-slate-800'>
                <Image
                  src={post.coverImageUrl}
                  alt={post.title || 'Advertisement'}
                  fill
                  className='object-cover'
                />
              </div>
            )}
            {post.title && (
              <h3 className='text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug'>
                {post.title}
              </h3>
            )}
          </div>
        )}

        {post.description && (
          <p className='text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed'>
            {post.description}
          </p>
        )}

        {adUrl && (
          <a
            href={adUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1.5 px-4 py-2 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95'
          >
            {ctaText}
            <ArrowTopRightOnSquareIcon className='w-3.5 h-3.5' />
          </a>
        )}

        {/* Engagement */}
        <div className='flex items-center gap-1 pt-2.5 border-t border-gray-50 dark:border-slate-800'>
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isLiked
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            {isLiked ? (
              <HeartSolidIcon className='w-3.5 h-3.5' />
            ) : (
              <HeartIcon className='w-3.5 h-3.5' />
            )}
            {likeCount}
          </button>
          <button
            onClick={() => onShare?.(post.id)}
            className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all'
          >
            <ShareIcon className='w-3.5 h-3.5' />
            {post.shareCount || post._count?.shares || 0}
          </button>
        </div>
      </div>
    </div>
  );
}
