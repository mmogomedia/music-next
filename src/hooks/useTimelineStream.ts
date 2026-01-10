'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/utils/logger';
import type { TimelinePostWithAuthor } from '@/lib/services/timeline-service';

interface StreamEvent {
  type: 'connected' | 'new_posts' | 'heartbeat' | 'error';
  timestamp?: string;
  count?: number;
  posts?: TimelinePostWithAuthor[];
  error?: string;
}

interface UseTimelineStreamOptions {
  enabled?: boolean;
  initialPostId?: string | null; // Most recent post ID to avoid counting existing posts as "new"
  onNewPosts?: (_posts: TimelinePostWithAuthor[]) => void;
  onError?: (_error: Error) => void;
}

export function useTimelineStream(options: UseTimelineStreamOptions = {}) {
  const { enabled = true, initialPostId, onNewPosts, onError } = options;
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [pendingPosts, setPendingPosts] = useState<TimelinePostWithAuthor[]>(
    []
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 second

  const connect = useCallback(() => {
    // CRITICAL: Don't connect without a baseline post ID
    if (!enabled || !session?.user?.id || !initialPostId) {
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      // Reset count when reconnecting to avoid counting duplicates
      setNewPostsCount(0);
      setPendingPosts([]);
    }

    try {
      // Build stream URL with required initial post ID
      const streamUrl = `/api/timeline/stream?sincePostId=${encodeURIComponent(initialPostId)}`;
      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset on successful connection
      };

      eventSource.onmessage = event => {
        try {
          const data: StreamEvent = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              setIsConnected(true);
              break;

            case 'new_posts':
              if (data.posts && data.posts.length > 0) {
                const posts = data.posts;
                // Only count unique new posts that haven't been seen before
                setPendingPosts(prev => {
                  const existingIds = new Set(prev.map(p => p.id));
                  const uniqueNewPosts = posts.filter(
                    p => !existingIds.has(p.id)
                  );
                  // Update count with only truly new posts
                  setNewPostsCount(
                    currentCount => currentCount + uniqueNewPosts.length
                  );
                  return [...uniqueNewPosts, ...prev];
                });
                onNewPosts?.(posts);
              }
              break;

            case 'heartbeat':
              // Just keep connection alive, no action needed
              break;

            case 'error':
              logger.error('SSE error:', data.error);
              onError?.(new Error(data.error || 'Unknown error'));
              break;
          }
        } catch (error) {
          logger.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = _error => {
        setIsConnected(false);
        eventSource.close();

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay =
            baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          logger.error('Max reconnection attempts reached');
          onError?.(new Error('Failed to connect to timeline stream'));
        }
      };
    } catch (error) {
      logger.error('Error creating EventSource:', error);
      onError?.(error as Error);
    }
  }, [enabled, session?.user?.id, initialPostId, onNewPosts, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const clearNewPosts = useCallback(() => {
    setNewPostsCount(0);
    setPendingPosts([]);
  }, []);

  const refreshFeed = useCallback(() => {
    // Clear pending posts and reset count
    clearNewPosts();
    // The parent component should handle the actual refresh
  }, [clearNewPosts]);

  useEffect(() => {
    if (enabled && session?.user?.id) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, session?.user?.id, connect, disconnect]);

  return {
    isConnected,
    newPostsCount,
    pendingPosts,
    clearNewPosts,
    refreshFeed,
    reconnect: connect,
  };
}
