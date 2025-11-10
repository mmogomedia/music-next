'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { Track } from '@/types/track';
import { useStats } from '@/hooks/useStats';
import { SourceType } from '@/types/stats';
import { constructFileUrl } from '@/lib/url-utils';
import { logger } from '@/lib/utils/logger';

interface MusicPlayerContextType {
  // State
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isBuffering: boolean;
  repeatMode: 'off' | 'one' | 'all';
  shuffle: boolean;
  queue: Track[];
  queueIndex: number;

  // Actions
  playTrack: (
    _track: Track,
    _source?: SourceType,
    _playlistId?: string
  ) => void;
  playPause: () => void;
  seekTo: (_time: number) => void;
  setVolume: (_newVolume: number) => void;
  toggleMute: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  setQueue: (
    _tracks: Track[],
    _startIndex?: number,
    _source?: SourceType,
    _playlistId?: string
  ) => void;
  addToQueue: (_track: Track, _playNext?: boolean) => void;
  removeFromQueue: (_trackId: string) => void;
  toggleShuffle: () => void;
  setRepeatMode: (_mode: 'off' | 'one' | 'all') => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
  undefined
);

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}

interface MusicPlayerProviderProps {
  children: ReactNode;
}

export function MusicPlayerProvider({ children }: MusicPlayerProviderProps) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [repeatMode, setRepeatModeState] = useState<'off' | 'one' | 'all'>(
    'off'
  );
  const [shuffle, setShuffle] = useState(false);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Refs to access latest values in event handlers
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef<number>(0);
  const repeatModeRef = useRef<'off' | 'one' | 'all'>('off');
  const shuffleRef = useRef<boolean>(false);
  const currentTrackRef = useRef<Track | null>(null);
  const currentSourceRef = useRef<SourceType>('player');
  const currentPlaylistIdRef = useRef<string | undefined>(undefined);

  // Stats tracking - will be updated dynamically based on source
  const [currentSource, setCurrentSource] = useState<SourceType>('player');
  const [currentPlaylistId, setCurrentPlaylistId] = useState<
    string | undefined
  >();
  const playStartTimeRef = useRef<number | null>(null);

  // Create stats hook with current source and playlistId
  // This will be recreated when currentSource or currentPlaylistId changes
  const statsOptions = useMemo(
    () => ({
      source: currentSource as any,
      playlistId: currentPlaylistId,
    }),
    [currentSource, currentPlaylistId]
  );
  const { trackPlayStart, trackPlayEnd } = useStats(statsOptions);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Restore persisted settings
      try {
        const savedVolume = localStorage.getItem('player:volume');
        const savedMuted = localStorage.getItem('player:muted');
        const savedRepeat = localStorage.getItem('player:repeat');
        const savedShuffle = localStorage.getItem('player:shuffle');
        if (savedVolume !== null) setVolume(parseFloat(savedVolume));
        if (savedMuted !== null) setIsMuted(savedMuted === '1');
        if (
          savedRepeat === 'off' ||
          savedRepeat === 'one' ||
          savedRepeat === 'all'
        )
          setRepeatModeState(savedRepeat);
        if (savedShuffle !== null) setShuffle(savedShuffle === '1');
      } catch (error) {
        logger.warn('Failed to load persisted player settings', error);
      }

      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;

      // Add event listeners
      const audio = audioRef.current;

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        // Track play completion for current track
        const track = currentTrackRef.current;
        if (track && playStartTimeRef.current) {
          trackPlayEnd(track.id, duration, false);
          playStartTimeRef.current = null;
        }

        // Auto-advance based on repeat/shuffle/queue
        const repeat = repeatModeRef.current;
        if (repeat === 'one' && track) {
          // Replay the same track
          playTrack(
            track,
            currentSourceRef.current,
            currentPlaylistIdRef.current
          );
          return;
        }
        // Call next using the latest queue state
        const currentQueue = queueRef.current;
        const currentIndex = queueIndexRef.current;
        const isShuffle = shuffleRef.current;

        let nextIdx: number | null = null;
        if (currentQueue.length === 0) {
          nextIdx = null;
        } else if (isShuffle && currentQueue.length > 1) {
          let next = currentIndex;
          while (next === currentIndex) {
            next = Math.floor(Math.random() * currentQueue.length);
          }
          nextIdx = next;
        } else if (currentIndex < currentQueue.length - 1) {
          nextIdx = currentIndex + 1;
        } else if (repeat === 'all') {
          nextIdx = 0;
        } else {
          nextIdx = null;
        }

        if (nextIdx === null) {
          setIsPlaying(false);
          return;
        }

        setQueueIndex(nextIdx);
        const nextTrack = currentQueue[nextIdx];
        if (nextTrack) {
          playTrack(
            nextTrack,
            currentSourceRef.current,
            currentPlaylistIdRef.current
          );
        }
      };

      const handlePlay = () => {
        setIsPlaying(true);
        setIsBuffering(false);

        // Track play start
        const track = currentTrackRef.current;
        if (track) {
          playStartTimeRef.current = Date.now();
          trackPlayStart(track.id);
        }
      };

      const handlePause = () => {
        setIsPlaying(false);

        // Track play pause/end
        const track = currentTrackRef.current;
        if (track && playStartTimeRef.current) {
          const playDuration = Math.floor(
            (Date.now() - playStartTimeRef.current) / 1000
          );
          const skipped = playDuration < 20; // Less than 20 seconds = skipped

          trackPlayEnd(track.id, duration, skipped);
          playStartTimeRef.current = null;
        }
      };

      const handleWaiting = () => setIsBuffering(true);
      const handleCanPlay = () => setIsBuffering(false);
      const handleError = () => {
        setIsBuffering(false);
        logger.error('Audio playback error');
        // Try to advance to next track on error using refs
        const currentQueue = queueRef.current;
        const currentIndex = queueIndexRef.current;
        const isShuffle = shuffleRef.current;
        const repeat = repeatModeRef.current;

        let nextIdx: number | null = null;
        if (currentQueue.length === 0) {
          nextIdx = null;
        } else if (isShuffle && currentQueue.length > 1) {
          let next = currentIndex;
          while (next === currentIndex) {
            next = Math.floor(Math.random() * currentQueue.length);
          }
          nextIdx = next;
        } else if (currentIndex < currentQueue.length - 1) {
          nextIdx = currentIndex + 1;
        } else if (repeat === 'all') {
          nextIdx = 0;
        } else {
          nextIdx = null;
        }

        if (nextIdx !== null) {
          setQueueIndex(nextIdx);
          const nextTrack = currentQueue[nextIdx];
          if (nextTrack) {
            playTrack(
              nextTrack,
              currentSourceRef.current,
              currentPlaylistIdRef.current
            );
          }
        } else {
          setIsPlaying(false);
        }
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('waiting', handleWaiting);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('waiting', handleWaiting);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('error', handleError);
        audio.pause();
        audio.src = '';
      };
    }
  }, [volume, isMuted]);

  // Keep refs in sync with state
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);
  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);
  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);
  useEffect(() => {
    currentSourceRef.current = currentSource;
  }, [currentSource]);
  useEffect(() => {
    currentPlaylistIdRef.current = currentPlaylistId;
  }, [currentPlaylistId]);

  // Persist basic settings
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('player:volume', String(volume));
      localStorage.setItem('player:muted', isMuted ? '1' : '0');
      localStorage.setItem('player:repeat', repeatMode);
      localStorage.setItem('player:shuffle', shuffle ? '1' : '0');
    } catch (error) {
      logger.warn('Failed to persist player settings', error);
    }
  }, [volume, isMuted, repeatMode, shuffle]);

  // Media Session metadata and actions
  useEffect(() => {
    if (
      typeof navigator !== 'undefined' &&
      'mediaSession' in navigator &&
      currentTrack
    ) {
      try {
        navigator.mediaSession.metadata = new (window as any).MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist || 'Unknown Artist',
          album: '',
          artwork: currentTrack.coverImageUrl
            ? [
                {
                  src: currentTrack.coverImageUrl,
                  sizes: '512x512',
                  type: 'image/png',
                },
              ]
            : [],
        });
        navigator.mediaSession.setActionHandler('play', () => playPause());
        navigator.mediaSession.setActionHandler('pause', () => playPause());
        navigator.mediaSession.setActionHandler('previoustrack', () =>
          previous()
        );
        navigator.mediaSession.setActionHandler('nexttrack', () => next());
        navigator.mediaSession.setActionHandler('seekto', (details: any) => {
          if (typeof details.seekTime === 'number') seekTo(details.seekTime);
        });
      } catch (error) {
        logger.warn('Failed to update media session metadata', error);
      }
    }
  }, [currentTrack, currentTime]);

  const playTrack = (
    track: Track,
    source: SourceType = 'player',
    playlistId?: string
  ) => {
    if (!audioRef.current) return;

    // Update source and playlistId for stats tracking
    setCurrentSource(source);
    setCurrentPlaylistId(playlistId);

    if (currentTrack?.id === track.id) {
      // Same track - just restart playback (for repeat 'one' mode)
      // Don't modify the queue - preserve it
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play();

      // Track new play start for stats
      playStartTimeRef.current = Date.now();
      trackPlayStart(track.id, source, playlistId);
    } else {
      // New track - stop current and play new
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      setCurrentTrack(track);
      // Ensure queue contains the track if empty or different
      const currentQueue = queueRef.current;
      if (currentQueue.length === 0) {
        setQueueState([track]);
        setQueueIndex(0);
      } else {
        const idx = currentQueue.findIndex(t => t.id === track.id);
        if (idx >= 0) {
          setQueueIndex(idx);
        } else {
          // Track not in queue - add it to the end and set as current
          setQueueState([...currentQueue, track]);
          setQueueIndex(currentQueue.length);
        }
      }

      // Construct fileUrl from filePath if fileUrl is missing
      const audioUrl =
        track.fileUrl ||
        (track.filePath ? constructFileUrl(track.filePath) : '');

      if (!audioUrl) {
        logger.error(
          'No valid audio URL found for track:',
          track.id,
          track.title
        );
        return;
      }

      audioRef.current.src = audioUrl;
      audioRef.current.volume = volume;
      audioRef.current.play();

      // Track new track play start
      playStartTimeRef.current = Date.now();
      trackPlayStart(track.id, source, playlistId);
    }
  };

  const playPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const seekTo = (time: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const setVolumeLevel = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) audioRef.current.muted = nextMuted;
  };

  const resolveNextIndex = (): number | null => {
    const currentQueue = queueRef.current;
    const currentIndex = queueIndexRef.current;
    const isShuffle = shuffleRef.current;
    const repeat = repeatModeRef.current;

    if (currentQueue.length === 0) return null;
    if (isShuffle && currentQueue.length > 1) {
      let next = currentIndex;
      while (next === currentIndex) {
        next = Math.floor(Math.random() * currentQueue.length);
      }
      return next;
    }
    if (currentIndex < currentQueue.length - 1) return currentIndex + 1;
    if (repeat === 'all') return 0;
    return null;
  };

  const next = () => {
    const nextIdx = resolveNextIndex();
    if (nextIdx === null) {
      setIsPlaying(false);
      return;
    }
    setQueueIndex(nextIdx);
    const nextTrack = queueRef.current[nextIdx];
    if (nextTrack) {
      playTrack(
        nextTrack,
        currentSourceRef.current,
        currentPlaylistIdRef.current
      );
    }
  };

  const previous = () => {
    const currentQueue = queueRef.current;
    const currentIndex = queueIndexRef.current;
    const isShuffle = shuffleRef.current;
    const repeat = repeatModeRef.current;

    if (isShuffle && currentQueue.length > 1) {
      // In shuffle, pick a different random track
      let prev = currentIndex;
      while (prev === currentIndex) {
        prev = Math.floor(Math.random() * currentQueue.length);
      }
      setQueueIndex(prev);
      const prevTrack = currentQueue[prev];
      if (prevTrack)
        playTrack(
          prevTrack,
          currentSourceRef.current,
          currentPlaylistIdRef.current
        );
      return;
    }
    const prevIdx =
      currentIndex > 0
        ? currentIndex - 1
        : repeat === 'all'
          ? currentQueue.length - 1
          : -1;
    if (prevIdx === -1) return;
    setQueueIndex(prevIdx);
    const prevTrack = currentQueue[prevIdx];
    if (prevTrack)
      playTrack(
        prevTrack,
        currentSourceRef.current,
        currentPlaylistIdRef.current
      );
  };

  const setQueue = (
    tracks: Track[],
    startIndex: number = 0,
    source: SourceType = 'player',
    playlistId?: string
  ) => {
    setQueueState(tracks);
    setQueueIndex(Math.max(0, Math.min(tracks.length - 1, startIndex)));
    if (tracks.length > 0) {
      playTrack(tracks[startIndex], source, playlistId);
    }
  };

  const addToQueue = (track: Track, playNext = false) => {
    let shouldAutoplay = false;
    setQueueState(prev => {
      if (prev.some(t => t.id === track.id)) {
        return prev;
      }

      if (prev.length === 0) {
        setQueueIndex(0);
        shouldAutoplay = true;
        return [track];
      }

      if (playNext) {
        const nextQueue = [...prev];
        const insertIndex = Math.min(queueIndex + 1, nextQueue.length);
        nextQueue.splice(insertIndex, 0, track);
        return nextQueue;
      }

      return [...prev, track];
    });

    if (shouldAutoplay) {
      playTrack(track, currentSource, currentPlaylistId);
    }
  };

  const removeFromQueue = (trackId: string) => {
    const removedIndex = queue.findIndex(t => t.id === trackId);
    if (removedIndex < 0) return; // Track not in queue

    const newQueue = queue.filter(t => t.id !== trackId);
    setQueueState(newQueue);

    // Adjust queueIndex if needed
    if (removedIndex < queueIndex) {
      // Removed track was before current, decrement index
      setQueueIndex(Math.max(0, queueIndex - 1));
    } else if (removedIndex === queueIndex && newQueue.length > 0) {
      // Removed current track, play next if available
      const nextIndex = Math.min(queueIndex, newQueue.length - 1);
      setQueueIndex(nextIndex);
      if (newQueue[nextIndex]) {
        // Use setTimeout to avoid calling playTrack during state update
        setTimeout(() => {
          playTrack(newQueue[nextIndex], currentSource, currentPlaylistId);
        }, 0);
      }
    } else if (removedIndex === queueIndex && newQueue.length === 0) {
      // Removed last track, stop playback
      stop();
    }
    // If removedIndex > queueIndex, no adjustment needed
  };

  const toggleShuffle = () => setShuffle(s => !s);
  const setRepeatMode = (mode: 'off' | 'one' | 'all') =>
    setRepeatModeState(mode);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const value: MusicPlayerContextType = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isBuffering,
    repeatMode,
    shuffle,
    queue,
    queueIndex,
    playTrack,
    playPause,
    seekTo,
    setVolume: setVolumeLevel,
    toggleMute,
    stop,
    next,
    previous,
    setQueue,
    addToQueue,
    removeFromQueue,
    toggleShuffle,
    setRepeatMode,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
