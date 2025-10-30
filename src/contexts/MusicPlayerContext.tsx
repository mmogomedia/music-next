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

interface MusicPlayerContextType {
  // State
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;

  // Actions
  playTrack: (
    _track: Track,
    _source?: SourceType,
    _playlistId?: string
  ) => void;
  playPause: () => void;
  seekTo: (_time: number) => void;
  setVolume: (_newVolume: number) => void;
  stop: () => void;
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;

      // Add event listeners
      const audio = audioRef.current;

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);

        // Track play completion
        if (currentTrack && playStartTimeRef.current) {
          trackPlayEnd(currentTrack.id, duration, false); // Not skipped, completed
          playStartTimeRef.current = null;
        }
      };

      const handlePlay = () => {
        setIsPlaying(true);

        // Track play start
        if (currentTrack) {
          playStartTimeRef.current = Date.now();
          trackPlayStart(currentTrack.id);
        }
      };

      const handlePause = () => {
        setIsPlaying(false);

        // Track play pause/end
        if (currentTrack && playStartTimeRef.current) {
          const playDuration = Math.floor(
            (Date.now() - playStartTimeRef.current) / 1000
          );
          const skipped = playDuration < 20; // Less than 20 seconds = skipped

          trackPlayEnd(currentTrack.id, duration, skipped);
          playStartTimeRef.current = null;
        }
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.pause();
        audio.src = '';
      };
    }
  }, [volume]);

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
      // Same track - toggle play/pause
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    } else {
      // New track - stop current and play new
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      setCurrentTrack(track);
      audioRef.current.src = track.fileUrl || '';
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
    playTrack,
    playPause,
    seekTo,
    setVolume: setVolumeLevel,
    stop,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}
