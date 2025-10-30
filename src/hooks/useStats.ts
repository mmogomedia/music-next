'use client';

import { useEffect, useRef, useState } from 'react';
import { stats, generateSessionId } from '@/lib/stats';
import { useSession } from 'next-auth/react';
import { SourceType, PlatformType, UseStatsOptions } from '@/types/stats';

export function useStats(options: UseStatsOptions = {}) {
  const { data: session } = useSession();
  const [sessionId] = useState(() => generateSessionId());
  const playStartTime = useRef<number | null>(null);
  const currentTrackRef = useRef<string | null>(null);

  // Get user agent and other browser info
  const userAgent =
    typeof window !== 'undefined' ? window.navigator.userAgent : '';

  // Track play start
  const trackPlayStart = (
    trackId: string,
    source?: SourceType,
    playlistId?: string
  ) => {
    if (currentTrackRef.current === trackId) return; // Already tracking this track

    currentTrackRef.current = trackId;
    playStartTime.current = Date.now();

    // Use passed parameters if provided, otherwise fall back to options
    const finalSource = (source || options.source || 'playlist') as SourceType;
    const finalPlaylistId = playlistId || options.playlistId;

    stats.play({
      eventType: 'play',
      trackId,
      userId: session?.user?.id,
      sessionId,
      source: finalSource,
      playlistId: finalPlaylistId,
      userAgent,
      ip: undefined, // Will be captured server-side
    });
  };

  // Track play end with duration
  const trackPlayEnd = (
    trackId: string,
    trackDuration?: number,
    skipped = false
  ) => {
    if (currentTrackRef.current !== trackId || !playStartTime.current) return;

    const playDuration = Math.floor(
      (Date.now() - playStartTime.current) / 1000
    );
    const completionRate = trackDuration
      ? Math.min(100, Math.floor((playDuration / trackDuration) * 100))
      : undefined;

    // Only log if they played for at least 20 seconds (meaningful engagement)
    if (playDuration >= 20) {
      stats.play({
        eventType: 'play',
        trackId,
        userId: session?.user?.id,
        sessionId,
        source: (options.source || 'playlist') as SourceType,
        playlistId: options.playlistId,
        userAgent,
        ip: undefined,
        duration: playDuration,
        completionRate,
        skipped,
      });
    }

    currentTrackRef.current = null;
    playStartTime.current = null;
  };

  // Track like/unlike
  const trackLike = (trackId: string, action: 'like' | 'unlike') => {
    stats.like({
      eventType: 'like',
      trackId,
      userId: session?.user?.id,
      sessionId,
      source: (options.source || 'playlist') as SourceType,
      action,
    });
  };

  // Track save/unsave to playlist
  const trackSave = (
    trackId: string,
    playlistId: string,
    action: 'save' | 'unsave'
  ) => {
    stats.save({
      eventType: 'save',
      trackId,
      userId: session?.user?.id,
      sessionId,
      playlistId,
      action,
    });
  };

  // Track share
  const trackShare = (trackId: string, platform: string) => {
    stats.share({
      eventType: 'share',
      trackId,
      userId: session?.user?.id,
      sessionId,
      platform: platform as PlatformType,
      source: (options.source || 'playlist') as SourceType,
    });
  };

  // Track download
  const trackDownload = (trackId: string) => {
    stats.download({
      eventType: 'download',
      trackId,
      userId: session?.user?.id,
      sessionId,
      source: (options.source || 'playlist') as SourceType,
      userAgent,
      ip: undefined,
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentTrackRef.current && playStartTime.current) {
        trackPlayEnd(currentTrackRef.current, undefined, true);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    sessionId,
    trackPlayStart,
    trackPlayEnd,
    trackLike,
    trackSave,
    trackShare,
    trackDownload,
  };
}

// Hook specifically for tracking music player events
export function useMusicPlayerStats() {
  const { trackPlayStart, trackPlayEnd } = useStats({
    source: 'player' as SourceType,
  });

  const handlePlay = (trackId: string, duration?: number) => {
    trackPlayStart(trackId);

    // Set up automatic tracking for play end
    if (duration) {
      setTimeout(() => {
        trackPlayEnd(trackId, duration);
      }, duration * 1000);
    }
  };

  const handlePause = (trackId: string, currentTime?: number) => {
    if (currentTime !== undefined) {
      trackPlayEnd(trackId, undefined, false);
    }
  };

  const handleStop = (trackId: string, currentTime?: number) => {
    if (currentTime !== undefined) {
      trackPlayEnd(trackId, undefined, true);
    }
  };

  return {
    handlePlay,
    handlePause,
    handleStop,
  };
}
