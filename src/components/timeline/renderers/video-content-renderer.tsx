'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { TimelinePostRendererProps } from './index';
import { logger } from '@/lib/utils/logger';

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
}

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
  const postDate = new Date(post.publishedAt || post.createdAt);

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
    <div className='bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden'>
      <div className='px-4 pt-4 pb-3'>
        {/* Author row */}
        <div className='flex items-center gap-2.5 mb-3'>
          <div className='w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center overflow-hidden ring-2 ring-red-100 dark:ring-red-900/40 flex-shrink-0'>
            {post.author.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name || post.author.email}
                width={36}
                height={36}
                className='rounded-full object-cover'
              />
            ) : (
              <span className='text-white text-xs font-bold'>
                {(post.author.name || post.author.email)[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight'>
              {post.author.name || post.author.email}
            </p>
            <p className='text-[10px] text-gray-400 dark:text-gray-500 leading-tight'>
              {timeAgo(postDate)}
            </p>
          </div>
          <span className='inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 uppercase tracking-wide'>
            <svg
              className='w-2.5 h-2.5'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M8 5v14l11-7z' />
            </svg>
            Video
          </span>
        </div>

        {/* Video thumbnail */}
        {post.coverImageUrl ? (
          <button
            type='button'
            onClick={() =>
              videoUrl && window.open(videoUrl, '_blank', 'noopener,noreferrer')
            }
            className='relative w-full aspect-video rounded-xl overflow-hidden mb-3 bg-gray-900 group block shadow-md hover:shadow-xl transition-shadow'
            aria-label={`Play ${post.title || 'video'}`}
          >
            <Image
              src={post.coverImageUrl}
              alt={post.title || 'Video thumbnail'}
              fill
              className='object-cover group-hover:scale-105 transition-transform duration-500'
            />
            {/* Dark overlay */}
            <div className='absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors' />
            {/* Play button */}
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='w-14 h-14 rounded-full bg-white/95 dark:bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform'>
                <PlayIcon className='w-7 h-7 text-red-600 ml-1' />
              </div>
            </div>
            {/* Overlays */}
            {duration && (
              <div className='absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold rounded-md'>
                {duration}
              </div>
            )}
            {platform && (
              <div className='absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold rounded-md uppercase tracking-wide'>
                {platform}
              </div>
            )}
          </button>
        ) : (
          videoUrl && (
            <button
              onClick={() =>
                window.open(videoUrl, '_blank', 'noopener,noreferrer')
              }
              className='w-full mb-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 flex items-center gap-3 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors'
            >
              <div className='w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0'>
                <PlayIcon className='w-5 h-5 text-white ml-0.5' />
              </div>
              <span className='text-sm font-semibold text-red-700 dark:text-red-400'>
                Watch video
              </span>
            </button>
          )
        )}

        {/* Title and description */}
        {post.title && (
          <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-snug'>
            {post.title}
          </h3>
        )}
        {post.description && (
          <p className='text-xs text-gray-500 dark:text-gray-400 mb-2.5 line-clamp-2 leading-relaxed'>
            {post.description}
          </p>
        )}

        {/* Engagement bar */}
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
            onClick={() => onComment?.(post.id, '')}
            className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all'
          >
            <ChatBubbleLeftIcon className='w-3.5 h-3.5' />
            {post.commentCount || post._count?.comments || 0}
          </button>
          <button
            onClick={() => onShare?.(post.id)}
            className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all'
          >
            <ShareIcon className='w-3.5 h-3.5' />
            {post.shareCount || post._count?.shares || 0}
          </button>
        </div>
      </div>
    </div>
  );
}
