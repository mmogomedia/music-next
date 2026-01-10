'use client';

import React, { useState } from 'react';
import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

interface FollowButtonProps {
  authorId: string;
  isFollowing: boolean;
  onFollow: (_authorId: string, _isFollowing: boolean) => Promise<void>;
  size?: 'sm' | 'md';
}

export default function FollowButton({
  authorId,
  isFollowing,
  onFollow,
  size = 'sm',
}: FollowButtonProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isToggling) return;

    setIsToggling(true);
    try {
      await onFollow(authorId, isFollowing);
    } catch (error) {
      logger.error('Error toggling follow:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isToggling}
      className={`${sizeClasses[size]} rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 ${
        isFollowing
          ? 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-sm hover:shadow'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isToggling ? (
        <div className='w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin' />
      ) : isFollowing ? (
        <>
          <UserMinusIcon className='w-3.5 h-3.5' />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlusIcon className='w-3.5 h-3.5' />
          <span>Follow</span>
        </>
      )}
    </button>
  );
}
