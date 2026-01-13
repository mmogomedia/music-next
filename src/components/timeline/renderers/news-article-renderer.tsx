'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import FollowButton from '../FollowButton';
import { logger } from '@/lib/utils/logger';
import type { TimelinePostRendererProps } from './index';

/**
 * Renderer for news articles (NEWS_ARTICLE type)
 * Card-style layout with prominent image
 */
export function NewsArticleRenderer({
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

  const content = (post.content as any) || {};
  const articleUrl = content.url;
  const readTime = content.readTime || '5 min read';

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

  const PostWrapper = articleUrl ? (
    <a
      href={articleUrl}
      target='_blank'
      rel='noopener noreferrer'
      className='block group'
    >
      {post.coverImageUrl && (
        <div className='relative w-full h-40 rounded-lg overflow-hidden mb-3 bg-gray-200 dark:bg-slate-700'>
          <Image
            src={post.coverImageUrl}
            alt={post.title || 'Article thumbnail'}
            fill
            className='object-cover group-hover:scale-105 transition-transform duration-300'
          />
          <div className='absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-white text-[10px] font-medium flex items-center gap-1'>
            <ArrowTopRightOnSquareIcon className='w-3 h-3' />
            Read
          </div>
        </div>
      )}
      {post.title && (
        <h2 className='text-base font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2'>
          {post.title}
        </h2>
      )}
    </a>
  ) : (
    <>
      {post.coverImageUrl && (
        <div className='relative w-full h-40 rounded-lg overflow-hidden mb-3 bg-gray-200 dark:bg-slate-700'>
          <Image
            src={post.coverImageUrl}
            alt={post.title || 'Article thumbnail'}
            fill
            className='object-cover'
          />
        </div>
      )}
      {post.title && (
        <h2 className='text-base font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-2'>
          {post.title}
        </h2>
      )}
    </>
  );

  return (
    <div className='bg-gray-100 dark:bg-slate-800 rounded-xl p-4 hover:bg-gray-200/50 dark:hover:bg-slate-700/50 transition-all duration-200'>
      {/* Compact Header */}
      <div className='flex items-center gap-2 mb-3'>
        <div className='w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 overflow-hidden'>
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
        {onFollow && post.author.id && (
          <FollowButton
            authorId={post.author.id}
            isFollowing={isFollowing}
            onFollow={handleFollow}
            size='sm'
          />
        )}
        <div className='flex items-center gap-1.5'>
          <span className='text-[10px] text-gray-500 dark:text-gray-400'>
            {readTime}
          </span>
          <span className='px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1'>
            <DocumentTextIcon className='w-2.5 h-2.5' />
            NEWS
          </span>
        </div>
      </div>

      {/* Article Content */}
      {PostWrapper}
      {post.description && (
        <p className='text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2'>
          {post.description}
        </p>
      )}

      {/* Compact Engagement */}
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
