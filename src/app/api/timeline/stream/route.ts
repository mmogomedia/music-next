import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TimelineService } from '@/lib/services';

export const dynamic = 'force-dynamic';

/**
 * GET /api/timeline/stream
 * Server-Sent Events stream for real-time timeline updates
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get initial post ID from query params (if provided)
  const { searchParams } = new URL(request.url);
  const initialPostId = searchParams.get('sincePostId');

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
      sendEvent({
        type: 'connected',
        timestamp: new Date().toISOString(),
      });

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

      // Poll for new posts every 5 seconds
      // CRITICAL: Only poll if we have a valid baseline post ID
      // If no initialPostId was provided, don't poll at all (client hasn't loaded feed yet)
      if (!initialPostId) {
        // Send a message that baseline is required
        sendEvent({
          type: 'error',
          error:
            'Baseline post ID required. Stream will not poll until baseline is set.',
          timestamp: new Date().toISOString(),
        });
      }

      const pollInterval = setInterval(async () => {
        if (!isActive) {
          clearInterval(pollInterval);
          return;
        }

        // CRITICAL: Never poll without a baseline post ID
        if (!lastPostId) {
          return;
        }

        try {
          const newPosts = await TimelineService.getNewPosts(
            session.user.id,
            lastPostId
          );

          if (newPosts.length > 0) {
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
          sendEvent({
            type: 'error',
            error: 'Failed to fetch new posts',
            timestamp: new Date().toISOString(),
          });
        }
      }, 5000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        isActive = false;
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
