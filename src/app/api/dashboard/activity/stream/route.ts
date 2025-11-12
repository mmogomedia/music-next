import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// SSE endpoint for real-time activity updates
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastCheckTime = new Date();
      let isActive = true;

      // Send initial connection message
      const sendMessage = (data: any) => {
        if (!isActive) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Error sending SSE message:', error);
        }
      };

      // Send initial connection confirmation
      sendMessage({ type: 'connected', timestamp: new Date().toISOString() });

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(heartbeatInterval);
          return;
        }
        sendMessage({ type: 'heartbeat', timestamp: new Date().toISOString() });
      }, 30000);

      // Poll for new activities every 5 seconds
      const pollInterval = setInterval(async () => {
        if (!isActive) {
          clearInterval(pollInterval);
          return;
        }

        try {
          // Get user's tracks
          const userTracks = await prisma.track.findMany({
            where: { userId },
            select: { id: true },
          });

          const trackIds = userTracks.map(t => t.id);

          if (trackIds.length === 0) {
            return;
          }

          // Get new plays since last check
          const newPlays = await prisma.playEvent.findMany({
            where: {
              trackId: { in: trackIds },
              timestamp: { gt: lastCheckTime },
            },
            include: {
              track: {
                select: {
                  id: true,
                  title: true,
                  artist: true,
                },
              },
            },
            orderBy: { timestamp: 'desc' },
            take: 10,
          });

          // Get new downloads since last check
          const newDownloads = await prisma.downloadEvent.findMany({
            where: {
              trackId: { in: trackIds },
              timestamp: { gt: lastCheckTime },
            },
            include: {
              track: {
                select: {
                  id: true,
                  title: true,
                  artist: true,
                },
              },
            },
            orderBy: { timestamp: 'desc' },
            take: 10,
          });

          // Get new quick link visits (page visits) for user's tracks
          const userQuickLinks = await prisma.quickLink.findMany({
            where: {
              trackId: { in: trackIds },
            },
            select: { id: true, slug: true, trackId: true },
          });

          const quickLinkIds = userQuickLinks.map(ql => ql.id);

          // Check for quick link visits by querying the QuickLink model's lastVisitedAt
          const quickLinksWithNewVisits = await prisma.quickLink.findMany({
            where: {
              id: { in: quickLinkIds },
              lastVisitedAt: {
                gt: lastCheckTime,
              },
            },
            include: {
              track: {
                select: {
                  id: true,
                  title: true,
                  artist: true,
                },
              },
            },
          });

          // Send new activities
          for (const play of newPlays) {
            sendMessage({
              type: 'play',
              data: {
                track: play.track,
                timestamp: play.timestamp.toISOString(),
                source: play.source,
              },
            });
          }

          for (const download of newDownloads) {
            sendMessage({
              type: 'download',
              data: {
                track: download.track,
                timestamp: download.timestamp.toISOString(),
              },
            });
          }

          for (const quickLink of quickLinksWithNewVisits) {
            if (quickLink.track) {
              sendMessage({
                type: 'page_visit',
                data: {
                  track: quickLink.track,
                  timestamp:
                    quickLink.lastVisitedAt?.toISOString() ||
                    new Date().toISOString(),
                  slug: quickLink.slug,
                },
              });
            }
          }

          // Update last check time
          lastCheckTime = new Date();
        } catch (error) {
          console.error('Error polling for activities:', error);
          sendMessage({
            type: 'error',
            data: { message: 'Error fetching activities' },
          });
        }
      }, 5000); // Poll every 5 seconds

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        isActive = false;
        clearInterval(heartbeatInterval);
        clearInterval(pollInterval);
        try {
          controller.close();
        } catch (error) {
          // Ignore errors on close
        }
      });
    },
  });

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in Nginx
    },
  });
}
