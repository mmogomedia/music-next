import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { StatEvent } from '@/lib/stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StatsRequest {
  events: StatEvent[];
}

export async function POST(request: NextRequest) {
  try {
    const { events }: StatsRequest = await request.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Invalid events data' },
        { status: 400 }
      );
    }

    // Process events in batches for better performance
    const batchSize = 50;
    const batches = [];

    for (let i = 0; i < events.length; i += batchSize) {
      batches.push(events.slice(i, i + batchSize));
    }

    // Process each batch
    for (const batch of batches) {
      await processEventBatch(batch);
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (error) {
    console.error('Error processing stats events:', error);
    return NextResponse.json(
      { error: 'Failed to process events' },
      { status: 500 }
    );
  }
}

async function processEventBatch(events: StatEvent[]): Promise<void> {
  const playEvents: any[] = [];
  const likeEvents: any[] = [];
  const saveEvents: any[] = [];
  const shareEvents: any[] = [];
  const downloadEvents: any[] = [];
  const aiSearchEvents: any[] = [];

  // Categorize events by explicit eventType
  for (const event of events) {
    switch (event.eventType) {
      case 'play':
        playEvents.push({
          trackId: event.trackId,
          userId: event.userId,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          source: event.source,
          playlistId: event.playlistId,
          userAgent: event.userAgent,
          ip: event.ip,
          duration: event.duration,
          completionRate: event.completionRate,
          skipped: event.skipped,
          replayed: event.replayed,
        });
        break;

      case 'like':
        likeEvents.push({
          trackId: event.trackId,
          userId: event.userId,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          source: event.source,
          action: event.action,
        });
        break;

      case 'save':
        saveEvents.push({
          trackId: event.trackId,
          userId: event.userId,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          playlistId: event.playlistId,
          action: event.action,
        });
        break;

      case 'share':
        shareEvents.push({
          trackId: event.trackId,
          userId: event.userId,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          platform: event.platform,
          source: event.source,
        });
        break;

      case 'download':
        downloadEvents.push({
          trackId: event.trackId,
          userId: event.userId,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          source: event.source,
          userAgent: event.userAgent,
          ip: event.ip,
        });
        break;

      case 'ai_search':
        aiSearchEvents.push({
          trackId: event.trackId,
          userId: event.userId,
          sessionId: event.sessionId,
          timestamp: event.timestamp,
          conversationId: event.conversationId,
          resultType: event.resultType,
        });
        break;

      default:
        console.warn('Unknown event type:', event);
    }
  }

  // Use transaction to ensure data consistency
  await prisma.$transaction(async tx => {
    // Insert play events
    if (playEvents.length > 0) {
      await tx.playEvent.createMany({
        data: playEvents,
        skipDuplicates: true,
      });

      // Update track play counts
      for (const playEvent of playEvents) {
        await tx.track.update({
          where: { id: playEvent.trackId },
          data: {
            playCount: { increment: 1 },
          },
        });
      }
    }

    // Insert like events
    if (likeEvents.length > 0) {
      await tx.likeEvent.createMany({
        data: likeEvents,
        skipDuplicates: true,
      });

      // Update track like counts
      for (const likeEvent of likeEvents) {
        if (likeEvent.action === 'like') {
          await tx.track.update({
            where: { id: likeEvent.trackId },
            data: {
              likeCount: { increment: 1 },
            },
          });
        } else {
          await tx.track.update({
            where: { id: likeEvent.trackId },
            data: {
              likeCount: { decrement: 1 },
            },
          });
        }
      }
    }

    // Insert save events
    if (saveEvents.length > 0) {
      await tx.saveEvent.createMany({
        data: saveEvents,
        skipDuplicates: true,
      });
    }

    // Insert share events
    if (shareEvents.length > 0) {
      await tx.shareEvent.createMany({
        data: shareEvents,
        skipDuplicates: true,
      });

      // Update track share counts
      for (const shareEvent of shareEvents) {
        await tx.track.update({
          where: { id: shareEvent.trackId },
          data: {
            shareCount: { increment: 1 },
          },
        });
      }
    }

    // Insert download events
    if (downloadEvents.length > 0) {
      await tx.downloadEvent.createMany({
        data: downloadEvents,
        skipDuplicates: true,
      });

      // Update track download counts
      for (const downloadEvent of downloadEvents) {
        await tx.track.update({
          where: { id: downloadEvent.trackId },
          data: {
            downloadCount: { increment: 1 },
          },
        });
      }
    }

    // Insert AI search events
    // Note: This requires the AISearchEvent table to exist in the database
    // If the table doesn't exist yet, this will fail silently or need to be handled
    if (aiSearchEvents.length > 0) {
      try {
        await tx.aiSearchEvent.createMany({
          data: aiSearchEvents,
          skipDuplicates: true,
        });

        // Update track AI search counts (if aiSearchCount field exists)
        for (const aiSearchEvent of aiSearchEvents) {
          await tx.track.update({
            where: { id: aiSearchEvent.trackId },
            data: {
              aiSearchCount: { increment: 1 },
            },
          });
        }
      } catch (error) {
        // If table doesn't exist yet, log error but don't fail the entire batch
        console.warn(
          'Failed to process AI search events (table may not exist yet):',
          error
        );
      }
    }
  });
}
