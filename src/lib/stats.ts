/**
 * Non-blocking Stats and Analytics System
 * Designed for music scouting and artist discovery
 */

import { SourceType, PlatformType } from '@/types/stats';

export interface PlayEvent {
  eventType: 'play';
  trackId: string;
  userId?: string; // Optional for anonymous users
  sessionId: string;
  timestamp: Date;
  source: SourceType;
  playlistId?: string;
  userAgent: string;
  ip?: string; // For geographic data
  duration?: number; // How long they actually played
  completionRate?: number; // 0-100%
  skipped?: boolean;
  replayed?: boolean;
}

export interface LikeEvent {
  eventType: 'like';
  trackId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  source: SourceType;
  action: 'like' | 'unlike';
}

export interface SaveEvent {
  eventType: 'save';
  trackId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  playlistId: string;
  action: 'save' | 'unsave';
}

export interface ShareEvent {
  eventType: 'share';
  trackId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  platform: PlatformType;
  source: SourceType;
}

export interface DownloadEvent {
  eventType: 'download';
  trackId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  source: SourceType;
  userAgent: string;
  ip?: string;
}

export type StatEvent =
  | PlayEvent
  | LikeEvent
  | SaveEvent
  | ShareEvent
  | DownloadEvent;

class StatsCollector {
  private eventQueue: StatEvent[] = [];
  private isProcessing = false;
  private readonly BATCH_SIZE = 50;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private readonly MAX_QUEUE_SIZE = 1000;

  constructor() {
    // Auto-flush every 5 seconds
    setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushSync();
      });
    }
  }

  /**
   * Record a play event (non-blocking)
   */
  recordPlay(event: Omit<PlayEvent, 'timestamp'>): void {
    const playEvent: PlayEvent = {
      eventType: 'play',
      ...event,
      timestamp: new Date(),
    };

    this.enqueue(playEvent);
  }

  /**
   * Record a like event (non-blocking)
   */
  recordLike(event: Omit<LikeEvent, 'timestamp'>): void {
    const likeEvent: LikeEvent = {
      eventType: 'like',
      ...event,
      timestamp: new Date(),
    };

    this.enqueue(likeEvent);
  }

  /**
   * Record a save event (non-blocking)
   */
  recordSave(event: Omit<SaveEvent, 'timestamp'>): void {
    const saveEvent: SaveEvent = {
      eventType: 'save',
      ...event,
      timestamp: new Date(),
    };

    this.enqueue(saveEvent);
  }

  /**
   * Record a share event (non-blocking)
   */
  recordShare(event: Omit<ShareEvent, 'timestamp'>): void {
    const shareEvent: ShareEvent = {
      eventType: 'share',
      ...event,
      timestamp: new Date(),
    };

    this.enqueue(shareEvent);
  }

  /**
   * Record a download event (non-blocking)
   */
  recordDownload(event: Omit<DownloadEvent, 'timestamp'>): void {
    const downloadEvent: DownloadEvent = {
      eventType: 'download',
      ...event,
      timestamp: new Date(),
    };

    this.enqueue(downloadEvent);
  }

  private enqueue(event: StatEvent): void {
    // Prevent queue overflow
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      console.warn('Stats queue full, dropping oldest events');
      this.eventQueue = this.eventQueue.slice(-this.MAX_QUEUE_SIZE + 1);
    }

    this.eventQueue.push(event);

    // Auto-flush if batch size reached
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Flush events to server (non-blocking)
   */
  private async flush(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const events = this.eventQueue.splice(0, this.BATCH_SIZE);

    try {
      await fetch('/api/stats/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
        keepalive: true, // Important for page unload
      });
    } catch (error) {
      console.error('Failed to send stats:', error);
      // Re-queue events on failure (except for old events)
      const now = Date.now();
      const recentEvents = events.filter(
        event => now - event.timestamp.getTime() < 300000 // 5 minutes
      );
      this.eventQueue.unshift(...recentEvents);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Synchronous flush for page unload (blocking but necessary)
   */
  private flushSync(): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Use sendBeacon for reliable delivery on page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/stats/events', JSON.stringify({ events }));
    } else {
      // Fallback: synchronous fetch (blocks but ensures delivery)
      fetch('/api/stats/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
        keepalive: true,
      }).catch(() => {
        // Ignore errors on page unload
      });
    }
  }
}

// Singleton instance
export const statsCollector = new StatsCollector();

// Helper functions for easy usage
export const stats = {
  play: (event: Omit<PlayEvent, 'timestamp'>) =>
    statsCollector.recordPlay(event),
  like: (event: Omit<LikeEvent, 'timestamp'>) =>
    statsCollector.recordLike(event),
  save: (event: Omit<SaveEvent, 'timestamp'>) =>
    statsCollector.recordSave(event),
  share: (event: Omit<ShareEvent, 'timestamp'>) =>
    statsCollector.recordShare(event),
  download: (event: Omit<DownloadEvent, 'timestamp'>) =>
    statsCollector.recordDownload(event),
};

// Session ID generator
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Source detection helper
export const detectSource = (): SourceType => {
  if (typeof window === 'undefined') return 'direct';

  const referrer = document.referrer;
  if (!referrer) return 'direct';

  const url = new URL(referrer);
  const hostname = url.hostname;

  if (hostname === window.location.hostname) return 'landing';
  if (hostname.includes('google')) return 'search';
  if (
    hostname.includes('facebook') ||
    hostname.includes('twitter') ||
    hostname.includes('instagram')
  ) {
    return 'share';
  }

  return 'direct';
};
