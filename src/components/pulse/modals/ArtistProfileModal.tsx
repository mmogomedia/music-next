'use client';

import Image from 'next/image';
import FlemojiModal, {
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@/components/shared/FlemojiModal';
import { Button } from '@heroui/react';
import { PlayCircleIcon, PauseCircleIcon } from '@heroicons/react/24/outline';
import { constructFileUrl } from '@/lib/url-utils';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import type { Track } from '@/types/track';
import type { LeagueEntry } from '../types';
import {
  getArtistImageUrl,
  getSocialIcon,
  formatNumber,
  formatDuration,
} from '../utils';

interface ArtistProfileModalProps {
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
  entry: LeagueEntry | null;
  artistProfile: any | null;
  artistLoading: boolean;
}

export default function ArtistProfileModal({
  isOpen,
  onOpenChange,
  entry: selectedArtistEntry,
  artistProfile,
  artistLoading,
}: ArtistProfileModalProps) {
  const { playTrack, currentTrack, isPlaying, playPause } = useMusicPlayer();

  return (
    <FlemojiModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement='center'
      size='lg'
      scrollBehavior='inside'
      classNames={{
        base: 'bg-white dark:bg-slate-900 rounded-lg',
        header: 'border-b border-gray-200/60 dark:border-slate-800/60',
        body: 'py-5',
      }}
    >
      <ModalContent>
        <ModalHeader className='p-0 overflow-hidden rounded-t-lg'>
          <div className='w-full px-6 py-5 bg-gradient-to-r from-blue-50/70 via-purple-50/40 to-indigo-50/70 dark:from-blue-950/40 dark:via-purple-950/25 dark:to-indigo-950/40 border-b border-gray-200/60 dark:border-slate-800/60'>
            {selectedArtistEntry && (
              <div className='flex items-center gap-3'>
                {getArtistImageUrl(selectedArtistEntry.artist_image) ? (
                  <div className='w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-white/50 dark:ring-slate-800/50'>
                    <Image
                      src={getArtistImageUrl(selectedArtistEntry.artist_image)!}
                      alt={selectedArtistEntry.artist_name}
                      width={64}
                      height={64}
                      className='object-cover'
                    />
                  </div>
                ) : (
                  <div className='w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 ring-2 ring-white/50 dark:ring-slate-800/50'>
                    <span className='text-2xl font-semibold text-gray-500 dark:text-gray-300'>
                      {selectedArtistEntry.artist_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className='flex-1 min-w-0'>
                  <h2 className='text-xl md:text-2xl font-black leading-tight'>
                    <span className='bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent'>
                      {selectedArtistEntry.artist_name}
                    </span>
                  </h2>
                </div>
              </div>
            )}
          </div>
        </ModalHeader>
        <ModalBody className='px-6'>
          {artistLoading ? (
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-20 animate-pulse' />
                <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-full animate-pulse' />
                <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-5/6 animate-pulse' />
              </div>
              <div className='space-y-2'>
                <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse' />
                <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3 animate-pulse' />
              </div>
              <div className='space-y-2'>
                <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-12 animate-pulse' />
                <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/4 animate-pulse' />
              </div>
              <div className='space-y-2'>
                <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 animate-pulse' />
                <div className='flex flex-wrap gap-2'>
                  <div className='h-8 bg-gray-200 dark:bg-slate-700 rounded-lg w-24 animate-pulse' />
                  <div className='h-8 bg-gray-200 dark:bg-slate-700 rounded-lg w-20 animate-pulse' />
                </div>
              </div>
              <div className='space-y-2'>
                <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-20 animate-pulse' />
                <div className='space-y-2 border border-gray-200/70 dark:border-slate-700/70 rounded-lg p-2'>
                  {[1, 2, 3].map(i => (
                    <div key={i} className='flex items-center gap-3 p-2'>
                      <div className='w-5 h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse' />
                      <div className='flex-1 space-y-1'>
                        <div className='h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3 animate-pulse' />
                        <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3 animate-pulse' />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/60 dark:border-slate-700/60'>
                <div>
                  <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-16 mb-2 animate-pulse' />
                  <div className='h-6 bg-gray-200 dark:bg-slate-700 rounded w-12 animate-pulse' />
                </div>
                <div>
                  <div className='h-3 bg-gray-200 dark:bg-slate-700 rounded w-16 mb-2 animate-pulse' />
                  <div className='h-6 bg-gray-200 dark:bg-slate-700 rounded w-12 animate-pulse' />
                </div>
              </div>
            </div>
          ) : artistProfile ? (
            <div className='space-y-4'>
              <div>
                <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                  About
                </h3>
                {artistProfile.bio ? (
                  <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed'>
                    {artistProfile.bio}
                  </p>
                ) : (
                  <p className='text-sm text-gray-400 dark:text-gray-500 italic'>
                    No bio available
                  </p>
                )}
              </div>

              <div>
                <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                  Location
                </h3>
                {artistProfile.location ||
                artistProfile.city ||
                artistProfile.province ||
                artistProfile.country ? (
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {[
                      artistProfile.city,
                      artistProfile.province,
                      artistProfile.country,
                    ]
                      .filter(Boolean)
                      .join(', ') || artistProfile.location}
                  </p>
                ) : (
                  <p className='text-sm text-gray-400 dark:text-gray-500 italic'>
                    No location available
                  </p>
                )}
              </div>

              <div>
                <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                  Genre
                </h3>
                {artistProfile.genreRef ? (
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {artistProfile.genreRef.name}
                  </p>
                ) : (
                  <p className='text-sm text-gray-400 dark:text-gray-500 italic'>
                    No genre specified
                  </p>
                )}
              </div>

              <div>
                <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                  Social Media
                </h3>
                {artistProfile.socialLinks &&
                Object.keys(artistProfile.socialLinks).length > 0 ? (
                  <div className='flex flex-wrap gap-2'>
                    {Object.entries(artistProfile.socialLinks).map(
                      ([platform, data]: [string, any]) =>
                        data?.url && (
                          <a
                            key={platform}
                            href={data.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                          >
                            <span>{getSocialIcon(platform)}</span>
                            <span className='text-sm font-medium capitalize'>
                              {platform}
                            </span>
                            {data.followers && (
                              <span className='text-xs text-gray-500 dark:text-gray-400'>
                                {formatNumber(data.followers)}
                              </span>
                            )}
                          </a>
                        )
                    )}
                  </div>
                ) : (
                  <p className='text-sm text-gray-400 dark:text-gray-500 italic'>
                    No social links available
                  </p>
                )}
              </div>

              <div>
                <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>
                  Top Tracks
                </h3>
                {artistProfile.tracks && artistProfile.tracks.length > 0 ? (
                  <div className='space-y-2 border border-gray-200/70 dark:border-slate-700/70 rounded-lg overflow-hidden bg-white dark:bg-slate-900'>
                    {artistProfile.tracks
                      .slice(0, 3)
                      .map((track: any, index: number) => (
                        <div
                          key={track.id}
                          className='flex items-center gap-3 px-3 py-2.5 border-b border-gray-100/70 dark:border-slate-800/60 last:border-b-0 hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors'
                        >
                          <div className='text-xs font-semibold text-gray-400 dark:text-gray-500 w-5 text-right flex-shrink-0'>
                            {index + 1}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                              {track.title}
                            </p>
                            <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                              {track.genre && (
                                <>
                                  <span className='capitalize'>
                                    {track.genre}
                                  </span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{formatDuration(track.duration)}</span>
                            </div>
                          </div>
                          {track.filePath &&
                            (() => {
                              const isCurrentTrack =
                                currentTrack?.id === track.id;
                              const isTrackPlaying =
                                isCurrentTrack && isPlaying;

                              return (
                                <Button
                                  isIconOnly
                                  size='sm'
                                  variant='light'
                                  className='flex-shrink-0'
                                  onPress={() => {
                                    if (isCurrentTrack && isPlaying) {
                                      // Pause if this track is currently playing
                                      playPause();
                                    } else {
                                      // Play this track
                                      const playerTrack: Track = {
                                        id: track.id,
                                        title: track.title,
                                        filePath: track.filePath,
                                        fileUrl: track.filePath
                                          ? constructFileUrl(track.filePath)
                                          : undefined,
                                        coverImageUrl: track.albumArtwork
                                          ? constructFileUrl(track.albumArtwork)
                                          : undefined,
                                        albumArtwork: track.albumArtwork
                                          ? constructFileUrl(track.albumArtwork)
                                          : undefined,
                                        genre: track.genre ?? undefined,
                                        album: track.album ?? undefined,
                                        description:
                                          track.description ?? undefined,
                                        duration: track.duration ?? undefined,
                                        playCount: track.playCount ?? 0,
                                        likeCount: track.likeCount ?? 0,
                                        artistId:
                                          track.artistProfileId ?? track.id,
                                        artistProfileId:
                                          track.artistProfileId ?? undefined,
                                        userId: track.userId ?? '',
                                        createdAt:
                                          track.createdAt instanceof Date
                                            ? track.createdAt.toISOString()
                                            : (track.createdAt ??
                                              new Date().toISOString()),
                                        updatedAt:
                                          track.updatedAt instanceof Date
                                            ? track.updatedAt.toISOString()
                                            : (track.updatedAt ??
                                              new Date().toISOString()),
                                        artist: track.artist ?? undefined,
                                        isPublic: track.isPublic ?? true,
                                        isDownloadable:
                                          track.isDownloadable ?? false,
                                        isExplicit: track.isExplicit ?? false,
                                      };
                                      playTrack(playerTrack, 'league');
                                    }
                                  }}
                                  aria-label={
                                    isTrackPlaying
                                      ? `Pause ${track.title}`
                                      : `Play ${track.title}`
                                  }
                                >
                                  {isTrackPlaying ? (
                                    <PauseCircleIcon className='w-5 h-5 text-gray-600 dark:text-gray-400' />
                                  ) : (
                                    <PlayCircleIcon className='w-5 h-5 text-gray-600 dark:text-gray-400' />
                                  )}
                                </Button>
                              );
                            })()}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className='text-sm text-gray-400 dark:text-gray-500 italic'>
                    No tracks available
                  </p>
                )}
              </div>

              <div className='grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/60 dark:border-slate-700/60'>
                <div>
                  <div className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                    Total Plays
                  </div>
                  <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                    {artistProfile.totalPlays?.toLocaleString() ?? '0'}
                  </div>
                </div>
                <div>
                  <div className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                    Total Likes
                  </div>
                  <div className='text-lg font-semibold text-gray-900 dark:text-white'>
                    {artistProfile.totalLikes?.toLocaleString() ?? '0'}
                  </div>
                </div>
              </div>
            </div>
          ) : selectedArtistEntry ? (
            <div className='flex items-center justify-center py-12'>
              <p className='text-gray-500 dark:text-gray-400 text-sm'>
                {selectedArtistEntry.artist_slug
                  ? 'Failed to load artist profile'
                  : 'Artist profile not available'}
              </p>
            </div>
          ) : null}
        </ModalBody>
      </ModalContent>
    </FlemojiModal>
  );
}
