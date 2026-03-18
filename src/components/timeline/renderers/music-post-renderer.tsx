'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PlayIcon,
  MusicalNoteIcon,
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

export function MusicPostRenderer({
  post,
  onLike,
  onComment,
  onShare,
  onFollow,
  onPlayTrack,
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
  const trackId = content.trackId;
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
          <div className='w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden ring-2 ring-blue-100 dark:ring-blue-900/40 flex-shrink-0'>
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
          {onFollow && post.author.id && (
            <FollowButton
              authorId={post.author.id}
              isFollowing={isFollowing}
              onFollow={handleFollow}
              size='sm'
            />
          )}
          <span className='inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 uppercase tracking-wide'>
            <MusicalNoteIcon className='w-2.5 h-2.5' />
            Music
          </span>
        </div>

        {/* Track card — horizontal */}
        <div className='flex gap-3 mb-3 p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700'>
          {post.coverImageUrl && (
            <div className='relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700 flex-shrink-0 group shadow-sm'>
              <Image
                src={post.coverImageUrl}
                alt={post.title || 'Track cover'}
                fill
                className='object-cover'
              />
              {trackId && (
                <button
                  onClick={() => onPlayTrack?.(trackId)}
                  className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity'
                >
                  <div className='w-8 h-8 rounded-full bg-white/90 flex items-center justify-center'>
                    <PlayIcon className='w-4 h-4 text-blue-600 ml-0.5' />
                  </div>
                </button>
              )}
            </div>
          )}
          <div className='flex-1 min-w-0 flex flex-col justify-center'>
            {post.title && (
              <p className='text-sm font-bold text-gray-900 dark:text-white truncate mb-0.5'>
                {post.title}
              </p>
            )}
            {content.artist && (
              <p className='text-xs text-gray-500 dark:text-gray-400 truncate mb-1'>
                {content.artist}
              </p>
            )}
            {content.genre && (
              <span className='inline-flex items-center gap-1 w-fit px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full'>
                {content.genre}
              </span>
            )}
          </div>
          {trackId && (
            <button
              onClick={() => onPlayTrack?.(trackId)}
              className='flex-shrink-0 self-center w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95'
            >
              <PlayIcon className='w-4 h-4 ml-0.5' />
            </button>
          )}
        </div>

        {/* Engagement bar */}
        <div className='flex items-center gap-1 pt-2 border-t border-gray-50 dark:border-slate-800'>
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
        </div>
      </div>
    </div>
  );
}
