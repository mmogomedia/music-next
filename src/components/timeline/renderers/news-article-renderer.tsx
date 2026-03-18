'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import FollowButton from '../FollowButton';
import { logger } from '@/lib/utils/logger';
import { constructFileUrl } from '@/lib/url-utils';
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
  const isInternal = content.isInternal === true;
  const articleUrl = isInternal
    ? `/learn/${content.slug}`
    : (content.url ?? null);
  const readTime = content.readTime;
  const coverUrl = post.coverImageUrl
    ? constructFileUrl(post.coverImageUrl)
    : null;
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

  const ImageBlock = coverUrl ? (
    <div className='relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-gray-100 dark:bg-slate-800'>
      <Image
        src={coverUrl}
        alt={post.title || 'Article'}
        fill
        className='object-cover group-hover:scale-105 transition-transform duration-400'
      />
      {!isInternal && (
        <div className='absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded-md text-white/80 text-[10px]'>
          <ArrowTopRightOnSquareIcon className='w-2.5 h-2.5' />
        </div>
      )}
      {isInternal && (
        <div className='absolute top-2 right-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded-md text-white/80 text-[10px] font-medium'>
          Learn
        </div>
      )}
    </div>
  ) : null;

  const TitleBlock = post.title ? (
    <h3 className='text-sm font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-2 leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors'>
      {post.title}
    </h3>
  ) : null;

  return (
    <div className='bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden'>
      <div className='px-4 pt-4 pb-3'>
        {/* Author row */}
        <div className='flex items-center gap-2.5 mb-3'>
          <div className='w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0'>
            {post.author.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name || post.author.email}
                width={32}
                height={32}
                className='rounded-full object-cover'
              />
            ) : (
              <span className='text-gray-600 dark:text-gray-300 text-xs font-semibold'>
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
          {onFollow && post.author.id && (
            <FollowButton
              authorId={post.author.id}
              isFollowing={isFollowing}
              onFollow={handleFollow}
              size='sm'
            />
          )}
          <span className='px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'>
            Article
          </span>
        </div>

        {/* Article card — linked */}
        {articleUrl ? (
          isInternal ? (
            <Link href={articleUrl} className='block group'>
              {ImageBlock}
              {TitleBlock}
            </Link>
          ) : (
            <a
              href={articleUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='block group'
            >
              {ImageBlock}
              {TitleBlock}
            </a>
          )
        ) : (
          <div>
            {ImageBlock}
            {TitleBlock}
          </div>
        )}

        {post.description && (
          <p className='text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed'>
            {post.description}
          </p>
        )}

        {/* Footer row: read time + CTA */}
        <div className='flex items-center justify-between mb-3'>
          {readTime && (
            <div className='flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-medium'>
              <ClockIcon className='w-3 h-3' />
              {readTime} min read
            </div>
          )}
          {articleUrl &&
            (isInternal ? (
              <Link
                href={articleUrl}
                className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors'
              >
                Read on Learn →
              </Link>
            ) : (
              <a
                href={articleUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors'
              >
                Read article
                <ArrowTopRightOnSquareIcon className='w-3 h-3' />
              </a>
            ))}
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
            className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all'
          >
            <ChatBubbleLeftIcon className='w-3.5 h-3.5' />
            {post.commentCount || post._count?.comments || 0}
          </button>
          <button
            onClick={() => onShare?.(post.id)}
            className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all'
          >
            <ShareIcon className='w-3.5 h-3.5' />
            {post.shareCount || post._count?.shares || 0}
          </button>
        </div>
      </div>
    </div>
  );
}
