'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PlayIcon,
  PauseIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { TimelinePostRendererProps } from './index';
import { logger } from '@/lib/utils/logger';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
}

export function SongRenderer({
  post,
  onLike,
  onComment,
  onShare,
  onPlayTrack,
}: TimelinePostRendererProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(
    post.likeCount || post._count?.likes || 0
  );
  const [isLiked, setIsLiked] = useState(post.userLiked || false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [trackData, setTrackData] = useState<any>(null);
  const { currentTrack, isPlaying, playTrack, playPause } = useMusicPlayer();

  const content = (post.content as any) || {};
  const trackId = content.trackId;
  const songUrl = post.songUrl || content.songUrl;
  const tags = post.tags || [];
  const postDate = new Date(post.publishedAt || post.createdAt);

  const isCurrentTrack = currentTrack?.id === trackId;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  useEffect(() => {
    if (trackId && !trackData) {
      fetch(`/api/tracks/${trackId}`)
        .then(res => res.json())
        .then(data => {
          if (data.track) setTrackData(data.track);
        })
        .catch(err => {
          logger.error('Error fetching track data:', err);
        });
    }
  }, [trackId, trackData]);

  const handleLike = async () => {
    if (isLiking || !onLike) return;
    setIsLiking(true);
    try {
      await onLike(post.id);
      setIsLiked(!isLiked);
      setLikeCount(prev => (isLiked ? prev - 1 : prev + 1));
    } catch (error) {
      logger.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handlePlay = () => {
    if (isCurrentTrack) {
      playPause();
    } else if (trackId && onPlayTrack) {
      onPlayTrack(trackId);
    } else if (trackData && playTrack) {
      playTrack(
        {
          id: trackData.id,
          title: trackData.title,
          filePath: trackData.filePath,
          fileUrl: trackData.fileUrl,
          coverImageUrl: trackData.coverImageUrl || trackData.albumArtwork,
          artist: trackData.artist || trackData.primaryArtists?.[0]?.artistName,
          duration: trackData.duration,
          playCount: trackData.playCount || 0,
          likeCount: trackData.likeCount || 0,
          artistId: trackData.artistId || trackData.primaryArtistIds?.[0],
          userId: trackData.userId,
          createdAt: trackData.createdAt,
          updatedAt: trackData.updatedAt,
        },
        'timeline'
      );
    } else if (songUrl) {
      window.open(songUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const lyrics = trackData?.lyrics || content.lyrics;
  const externalLinks = {
    youtube: content.youtubeUrl || trackData?.youtubeUrl,
    spotify: content.spotifyUrl || trackData?.spotifyUrl,
    appleMusic:
      content.appleMusicUrl || content.itunesUrl || trackData?.appleMusicUrl,
  };

  return (
    <>
      <div className='relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden'>
        {/* Animated now-playing top bar */}
        {isCurrentlyPlaying && (
          <div className='absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 animate-pulse z-10' />
        )}

        <div className='px-4 pt-4 pb-3'>
          {/* Author row */}
          <div className='flex items-center gap-2.5 mb-4'>
            <div className='w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center overflow-hidden ring-2 ring-emerald-100 dark:ring-emerald-900/40 flex-shrink-0'>
              {post.author.image ? (
                <Image
                  src={post.author.image}
                  alt={post.author.name || post.author.email}
                  width={36}
                  height={36}
                  className='rounded-full object-cover'
                />
              ) : (
                <span className='text-white text-xs font-bold'>
                  {(post.author.name || post.author.email)[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight'>
                {post.author.name || post.author.email}
              </p>
              <p className='text-[10px] text-gray-400 dark:text-gray-500 leading-tight'>
                {timeAgo(postDate)}
              </p>
            </div>
            <span className='inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 uppercase tracking-wide'>
              <MusicalNoteIcon className='w-2.5 h-2.5' />
              Song
            </span>
          </div>

          {/* Main content */}
          <div className='flex gap-4 mb-4'>
            {/* Cover art with play overlay */}
            {post.coverImageUrl && (
              <div className='relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-200 dark:bg-slate-700 flex-shrink-0 group shadow-md'>
                <Image
                  src={post.coverImageUrl}
                  alt={post.title || 'Song cover'}
                  fill
                  className='object-cover'
                />
                <button
                  onClick={handlePlay}
                  className='absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-all'
                  aria-label={isCurrentlyPlaying ? 'Pause' : 'Play song'}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 ${
                      isCurrentlyPlaying
                        ? 'bg-emerald-500'
                        : 'bg-white/95 dark:bg-slate-900/90'
                    }`}
                  >
                    {isCurrentlyPlaying ? (
                      <PauseIcon className='w-5 h-5 text-white' />
                    ) : (
                      <PlayIcon className='w-5 h-5 text-emerald-600 dark:text-emerald-400 ml-0.5' />
                    )}
                  </div>
                </button>
                {isCurrentlyPlaying && (
                  <div className='absolute bottom-2 left-0 right-0 flex items-end justify-center gap-0.5 h-4'>
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <span
                        key={i}
                        className='w-1 bg-emerald-400 rounded-full animate-[music-bounce_0.6s_ease-in-out_infinite]'
                        style={{
                          animationDelay: `${delay}s`,
                          minHeight: '4px',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Song info */}
            <div className='flex-1 min-w-0 flex flex-col justify-center'>
              {post.title && (
                <h3 className='text-base font-bold text-gray-900 dark:text-white mb-0.5 leading-snug line-clamp-2'>
                  {post.title}
                </h3>
              )}
              {(content.trackArtist || content.artist) && (
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium'>
                  {content.trackArtist || content.artist}
                </p>
              )}

              <div className='flex flex-wrap gap-1.5 mb-2'>
                {content.trackGenre && (
                  <span className='px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'>
                    {content.trackGenre}
                  </span>
                )}
                {trackData?.year && (
                  <span className='px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'>
                    {trackData.year}
                  </span>
                )}
                {trackData?.duration && (
                  <span className='px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'>
                    {Math.floor(trackData.duration / 60)}:
                    {String(trackData.duration % 60).padStart(2, '0')}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className='flex flex-wrap gap-1.5'>
                <button
                  onClick={handlePlay}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    isCurrentlyPlaying
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isCurrentlyPlaying ? (
                    <PauseIcon className='w-3.5 h-3.5' />
                  ) : (
                    <PlayIcon className='w-3.5 h-3.5' />
                  )}
                  {isCurrentlyPlaying ? 'Pause' : 'Play'}
                </button>
                {lyrics && (
                  <button
                    onClick={() => setShowLyrics(true)}
                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all'
                  >
                    <DocumentTextIcon className='w-3.5 h-3.5' />
                    Lyrics
                  </button>
                )}
                {externalLinks.youtube && (
                  <a
                    href={externalLinks.youtube}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-500 hover:bg-red-600 text-white transition-colors'
                  >
                    <svg
                      className='w-3 h-3'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z' />
                    </svg>
                    YT
                  </a>
                )}
                {externalLinks.spotify && (
                  <a
                    href={externalLinks.spotify}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-green-500 hover:bg-green-600 text-white transition-colors'
                  >
                    <svg
                      className='w-3 h-3'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' />
                    </svg>
                    Spotify
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className='flex flex-wrap gap-1.5 mb-3'>
              {tags.map((tagObj: any, i: number) => (
                <span
                  key={i}
                  className='px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                >
                  #{tagObj.tag}
                </span>
              ))}
            </div>
          )}

          {/* Engagement bar */}
          <div className='flex items-center gap-1 pt-2.5 border-t border-gray-50 dark:border-slate-800'>
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isLiked
                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              {isLiked ? (
                <HeartSolidIcon className='w-3.5 h-3.5' />
              ) : (
                <HeartIcon className='w-3.5 h-3.5' />
              )}
              {likeCount}
            </button>
            <button
              onClick={() => onComment?.(post.id, '')}
              className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all'
            >
              <ChatBubbleLeftIcon className='w-3.5 h-3.5' />
              {post.commentCount || post._count?.comments || 0}
            </button>
            <button
              onClick={() => onShare?.(post.id)}
              className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all'
            >
              <ShareIcon className='w-3.5 h-3.5' />
              {post.shareCount || post._count?.shares || 0}
            </button>
          </div>
        </div>
      </div>

      {/* Lyrics overlay */}
      {showLyrics && (
        <div
          role='button'
          tabIndex={0}
          className='fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm'
          onClick={() => setShowLyrics(false)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') setShowLyrics(false);
          }}
        >
          <div
            role='button'
            tabIndex={0}
            className='bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-hidden'
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            <div className='flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800'>
              <div>
                <h3 className='text-base font-bold text-gray-900 dark:text-white'>
                  {post.title}
                </h3>
                {(content.trackArtist || content.artist) && (
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    {content.trackArtist || content.artist}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowLyrics(false)}
                className='p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors'
              >
                <XMarkIcon className='w-5 h-5' />
              </button>
            </div>
            <div className='p-5 overflow-y-auto max-h-[50vh]'>
              <p className='whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-loose'>
                {lyrics || 'No lyrics available'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
