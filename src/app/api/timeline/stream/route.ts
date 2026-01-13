import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimelineService } from '@/lib/services';
import {
  timelineEvents,
  type TimelinePostEvent,
} from '@/lib/events/timeline-events';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/timeline/stream
 * Server-Sent Events stream for real-time timeline updates
 * Uses event-driven approach: listens for post_published events instead of polling
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  logger.log('[Timeline Stream] Request received', {
    hasSession: !!session?.user?.id,
    userId: session?.user?.id,
  });

  if (!session?.user?.id) {
    logger.log('[Timeline Stream] Unauthorized - no session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get initial post ID from query params (if provided)
  const { searchParams } = new URL(request.url);
  const initialPostId = searchParams.get('sincePostId');

  logger.log('[Timeline Stream] Starting stream', {
    userId: session.user.id,
    initialPostId,
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isActive = true;
      let lastPostId: string | null = initialPostId || null;

      // Helper to send SSE events
      const sendEvent = (data: any) => {
        if (!isActive) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Error sending SSE event:', error);
        }
      };

      // Send initial connection confirmation
      logger.log('[Timeline Stream] Sending connected event');
      sendEvent({
        type: 'connected',
        timestamp: new Date().toISOString(),
      });

      // Event listener for new posts
      const onPostPublished = async (event: TimelinePostEvent) => {
        if (!isActive || !lastPostId) return;

        try {
          const newPost = event.post;

          // Check if this post is newer than the baseline
          const baselinePost = await TimelineService.getPostById(lastPostId);
          if (!baselinePost) {
            // Baseline doesn't exist, update it
            lastPostId = newPost.id;
            sendEvent({
              type: 'new_posts',
              count: 1,
              posts: [newPost],
              timestamp: new Date().toISOString(),
            });
            return;
          }

          const baselineDate =
            baselinePost.publishedAt || baselinePost.createdAt;
          const newPostDate = newPost.publishedAt || newPost.createdAt;

          // Only send if the new post is actually newer
          if (
            newPostDate &&
            baselineDate &&
            (newPostDate > baselineDate ||
              (newPostDate.getTime() === baselineDate.getTime() &&
                newPost.id > lastPostId))
          ) {
            logger.log(
              `[Timeline Stream] Broadcasting new post: ${newPost.id}`
            );
            sendEvent({
              type: 'new_posts',
              count: 1,
              posts: [newPost],
              timestamp: new Date().toISOString(),
            });
            // Update lastPostId to the most recent post
            lastPostId = newPost.id;
          }
        } catch (error) {
          console.error('Error processing post published event:', error);
        }
      };

      // Register event listener
      timelineEvents.on('post_published', onPostPublished);

      // Fallback poll function (less frequent, only as backup)
      // This handles edge cases where events might be missed
      const pollForNewPosts = async () => {
        if (!isActive || !lastPostId) {
          return;
        }

        try {
          const newPosts = await TimelineService.getNewPosts(
            session.user.id,
            lastPostId
          );

          if (newPosts.length > 0) {
            logger.log(
              `[Timeline Stream] Fallback poll found ${newPosts.length} new posts since ${lastPostId}`
            );
            sendEvent({
              type: 'new_posts',
              count: newPosts.length,
              posts: newPosts,
              timestamp: new Date().toISOString(),
            });
            // Update lastPostId to the most recent post
            lastPostId = newPosts[0].id;
          }
        } catch (error) {
          console.error('Error polling for new posts:', error);
        }
      };

      // CRITICAL: Only poll if we have a valid baseline post ID
      if (!initialPostId) {
        // Send a message that baseline is required
        sendEvent({
          type: 'error',
          error:
            'Baseline post ID required. Stream will not poll until baseline is set.',
          timestamp: new Date().toISOString(),
        });
      } else {
        // Initial poll to catch any posts published before connection
        pollForNewPosts();
      }

      // Heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(heartbeatInterval);
          return;
        }
        sendEvent({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        });
      }, 30000);

      // Fallback poll every 30 seconds (much less frequent since we have events)
      // This is just a safety net in case events are missed
      const pollInterval = setInterval(pollForNewPosts, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        isActive = false;
        timelineEvents.off('post_published', onPostPublished);
        clearInterval(heartbeatInterval);
        clearInterval(pollInterval);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
