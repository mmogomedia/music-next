/**
 * Server-side Stats Service
 * Direct database operations for stats tracking from server-side code
 */

import { prisma } from '@/lib/db';
import { AISearchEvent } from '@/lib/stats';
import { logger } from '@/lib/utils/logger';

/**
 * Process AI search events directly on the server
 * This is used by server-side code (e.g., discovery agent) to track events
 */
export async function processAISearchEvents(
  events: Omit<AISearchEvent, 'timestamp'>[]
): Promise<void> {
  if (!events || events.length === 0) {
    return;
  }

  try {
    // Prepare events for database insertion
    const aiSearchEvents = events.map(event => ({
      trackId: event.trackId,
      userId: event.userId || null,
      conversationId: event.conversationId || null,
      resultType: event.resultType,
      timestamp: new Date(),
    }));

    // Use transaction to ensure data consistency
    await prisma.$transaction(async tx => {
      // Insert AI search events
      await tx.aISearchEvent.createMany({
        data: aiSearchEvents,
        skipDuplicates: true,
      });

      // Update track AI search counts (atomic increment)
      // Count once per unique track (deduplication already handled in discovery agent)
      const uniqueTrackIds = new Set(events.map(e => e.trackId));
      for (const trackId of uniqueTrackIds) {
        await tx.track.update({
          where: { id: trackId },
          data: {
            aiSearchCount: { increment: 1 },
          },
        });
      }
    });
  } catch (error) {
    // Log error but don't throw - tracking should be non-blocking
    logger.error('Failed to process AI search events:', error);
  }
}
