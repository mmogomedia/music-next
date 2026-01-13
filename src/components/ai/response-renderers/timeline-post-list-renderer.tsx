'use client';

import { useState } from 'react';
import { TimelinePostRenderer } from '@/components/timeline/renderers';
import CommentsModal from '@/components/timeline/CommentsModal';
import type { TimelinePostListResponse } from '@/types/ai-responses';
import type { TimelinePostWithAuthor } from '@/lib/services/timeline-service';
import { logger } from '@/lib/utils/logger';

interface TimelinePostListRendererProps {
  response: TimelinePostListResponse;
  onPlayTrack?: (_trackId: string, _track: any) => void;
  onViewArtist?: (_artistId: string) => void;
  onAction?: (_action: any) => void;
}

/**
 * Renderer for timeline post list responses
 * Displays a list of timeline posts (news articles, music posts, videos, etc.)
 * Uses the existing TimelinePostRenderer which automatically routes to the correct
 * renderer based on post type (NewsArticleRenderer, MusicPostRenderer, etc.)
 */
export function TimelinePostListRenderer({
  response,
  onPlayTrack,
  onViewArtist: _onViewArtist,
  onAction,
}: TimelinePostListRendererProps) {
  const { data } = response;
  const { posts, metadata } = data;
  const [selectedPostForComments, setSelectedPostForComments] =
    useState<TimelinePostWithAuthor | null>(null);

  if (!posts || posts.length === 0) {
    return (
      <div className='py-8 px-4 text-center'>
        <p className='text-gray-600 dark:text-gray-400'>
          No timeline posts found.
        </p>
      </div>
    );
  }

  // Handler functions for post interactions
  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/timeline/posts/${postId}/like`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to toggle like');
      const data = await res.json();
      // Update local state if needed (could be enhanced with state management)
      logger.debug('Post liked:', postId, data);
    } catch (error) {
      logger.error('Error toggling like:', error);
    }
  };

  const handleComment = async (
    postId: string,
    content: string,
    parentId?: string
  ) => {
    // When content is empty, this is a signal to open comments modal
    if (!content || !content.trim()) {
      const post = posts.find(p => p.id === postId);
      if (post) {
        setSelectedPostForComments(post);
      }
      return;
    }

    try {
      const res = await fetch(`/api/timeline/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          ...(parentId && { parentId }),
        }),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        logger.error('Failed to add comment:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData,
          postId,
        });
        throw new Error(
          errorData.error || `Failed to add comment: ${res.statusText}`
        );
      }

      const data = await res.json();
      logger.debug('Comment added successfully:', {
        postId,
        commentId: data.comment?.id,
      });
    } catch (error) {
      logger.error('Error adding comment:', error);
      // Re-throw to allow UI to handle the error
      throw error;
    }
  };

  const handleShare = async (postId: string, platform?: string) => {
    try {
      const res = await fetch(`/api/timeline/posts/${postId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) throw new Error('Failed to share');
      logger.debug('Post shared:', postId);
    } catch (error) {
      logger.error('Error sharing post:', error);
    }
  };

  const handleFollow = async (authorId: string, isFollowing: boolean) => {
    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`/api/timeline/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authorId }),
      });
      if (!res.ok) throw new Error(`Failed to ${endpoint}`);
      logger.debug('User followed/unfollowed:', authorId);
    } catch (error) {
      logger.error('Error toggling follow:', error);
    }
  };

  const handlePlayTrack = (trackId: string) => {
    if (onPlayTrack) {
      onPlayTrack(trackId, null);
    }
  };

  return (
    <div className='space-y-4'>
      {/* Optional metadata header */}
      {metadata && (metadata.total || metadata.query) && (
        <div className='px-2 py-1 text-sm text-gray-600 dark:text-gray-400'>
          {metadata.query && (
            <span>
              Found {posts.length} result{posts.length !== 1 ? 's' : ''} for
              &ldquo;{metadata.query}&rdquo;
            </span>
          )}
          {!metadata.query && metadata.total && (
            <span>
              Showing {posts.length} of {metadata.total} posts
            </span>
          )}
        </div>
      )}

      {/* Render each post using TimelinePostRenderer */}
      <div className='space-y-4'>
        {posts.map(post => (
          <div key={post.id}>
            <TimelinePostRenderer
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onFollow={handleFollow}
              onPlayTrack={handlePlayTrack}
            />
          </div>
        ))}
      </div>

      {/* Optional actions */}
      {response.actions && response.actions.length > 0 && (
        <div className='flex flex-wrap gap-2 pt-4'>
          {response.actions.map((action, index) => (
            <button
              key={index}
              onClick={() => onAction?.(action)}
              className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors'
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Comments Modal */}
      <CommentsModal
        post={selectedPostForComments}
        isOpen={!!selectedPostForComments}
        onClose={() => setSelectedPostForComments(null)}
        onLike={handleLike}
        onShare={handleShare}
        onPlayTrack={handlePlayTrack}
      />
    </div>
  );
}
