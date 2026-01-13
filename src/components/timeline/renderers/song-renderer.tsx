'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  PlayIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { TimelinePostRendererProps } from './index';
import { logger } from '@/lib/utils/logger';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import {
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
} from '@heroui/react';

/**
 * Renderer for SONG posts
 * Enhanced with detailed song information, lyrics, tags, and external links
 */
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
  const { playTrack } = useMusicPlayer();

  const content = (post.content as any) || {};
  const trackId = content.trackId;
  const songUrl = post.songUrl || content.songUrl;
  const tags = post.tags || [];

  // Fetch track data if trackId is available
  useEffect(() => {
    if (trackId && !trackData) {
      fetch(`/api/tracks/${trackId}`)
        .then(res => res.json())
        .then(data => {
          if (data.track) {
            setTrackData(data.track);
          }
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
    if (trackId && onPlayTrack) {
      // Use the onPlayTrack handler if available
      onPlayTrack(trackId);
    } else if (trackData && playTrack) {
      // Convert track data to Track format and play
      const track = {
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
      };
      playTrack(track, 'timeline');
    } else if (songUrl) {
      // Fallback to external link
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

  const hasExternalLinks = Object.values(externalLinks).some(Boolean);

  return (
    <>
      <div className='bg-white dark:bg-slate-800 rounded-xl p-5 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-slate-700'>
        {/* Header */}
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 overflow-hidden'>
            {post.author.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name || post.author.email}
                width={40}
                height={40}
                className='rounded-full'
              />
            ) : (
              <span className='text-white text-sm font-semibold'>
                {(post.author.name || post.author.email)[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
              {post.author.name || post.author.email}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : new Date(post.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
            </p>
          </div>
          <span className='px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5'>
            <MusicalNoteIcon className='w-3.5 h-3.5' />
            SONG
          </span>
        </div>

        {/* Song Content - Enhanced Layout */}
        <div className='flex gap-4 mb-4'>
          {/* Larger Artwork */}
          {post.coverImageUrl && (
            <div className='relative w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden bg-gray-200 dark:bg-slate-700 flex-shrink-0 group'>
              <Image
                src={post.coverImageUrl}
                alt={post.title || 'Song cover'}
                fill
                className='object-cover'
              />
              {/* Play Button Overlay */}
              <button
                onClick={handlePlay}
                className='absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-all group-hover:opacity-100 opacity-0'
                aria-label='Play song'
              >
                <div className='w-14 h-14 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center hover:scale-110 transition-transform'>
                  <PlayIcon className='w-7 h-7 text-emerald-600 dark:text-emerald-400 ml-1' />
                </div>
              </button>
            </div>
          )}

          {/* Song Details */}
          <div className='flex-1 min-w-0'>
            {post.title && (
              <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-1'>
                {post.title}
              </h3>
            )}
            {(content.trackArtist || content.artist) && (
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                {content.trackArtist || content.artist}
              </p>
            )}

            {/* Song Metadata */}
            <div className='flex flex-wrap gap-2 mb-3'>
              {content.trackGenre && (
                <Chip size='sm' variant='flat' color='primary'>
                  {content.trackGenre}
                </Chip>
              )}
              {trackData?.year && (
                <Chip size='sm' variant='flat'>
                  {trackData.year}
                </Chip>
              )}
              {trackData?.duration && (
                <Chip size='sm' variant='flat'>
                  {Math.floor(trackData.duration / 60)}:
                  {String(trackData.duration % 60).padStart(2, '0')}
                </Chip>
              )}
            </div>

            {/* Description */}
            {post.description && (
              <p className='text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2'>
                {post.description}
              </p>
            )}

            {/* Action Buttons Row */}
            <div className='flex flex-wrap gap-2'>
              {/* Play Button */}
              <Button
                size='sm'
                color='primary'
                startContent={<PlayIcon className='w-4 h-4' />}
                onClick={handlePlay}
                className='bg-emerald-600 hover:bg-emerald-700 text-white'
              >
                Play
              </Button>

              {/* Lyrics Button */}
              {lyrics && (
                <Button
                  size='sm'
                  variant='bordered'
                  startContent={<DocumentTextIcon className='w-4 h-4' />}
                  onClick={() => setShowLyrics(true)}
                >
                  Lyrics
                </Button>
              )}

              {/* External Links */}
              {hasExternalLinks && (
                <div className='flex gap-1'>
                  {externalLinks.youtube && (
                    <a
                      href={externalLinks.youtube}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors'
                    >
                      YouTube
                    </a>
                  )}
                  {externalLinks.spotify && (
                    <a
                      href={externalLinks.spotify}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors'
                    >
                      Spotify
                    </a>
                  )}
                  {externalLinks.appleMusic && (
                    <a
                      href={externalLinks.appleMusic}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='px-3 py-1.5 text-xs font-medium rounded-lg bg-pink-600 hover:bg-pink-700 text-white transition-colors'
                    >
                      Apple Music
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className='flex flex-wrap gap-2 mb-4'>
            {tags.map((tagObj, index) => (
              <Chip key={index} size='sm' variant='flat' color='secondary'>
                {tagObj.tag}
              </Chip>
            ))}
          </div>
        )}

        {/* Engagement */}
        <div className='flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-slate-700'>
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 transition-colors ${
              isLiked
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            {isLiked ? (
              <HeartSolidIcon className='w-5 h-5' />
            ) : (
              <HeartIcon className='w-5 h-5' />
            )}
            <span className='text-sm font-medium'>{likeCount}</span>
          </button>
          <button
            onClick={() => onComment?.(post.id, '')}
            className='flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
          >
            <ChatBubbleLeftIcon className='w-5 h-5' />
            <span className='text-sm font-medium'>
              {post.commentCount || post._count?.comments || 0}
            </span>
          </button>
          <button
            onClick={() => onShare?.(post.id)}
            className='flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
          >
            <ShareIcon className='w-5 h-5' />
            <span className='text-sm font-medium'>
              {post.shareCount || post._count?.shares || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Lyrics Modal */}
      <Modal
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
        size='2xl'
        scrollBehavior='inside'
      >
        <ModalContent>
          <ModalHeader className='flex flex-col gap-1'>
            <h2 className='text-xl font-bold'>{post.title}</h2>
            {content.trackArtist && (
              <p className='text-sm text-gray-500'>{content.trackArtist}</p>
            )}
          </ModalHeader>
          <ModalBody>
            <div className='whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
              {lyrics || 'No lyrics available'}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
