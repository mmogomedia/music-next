import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastCheckTime = new Date();
      let isActive = true;

      const sendMessage = (data: any) => {
        if (!isActive) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Error sending admin activity SSE message:', error);
        }
      };

      sendMessage({ type: 'connected', timestamp: new Date().toISOString() });

      const heartbeatInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(heartbeatInterval);
          return;
        }
        sendMessage({ type: 'heartbeat', timestamp: new Date().toISOString() });
      }, 30000);

      const pollInterval = setInterval(async () => {
        if (!isActive) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const [playEvents, downloadEvents, quickLinkVisits] =
            await Promise.all([
              prisma.playEvent.findMany({
                where: {
                  timestamp: { gt: lastCheckTime },
                },
                orderBy: { timestamp: 'desc' },
                take: 10,
                include: {
                  track: {
                    select: {
                      id: true,
                      title: true,
                      artist: true,
                    },
                  },
                },
              }),
              prisma.downloadEvent.findMany({
                where: {
                  timestamp: { gt: lastCheckTime },
                },
                orderBy: { timestamp: 'desc' },
                take: 10,
                include: {
                  track: {
                    select: {
                      id: true,
                      title: true,
                      artist: true,
                    },
                  },
                },
              }),
              prisma.quickLink.findMany({
                where: {
                  lastVisitedAt: { gt: lastCheckTime },
                },
                orderBy: { lastVisitedAt: 'desc' },
                take: 10,
                include: {
                  track: {
                    select: {
                      id: true,
                      title: true,
                      artist: true,
                    },
                  },
                },
              }),
            ]);

          const newActivities: any[] = [];

          for (const event of playEvents) {
            if (!event.track) continue;
            newActivities.push({
              activityType: 'play',
              track: {
                id: event.track.id,
                title: event.track.title,
                artist: event.track.artist,
              },
              timestamp: event.timestamp.toISOString(),
              source: event.source,
            });
          }

          for (const event of downloadEvents) {
            if (!event.track) continue;
            newActivities.push({
              activityType: 'download',
              track: {
                id: event.track.id,
                title: event.track.title,
                artist: event.track.artist,
              },
              timestamp: event.timestamp.toISOString(),
            });
          }

          for (const visit of quickLinkVisits) {
            if (!visit.track || !visit.lastVisitedAt) continue;
            newActivities.push({
              activityType: 'page_visit',
              track: {
                id: visit.track.id,
                title: visit.track.title,
                artist: visit.track.artist,
              },
              timestamp: visit.lastVisitedAt.toISOString(),
              slug: visit.slug,
            });
          }

          if (newActivities.length > 0) {
            newActivities
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              )
              .forEach(activity => {
                sendMessage({ type: activity.activityType, data: activity });
              });
          }

          lastCheckTime = new Date();
        } catch (error) {
          console.error('Error polling admin activities:', error);
          sendMessage({
            type: 'error',
            data: { message: 'Error fetching activities' },
          });
        }
      }, 5000);

      request.signal.addEventListener('abort', () => {
        isActive = false;
        clearInterval(heartbeatInterval);
        clearInterval(pollInterval);
        try {
          controller.close();
        } catch (error) {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
