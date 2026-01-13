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

/**
 * Default post renderer for generic post types
 * Clean, minimal design
 */
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

  const handleShare = async () => {
    if (!onShare) return;
    try {
      await onShare(post.id);
    } catch (error) {
      logger.error('Error sharing post:', error);
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
    <div className='bg-gray-100 dark:bg-slate-800 rounded-xl p-4 hover:bg-gray-200/50 dark:hover:bg-slate-700/50 transition-all duration-200'>
      {/* Compact Header */}
      <div className='flex items-center gap-2.5 mb-3'>
        <div className='w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0 overflow-hidden'>
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
        {onFollow && post.author.id && (
          <FollowButton
            authorId={post.author.id}
            isFollowing={isFollowing}
            onFollow={handleFollow}
            size='sm'
          />
        )}
        <span className='px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-500/10 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400'>
          {post.postType.replace('_', ' ')}
        </span>
      </div>

      {/* Post Content */}
      {post.title && (
        <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2'>
          {post.title}
        </h3>
      )}
      {post.description && (
        <p className='text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-3 whitespace-pre-wrap'>
          {post.description}
        </p>
      )}
      {post.coverImageUrl && (
        <div className='relative w-full h-40 rounded-lg overflow-hidden mb-3 bg-gray-200 dark:bg-slate-700'>
          <Image
            src={post.coverImageUrl}
            alt={post.title || 'Post image'}
            fill
            className='object-cover'
          />
        </div>
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
          onClick={handleShare}
          className='flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
        >
          <ShareIcon className='w-4 h-4' />
          <span className='text-xs font-medium'>
            {post.shareCount || post._count?.shares || 0}
          </span>
        </button>
        <div className='flex items-center gap-1.5 text-gray-400 dark:text-gray-500 ml-auto'>
          <EyeIcon className='w-3.5 h-3.5' />
          <span className='text-[10px]'>{post.viewCount || 0}</span>
        </div>
      </div>
    </div>
  );
}
