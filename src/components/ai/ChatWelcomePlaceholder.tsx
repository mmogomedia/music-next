'use client';

import React, { useEffect, useState } from 'react';
import { Chip } from '@heroui/react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Track } from '@/types/track';
import TrackArtwork from '@/components/music/TrackArtwork';

interface ChatWelcomePlaceholderProps {
  province?: string;
  genre?: string;
}

export default function ChatWelcomePlaceholder({
  province,
  genre,
}: ChatWelcomePlaceholderProps) {
  const [featured, setFeatured] = useState<Track[]>([]);
  const [topTen, setTopTen] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = useMusicPlayer();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fRes, tRes] = await Promise.all([
          fetch('/api/playlists/featured').catch(() => null),
          fetch('/api/playlists/top-ten').catch(() => null),
        ]);

        if (fRes && fRes.ok) {
          const fJson = await fRes.json();
          const tracks = (fJson.tracks || []).slice(0, 3).map((t: any) => ({
            id: String(t.id),
            title: t.title || 'Untitled',
            artist: t.artist || 'Unknown Artist',
            coverImageUrl: t.coverImageUrl || t.albumArtwork,
            albumArtwork: t.albumArtwork,
            fileUrl: t.fileUrl,
            filePath: t.filePath || '',
            playCount: t.playCount || 0,
            likeCount: t.likeCount || 0,
            artistId: t.artistProfileId || t.userId || '',
            userId: t.userId || '',
            createdAt: t.createdAt || new Date(),
            updatedAt: t.updatedAt || new Date(),
            duration: t.duration,
            genre: t.genre,
          }));
          setFeatured(tracks);
        }

        if (tRes && tRes.ok) {
          const tJson = await tRes.json();
          const tracks = (tJson.tracks || []).slice(0, 10).map((t: any) => ({
            id: String(t.id),
            title: t.title || 'Untitled',
            artist: t.artist || 'Unknown Artist',
            coverImageUrl: t.coverImageUrl || t.albumArtwork,
            albumArtwork: t.albumArtwork,
            fileUrl: t.fileUrl,
            filePath: t.filePath || '',
            playCount: t.playCount || 0,
            likeCount: t.likeCount || 0,
            artistId: t.artistProfileId || t.userId || '',
            userId: t.userId || '',
            createdAt: t.createdAt || new Date(),
            updatedAt: t.updatedAt || new Date(),
            duration: t.duration,
            genre: t.genre,
          }));
          setTopTen(tracks);
        }
      } catch (error) {
        console.error('Error fetching tracks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = (track: Track) => {
    playTrack(track);
  };

  // Featured track card - redesigned with player integration
  const FeaturedTrackCard = ({
    track,
    index,
  }: {
    track: Track;
    index: number;
  }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const { currentTrack, isPlaying, playPause } = useMusicPlayer();

    // Check if this track is currently playing
    const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
    const isCurrentTrack = currentTrack?.id === track.id;

    const handleClick = () => {
      if (isCurrentTrack) {
        // If this is the current track, toggle play/pause
        playPause();
      } else {
        // Otherwise, play this track
        handlePlay(track);
      }
    };

    return (
      <button
        type='button'
        className={`group relative bg-white dark:bg-slate-800 border-2 rounded-xl overflow-hidden transition-all duration-300 ease-out cursor-pointer ${
          isCurrentTrack
            ? 'border-blue-500 dark:border-blue-400 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/30 dark:ring-blue-400/30'
            : 'border-gray-200/80 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/10'
        }`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`Play ${track.title} by ${track.artist || 'artist'}`}
      >
        {/* Playing indicator bar */}
        {isCurrentlyPlaying && (
          <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 z-10 animate-pulse' />
        )}

        {/* Artwork */}
        <div className='relative aspect-square overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-blue-950/40 dark:via-purple-950/30 dark:to-green-950/40'>
          {track.coverImageUrl || track.albumArtwork ? (
            <div className='absolute inset-0'>
              <TrackArtwork
                artworkUrl={track.coverImageUrl || track.albumArtwork}
                title={track.title}
                size='xl'
                className={`w-full h-full object-cover transition-transform duration-500 ${isCurrentlyPlaying ? 'scale-110' : isHovered ? 'scale-105' : 'scale-100'}`}
              />
              {/* Overlay - stronger when playing */}
              <div
                className={`absolute inset-0 transition-opacity duration-300 ${
                  isCurrentlyPlaying
                    ? 'bg-gradient-to-t from-blue-600/30 via-transparent to-transparent opacity-100'
                    : isHovered
                      ? 'bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-100'
                      : 'opacity-0'
                }`}
              ></div>
            </div>
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
              <svg
                className='w-16 h-16 text-gray-400 dark:text-gray-500'
                fill='currentColor'
                viewBox='0 0 24 24'
              >
                <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
              </svg>
            </div>
          )}

          {/* Play/Pause button overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
              isHovered || isCurrentlyPlaying
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-95'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full backdrop-blur-sm flex items-center justify-center shadow-2xl ring-2 transition-all ${
                isCurrentlyPlaying
                  ? 'bg-blue-500/95 dark:bg-blue-600/95 ring-blue-400/50'
                  : 'bg-white/95 dark:bg-slate-900/95 ring-blue-500/20'
              }`}
            >
              {isCurrentlyPlaying ? (
                <svg
                  className='w-8 h-8 text-white'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M6 4h4v16H6V4zm8 0h4v16h-4V4z' />
                </svg>
              ) : (
                <svg
                  className='w-8 h-8 text-blue-600 dark:text-blue-400 ml-0.5'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M8 5v14l11-7z' />
                </svg>
              )}
            </div>
          </div>

          {/* Hot badge for first track */}
          {index === 0 && (
            <div className='absolute top-2 left-2 z-10'>
              <span className='px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-[10px] font-bold uppercase rounded-full shadow-lg'>
                Hot
              </span>
            </div>
          )}

          {/* Now playing badge */}
          {isCurrentTrack && (
            <div className='absolute top-2 right-2 z-10'>
              <div className='flex items-center gap-1 px-2 py-0.5 bg-blue-500/90 dark:bg-blue-600/90 backdrop-blur-sm rounded-full'>
                {isCurrentlyPlaying && (
                  <div className='flex gap-0.5 items-end h-3'>
                    <span
                      className='w-1 h-3 bg-white rounded-full'
                      style={{
                        animation: 'music-bounce 0.6s ease-in-out infinite',
                      }}
                    ></span>
                    <span
                      className='w-1 h-4 bg-white rounded-full'
                      style={{
                        animation:
                          'music-bounce 0.6s ease-in-out 0.1s infinite',
                      }}
                    ></span>
                    <span
                      className='w-1 h-3 bg-white rounded-full'
                      style={{
                        animation:
                          'music-bounce 0.6s ease-in-out 0.2s infinite',
                      }}
                    ></span>
                  </div>
                )}
                <span className='text-[9px] font-bold text-white uppercase'>
                  Now
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Track info */}
        <div className='p-4'>
          <div className='mb-2.5'>
            <div
              className={`text-sm font-black truncate mb-1 transition-colors duration-200 flex items-center gap-1.5 ${
                isCurrentTrack
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
              }`}
            >
              {track.title}
              {isCurrentlyPlaying && (
                <svg
                  className='w-3.5 h-3.5 text-blue-500 animate-pulse'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
                </svg>
              )}
            </div>
            <div className='text-xs font-semibold text-gray-600 dark:text-gray-400 truncate'>
              {track.artist}
            </div>
          </div>
          <div className='flex items-center flex-wrap gap-2 text-[10px] text-gray-500 dark:text-gray-400'>
            <div className='flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-700/50 rounded-md'>
              <svg
                className='w-3 h-3'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <span className='font-medium'>
                {formatDuration(track.duration)}
              </span>
            </div>
            {track.genre && (
              <>
                <span className='text-gray-300 dark:text-gray-600'>•</span>
                <span className='px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 rounded-md text-[9px] font-bold uppercase border border-blue-200/50 dark:border-blue-700/50'>
                  {track.genre}
                </span>
              </>
            )}
          </div>
        </div>
      </button>
    );
  };

  // Top ten track card - compact list style
  const TopTenTrackCard = ({
    track,
    index: _index,
  }: {
    track: Track;
    index: number;
  }) => (
    <button
      type='button'
      className='flex items-center gap-3 rounded-xl bg-white/60 dark:bg-slate-900/40 p-3 border border-gray-100/60 dark:border-slate-800/60 hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group text-left w-full'
      onClick={() => handlePlay(track)}
      aria-label={`Play ${track.title}`}
    >
      <div className='flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700'>
        {track.coverImageUrl || track.albumArtwork ? (
          <TrackArtwork
            artworkUrl={track.coverImageUrl || track.albumArtwork}
            title={track.title}
            size='md'
            className='w-full h-full'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center'>
            <svg
              className='w-6 h-6 text-gray-400'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' />
            </svg>
          </div>
        )}
      </div>
      <div className='flex-1 min-w-0'>
        <div className='text-sm font-semibold text-gray-900 dark:text-white truncate'>
          {track.title}
        </div>
        <div className='text-xs text-gray-600 dark:text-gray-400 truncate'>
          {track.artist}
        </div>
      </div>
      <div className='flex items-center gap-3 flex-shrink-0'>
        <div className='text-xs text-gray-500 hidden sm:block'>
          {formatDuration(track.duration)}
        </div>
        <button
          className='opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700'
          onClick={e => {
            e.stopPropagation();
            handlePlay(track);
          }}
        >
          <svg
            className='w-5 h-5 text-gray-700 dark:text-gray-300'
            fill='currentColor'
            viewBox='0 0 24 24'
          >
            <path d='M8 5v14l11-7z' />
          </svg>
        </button>
      </div>
    </button>
  );

  const PlaceholderCard = ({
    isFeatured = false,
  }: {
    isFeatured?: boolean;
  }) => (
    <div
      className={`${isFeatured ? 'rounded-xl' : 'rounded-xl'} bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 ${isFeatured ? 'aspect-square' : 'h-20'} animate-pulse overflow-hidden`}
    >
      <div
        className={`${isFeatured ? 'w-full aspect-square bg-gray-200 dark:bg-slate-700' : 'w-14 h-14 m-3 rounded-lg bg-gray-200 dark:bg-slate-700'}`}
      />
      {isFeatured && (
        <div className='p-4 space-y-2'>
          <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4'></div>
          <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2'></div>
        </div>
      )}
    </div>
  );

  return (
    <div className='space-y-8'>
      {/* Context badges */}
      {(province || genre) && (
        <div className='flex items-center gap-2 flex-wrap justify-center'>
          {province && (
            <Chip size='sm' variant='flat' color='primary'>
              {province}
            </Chip>
          )}
          {genre && (
            <Chip size='sm' variant='flat' color='success'>
              {genre}
            </Chip>
          )}
        </div>
      )}

      {/* Featured - horizontal grid layout */}
      <section className='mb-6'>
        <div className='bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-green-50/50 dark:from-blue-950/40 dark:via-purple-950/30 dark:to-green-950/40 border border-gray-200/80 dark:border-slate-700/80 rounded-2xl p-5 md:p-6 shadow-sm'>
          {/* Section heading */}
          <div className='flex items-center justify-between mb-5'>
            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-300/30 dark:border-blue-700/30 rounded-full shadow-sm'>
                <svg
                  className='w-4 h-4 text-blue-600 dark:text-blue-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 10V3L4 14h7v7l9-11h-7z'
                  />
                </svg>
                <span className='text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider'>
                  Featured
                </span>
              </div>
            </div>
          </div>

          {/* Featured tracks grid - max 3 in one row */}
          {loading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-4 bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-3 animate-pulse overflow-hidden'
                >
                  <div className='flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4'></div>
                    <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2'></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {featured.map((track, idx) => (
                <FeaturedTrackCard key={track.id} track={track} index={idx} />
              ))}
            </div>
          ) : (
            <div className='text-center py-10'>
              <svg
                className='w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                />
              </svg>
              <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                No featured tracks available
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Top Ten - list style */}
      <section>
        <div className='mb-4'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1'>
            Top 10 Tracks
          </h3>
          {(province || genre) && (
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {province && `in ${province}`} {genre && `• ${genre}`}
            </p>
          )}
        </div>
        {loading ? (
          <div className='space-y-2'>
            {Array.from({ length: 10 }).map((_, i) => (
              <PlaceholderCard key={i} />
            ))}
          </div>
        ) : topTen.length > 0 ? (
          <div className='space-y-2'>
            {topTen.map(track => (
              <TopTenTrackCard key={track.id} track={track} index={0} />
            ))}
          </div>
        ) : (
          <div className='text-sm text-gray-500 dark:text-gray-400 text-center py-8'>
            No top tracks available
          </div>
        )}
      </section>
    </div>
  );
}
