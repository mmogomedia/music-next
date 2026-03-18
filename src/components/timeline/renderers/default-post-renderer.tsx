'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import FollowButton from '../FollowButton';
import { logger } from '@/lib/utils/logger';
import type { TimelinePostRendererProps } from './index';

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

export function DefaultPostRenderer({
  post,
  onLike,
  onComment,
  onShare,
  onFollow,
}: TimelinePostRendererProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(
    post.likeCount || post._count?.likes || 0
  );
  const [isLiked, setIsLiked] = useState(post.userLiked || false);
  const [isFollowing, setIsFollowing] = useState(
    post.userFollowsAuthor || false
  );

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

  const handleFollow = async (authorId: string, currentFollowing: boolean) => {
    if (!onFollow) return;
    try {
      await onFollow(authorId, currentFollowing);
      setIsFollowing(!currentFollowing);
    } catch (error) {
      logger.error('Error toggling follow:', error);
    }
  };

  return (
    <div className='bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden'>
      <div className='px-4 pt-4 pb-3'>
        {/* Author row */}
        <div className='flex items-center gap-2.5 mb-3'>
          <div className='relative flex-shrink-0'>
            <div className='w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-slate-800'>
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
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight'>
              {post.author.name || post.author.email}
            </p>
            <p className='text-[10px] text-gray-400 dark:text-gray-500 leading-tight'>
              {timeAgo(postDate)}
            </p>
          </div>
          {onFollow && post.author.id && (
            <FollowButton
              authorId={post.author.id}
              isFollowing={isFollowing}
              onFollow={handleFollow}
              size='sm'
            />
          )}
          <span className='px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wide'>
            {post.postType.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Content */}
        {post.title && (
          <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-1.5 leading-snug line-clamp-2'>
            {post.title}
          </h3>
        )}
        {post.description && (
          <p className='text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-3 leading-relaxed'>
            {post.description}
          </p>
        )}
        {post.coverImageUrl && (
          <div className='relative w-full h-44 rounded-xl overflow-hidden mb-3 bg-gray-100 dark:bg-slate-800'>
            <Image
              src={post.coverImageUrl}
              alt={post.title || 'Post image'}
              fill
              className='object-cover'
            />
          </div>
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
            className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all'
          >
            <ShareIcon className='w-3.5 h-3.5' />
            {post.shareCount || post._count?.shares || 0}
          </button>
          <div className='flex items-center gap-1 ml-auto text-[10px] text-gray-400 dark:text-gray-500'>
            <EyeIcon className='w-3 h-3' />
            {post.viewCount || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
