/**
 * Timeline Events
 * Event emitter for real-time timeline post updates
 */

import { EventEmitter } from 'events';
import type { TimelinePostWithAuthor } from '@/lib/services/timeline-service';

export interface TimelinePostEvent {
  type: 'post_published' | 'post_updated' | 'post_deleted';
  post: TimelinePostWithAuthor;
  timestamp: Date;
}

class TimelineEventEmitter extends EventEmitter {
  /**
   * Emit a new post published event
   */
  emitPostPublished(post: TimelinePostWithAuthor) {
    this.emit('post_published', {
      type: 'post_published',
      post,
      timestamp: new Date(),
    } as TimelinePostEvent);
  }

  /**
   * Emit a post updated event
   */
  emitPostUpdated(post: TimelinePostWithAuthor) {
    this.emit('post_updated', {
      type: 'post_updated',
      post,
      timestamp: new Date(),
    } as TimelinePostEvent);
  }

  /**
   * Emit a post deleted event
   */
  emitPostDeleted(postId: string) {
    this.emit('post_deleted', {
      type: 'post_deleted',
      post: { id: postId } as TimelinePostWithAuthor,
      timestamp: new Date(),
    } as TimelinePostEvent);
  }
}

// Singleton instance
export const timelineEvents = new TimelineEventEmitter();
