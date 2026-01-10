'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  HeartIcon,
  ShareIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { TimelinePostRendererProps } from './index';
import { logger } from '@/lib/utils/logger';

/**
 * Renderer for advertisements (ADVERTISEMENT type)
 * Modern ad design with subtle gradient accent
 */
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

  const PostContent = adUrl ? (
    <a
      href={adUrl}
      target='_blank'
      rel='noopener noreferrer'
      className='block group'
    >
      {post.coverImageUrl && (
        <div className='relative w-full h-36 rounded-lg overflow-hidden mb-3 bg-gray-200 dark:bg-slate-700'>
          <Image
            src={post.coverImageUrl}
            alt={post.title || 'Advertisement'}
            fill
            className='object-cover group-hover:scale-105 transition-transform duration-300'
          />
        </div>
      )}
      {post.title && (
        <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2'>
          {post.title}
        </h3>
      )}
    </a>
  ) : (
    <>
      {post.coverImageUrl && (
        <div className='relative w-full h-36 rounded-lg overflow-hidden mb-3 bg-gray-200 dark:bg-slate-700'>
          <Image
            src={post.coverImageUrl}
            alt={post.title || 'Advertisement'}
            fill
            className='object-cover'
          />
        </div>
      )}
      {post.title && (
        <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-2'>
          {post.title}
        </h3>
      )}
    </>
  );

  return (
    <div className='bg-gray-100 dark:bg-slate-800 rounded-xl p-4 hover:bg-gray-200/50 dark:hover:bg-slate-700/50 transition-all duration-200 relative overflow-hidden'>
      {/* Subtle gradient accent */}
      <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500' />

      {/* Ad Label */}
      <div className='flex items-center gap-1.5 mb-3'>
        <InformationCircleIcon className='w-3.5 h-3.5 text-blue-600 dark:text-blue-400' />
        <span className='text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide'>
          Sponsored
        </span>
      </div>

      {/* Ad Content */}
      {PostContent}
      {post.description && (
        <p className='text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2'>
          {post.description}
        </p>
      )}

      {/* CTA Button */}
      {adUrl && (
        <a
          href={adUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1.5 px-3 py-1.5 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all'
        >
          <span>{ctaText}</span>
          <ArrowTopRightOnSquareIcon className='w-3 h-3' />
        </a>
      )}

      {/* Engagement (Limited for ads) */}
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
