'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PlayIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { TimelinePostRendererProps } from './index';
import { logger } from '@/lib/utils/logger';

/**
 * Renderer for video content (VIDEO_CONTENT type)
 * Video-first design with large thumbnail
 */
export function VideoContentRenderer({
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
  const videoUrl = post.videoUrl || content.videoUrl;
  const duration = content.duration;
  const platform = content.platform || 'Video';

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
    if (videoUrl) {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className='bg-gray-100 dark:bg-slate-800 rounded-xl p-4 hover:bg-gray-200/50 dark:hover:bg-slate-700/50 transition-all duration-200'>
      {/* Compact Header */}
      <div className='flex items-center gap-2 mb-3'>
        <div className='w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden'>
          {post.author.image ? (
            <Image
              src={post.author.image}
              alt={post.author.name || post.author.email}
              width={28}
              height={28}
              className='rounded-full'
            />
          ) : (
            <span className='text-white text-[10px] font-semibold'>
              {(post.author.name || post.author.email)[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-xs font-medium text-gray-900 dark:text-white truncate'>
            {post.author.name || post.author.email}
          </p>
        </div>
        <span className='px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-1'>
          <VideoCameraIcon className='w-2.5 h-2.5' />
          VIDEO
        </span>
      </div>

      {/* Video Thumbnail - Prominent */}
      {post.coverImageUrl && (
        <button
          type='button'
          className='relative w-full aspect-video rounded-lg overflow-hidden mb-3 bg-gray-200 dark:bg-slate-700 group cursor-pointer'
          onClick={handlePlay}
          aria-label={`Play ${post.title || 'video'}`}
        >
          <Image
            src={post.coverImageUrl}
            alt={post.title || 'Video thumbnail'}
            fill
            className='object-cover'
          />
          <div className='absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center'>
            <div className='w-12 h-12 bg-white/95 dark:bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform'>
              <PlayIcon className='w-6 h-6 text-red-600 ml-1' />
            </div>
          </div>
          {duration && (
            <div className='absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-medium rounded'>
              {duration}
            </div>
          )}
          {platform && (
            <div className='absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-medium rounded'>
              {platform}
            </div>
          )}
        </button>
      )}

      {/* Video Info */}
      {post.title && (
        <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2'>
          {post.title}
        </h3>
      )}
      {post.description && (
        <p className='text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2'>
          {post.description}
        </p>
      )}

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
