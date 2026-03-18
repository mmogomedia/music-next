'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PlayIcon,
  CalendarIcon,
  BellIcon,
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
    <div className='relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden'>
      {/* Top gradient strip */}
      <div className='h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500' />

      <div className='px-4 pt-3 pb-3'>
        {/* Author + badge */}
        <div className='flex items-center gap-2.5 mb-3'>
          <div className='w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center overflow-hidden ring-2 ring-purple-100 dark:ring-purple-900/40 flex-shrink-0'>
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
          <span
            className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide ${
              isUpcoming
                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm'
            }`}
          >
            {isUpcoming ? '⏳ Coming Soon' : '🔥 New Release'}
          </span>
        </div>

        {/* Cover + info side by side */}
        <div className='flex gap-3 mb-3'>
          {post.coverImageUrl && (
            <div className='relative w-20 h-20 rounded-xl overflow-hidden bg-gray-200 dark:bg-slate-700 flex-shrink-0 shadow-lg group'>
              <Image
                src={post.coverImageUrl}
                alt={post.title || 'Release cover'}
                fill
                className='object-cover'
              />
              {/* Glowing border for upcoming */}
              {isUpcoming && (
                <div className='absolute inset-0 border-2 border-purple-400/60 rounded-xl' />
              )}
              {trackId && !isUpcoming && (
                <button
                  onClick={() => onPlayTrack?.(trackId)}
                  className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  <div className='w-9 h-9 rounded-full bg-white/90 flex items-center justify-center'>
                    <PlayIcon className='w-4 h-4 text-purple-600 ml-0.5' />
                  </div>
                </button>
              )}
            </div>
          )}

          <div className='flex-1 min-w-0 flex flex-col justify-center gap-1'>
            {post.title && (
              <h3 className='text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2'>
                {post.title}
              </h3>
            )}
            {content.artist && (
              <p className='text-xs text-gray-500 dark:text-gray-400 font-medium'>
                {content.artist}
              </p>
            )}
            {releaseDate && (
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold mt-0.5 ${
                  isUpcoming
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              >
                <CalendarIcon className='w-3.5 h-3.5 flex-shrink-0' />
                {isUpcoming ? 'Releases ' : 'Released '}
                {new Date(releaseDate).toLocaleDateString('en-ZA', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            )}

            {/* Action */}
            <div className='mt-1.5'>
              {isUpcoming ? (
                <button className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors'>
                  <BellIcon className='w-3.5 h-3.5' />
                  Notify me
                </button>
              ) : (
                trackId && (
                  <button
                    onClick={() => onPlayTrack?.(trackId)}
                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-sm transition-all'
                  >
                    <PlayIcon className='w-3.5 h-3.5' />
                    Play Now
                  </button>
                )
              )}
            </div>
          </div>
        </div>

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
            className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all'
          >
            <ChatBubbleLeftIcon className='w-3.5 h-3.5' />
            {post.commentCount || post._count?.comments || 0}
          </button>
          <button
            onClick={() => onShare?.(post.id)}
            className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 transition-all'
          >
            <ShareIcon className='w-3.5 h-3.5' />
            {post.shareCount || post._count?.shares || 0}
          </button>
        </div>
      </div>
    </div>
  );
}
