'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import type { PlaylistResponse } from '@/types/ai-responses';
import {
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
} from '@heroui/react';
import TrackCard from '@/components/ai/TrackCard';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useToast } from '@/components/ui/Toast';
import ArtistDisplay from '@/components/track/ArtistDisplay';
import { useSession } from 'next-auth/react';
import {
  PlayIcon,
  BookmarkIcon,
  ShareIcon,
  MusicalNoteIcon,
  ClockIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MinusCircleIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import type { Track } from '@/types/track';

interface GenreOption {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  colorHex?: string | null;
}

interface PlaylistRendererProps {
  response: PlaylistResponse;
  onPlayPlaylist?: (_playlistId: string) => void;
  onAction?: (_action: any) => void;
}

/**
 * Renders a single playlist with its tracks
 */
export function PlaylistRenderer({
  response,
  onPlayPlaylist,
  onAction: _onAction,
}: PlaylistRendererProps) {
  const { data: playlist } = response;
  const { playTrack, setQueue } = useMusicPlayer();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState(playlist.name);
  const [playlistDescription, setPlaylistDescription] = useState(
    playlist.description || ''
  );
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  const [trackSearchTerm, setTrackSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [isLoadingGenres, setIsLoadingGenres] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const totalDuration = useMemo(() => {
    const totalSeconds = selectedTracks.reduce(
      (sum, track) => sum + (track.duration || 0),
      0
    );
    return Math.floor(totalSeconds / 60);
  }, [selectedTracks]);

  const selectedGenreOption = useMemo(() => {
    if (!selectedGenre) return null;
    return (
      genres.find(
        genre =>
          genre.slug === selectedGenre ||
          genre.id === selectedGenre ||
          genre.name.toLowerCase() === selectedGenre.toLowerCase()
      ) || null
    );
  }, [selectedGenre, genres]);

  const normalizeTrack = (track: any): Track => ({
    id: track.id,
    title: track.title ?? 'Untitled',
    filePath: track.filePath ?? '',
    fileUrl: track.fileUrl ?? '',
    coverImageUrl: track.coverImageUrl ?? track.albumArtwork ?? undefined,
    albumArtwork: track.albumArtwork ?? undefined,
    genre: track.genre ?? undefined,
    album: track.album ?? undefined,
    description: track.description ?? undefined,
    duration:
      typeof track.duration === 'number' && Number.isFinite(track.duration)
        ? track.duration
        : undefined,
    playCount: track.playCount ?? 0,
    likeCount: track.likeCount ?? 0,
    artistId: track.artistId ?? track.artistProfileId ?? '',
    artistProfileId: track.artistProfileId ?? undefined,
    userId: track.userId ?? '',
    createdAt: track.createdAt ?? new Date().toISOString(),
    updatedAt: track.updatedAt ?? new Date().toISOString(),
    artist: track.artist ?? track.artistProfile?.artistName ?? 'Unknown Artist',
    composer: track.composer ?? undefined,
    year: track.year ?? undefined,
    releaseDate: track.releaseDate ?? undefined,
    bpm: track.bpm ?? undefined,
    isrc: track.isrc ?? undefined,
    lyrics: track.lyrics ?? undefined,
    isPublic: track.isPublic ?? true,
    isDownloadable: track.isDownloadable ?? false,
    isExplicit: track.isExplicit ?? false,
    watermarkId: track.watermarkId ?? undefined,
    copyrightInfo: track.copyrightInfo ?? undefined,
    licenseType: track.licenseType ?? undefined,
    distributionRights: track.distributionRights ?? undefined,
    downloadCount: track.downloadCount ?? undefined,
    shareCount: track.shareCount ?? undefined,
  });

  useEffect(() => {
    setSelectedTracks(
      (playlist.tracks || []).map((item: any) => normalizeTrack(item.track))
    );
    setPlaylistName(playlist.name);
    setPlaylistDescription(playlist.description || '');
    setIsSaved(false);
    setSelectedGenre(null);
  }, [playlist]);

  useEffect(() => {
    let isMounted = true;
    const fetchGenres = async () => {
      try {
        setIsLoadingGenres(true);
        const response = await fetch('/api/genres');
        if (!response.ok) {
          throw new Error('Failed to fetch genres');
        }
        const data = await response.json();
        if (isMounted && Array.isArray(data.genres)) {
          setGenres(data.genres);
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      } finally {
        if (isMounted) {
          setIsLoadingGenres(false);
        }
      }
    };

    fetchGenres();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isSaveModalOpen) {
      setTrackSearchTerm('');
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
    }
  }, [isSaveModalOpen]);

  useEffect(() => {
    if (!isSaveModalOpen) {
      return;
    }

    const query = trackSearchTerm.trim();
    if (!query) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    setSearchError(null);

    const handler = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: query,
          limit: '15',
        });
        if (selectedGenre) {
          params.append('genre', selectedGenre);
        }

        const response = await fetch(
          `/api/tracks/search?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to search tracks');
        }

        const data = await response.json();
        if (Array.isArray(data.tracks)) {
          setSearchResults(
            data.tracks.map((track: any) => normalizeTrack(track))
          );
        } else {
          setSearchResults([]);
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        console.error('Track search error:', error);
        setSearchError(
          error instanceof Error ? error.message : 'Failed to search tracks'
        );
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(handler);
    };
  }, [trackSearchTerm, selectedGenre, isSaveModalOpen]);

  // Check if this is a compiled AI playlist (virtual playlist)
  const isCompiledPlaylist = playlist.id.startsWith('compiled-');

  const handlePlay = () => {
    if (isCompiledPlaylist) {
      if (selectedTracks.length === 0) {
        showToast('Add at least one track to play', 'info');
        return;
      }
      setQueue(selectedTracks, 0, 'playlist');
      playTrack(selectedTracks[0], 'playlist');
    } else if (onPlayPlaylist) {
      onPlayPlaylist(playlist.id);
    }
  };

  const handlePlayTrack = (track: Track) => {
    if (!track) return;
    if (isCompiledPlaylist) {
      const startIndex = selectedTracks.findIndex(t => t.id === track.id);
      if (startIndex >= 0) {
        setQueue(selectedTracks, startIndex, 'playlist');
      }
    }
    playTrack(track, 'playlist');
  };

  const handleRemoveTrack = (trackId: string) => {
    setSelectedTracks(prev => {
      const updated = prev.filter(track => track.id !== trackId);
      if (updated.length !== prev.length) {
        setIsSaved(false);
      }
      return updated;
    });
  };

  const handleAddTrack = (track: Track) => {
    setSelectedTracks(prev => {
      if (prev.some(item => item.id === track.id)) {
        showToast('Track already added to playlist', 'info');
        return prev;
      }
      if (playlist.maxTracks && prev.length >= playlist.maxTracks) {
        showToast(
          `Playlist is limited to ${playlist.maxTracks} tracks`,
          'info'
        );
        return prev;
      }
      setIsSaved(false);
      return [...prev, track];
    });
  };

  const handlePlaylistNameChange = (value: string) => {
    setPlaylistName(value);
    setIsSaved(false);
  };

  const handlePlaylistDescriptionChange = (value: string) => {
    setPlaylistDescription(value);
    setIsSaved(false);
  };

  const handleGenreSelectionChange = (keys: any) => {
    const value = Array.from(keys)[0] as string | undefined;
    const normalizedValue = value && value !== 'none' ? value : null;
    setSelectedGenre(normalizedValue);
    setIsSaved(false);
  };

  const handleOpenSaveModal = () => {
    if (!session?.user?.id) {
      showToast('Please sign in to save playlists', 'info');
      return;
    }
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!playlistName.trim()) {
      showToast('Playlist name is required', 'error');
      return;
    }

    if (selectedTracks.length === 0) {
      showToast('Add at least one track before saving', 'error');
      return;
    }

    if (isSaving || isSaved) return;

    setIsSaving(true);
    try {
      const tracks = selectedTracks.map((track, index) => ({
        trackId: track.id,
        order: index + 1,
      }));

      const response = await fetch('/api/playlists/save-compiled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playlistName.trim(),
          description: playlistDescription.trim() || undefined,
          coverImage:
            playlist.coverImage ||
            selectedTracks[0]?.coverImageUrl ||
            selectedTracks[0]?.albumArtwork ||
            '',
          tracks,
          genre:
            selectedGenre ||
            playlistName.replace(' Playlist', '').toLowerCase(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save playlist');
      }

      await response.json();
      setIsSaved(true);
      setIsSaveModalOpen(false);
      showToast('Playlist saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving playlist:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to save playlist',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: playlistName,
          text: `Check out "${playlistName}" - ${selectedTracks.length} tracks compiled by AI`,
          url: window.location.href,
        })
        .catch(() => {
          // Share failed or cancelled
        });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard', 'success');
    }
  };

  return (
    <div className='rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 space-y-6'>
      {/* Playlist Header - Improved Hierarchy */}
      <div className='space-y-5'>
        {/* Top Section: Badge and Title */}
        <div className='space-y-3'>
          {isCompiledPlaylist && (
            <Chip
              size='sm'
              variant='flat'
              color='secondary'
              className='text-xs'
              startContent={
                <svg
                  className='w-3 h-3'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                  />
                </svg>
              }
            >
              AI Compiled
            </Chip>
          )}
          <div className='space-y-1.5'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white leading-tight'>
              {playlistName}
            </h2>
            {playlistDescription && (
              <p className='text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl'>
                {playlistDescription}
              </p>
            )}
          </div>
        </div>

        {/* Middle Section: Metadata and Actions */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-gray-100 dark:border-slate-700/50'>
          {/* Metadata */}
          <div className='flex items-center flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400'>
            <div className='flex items-center gap-2'>
              <MusicalNoteIcon className='w-4 h-4 text-gray-400 dark:text-gray-500' />
              <span className='font-medium text-gray-700 dark:text-gray-300'>
                {selectedTracks.length}{' '}
                {selectedTracks.length === 1 ? 'track' : 'tracks'}
              </span>
            </div>
            {selectedTracks.length > 0 && totalDuration > 0 && (
              <div className='flex items-center gap-2'>
                <ClockIcon className='w-4 h-4 text-gray-400 dark:text-gray-500' />
                <span className='font-medium text-gray-700 dark:text-gray-300'>
                  {totalDuration} min
                </span>
              </div>
            )}
            {selectedGenreOption && (
              <div className='flex items-center gap-2'>
                <TagIcon className='w-4 h-4 text-gray-400 dark:text-gray-500' />
                <span className='font-medium text-gray-700 dark:text-gray-300'>
                  {selectedGenreOption.name}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex items-center gap-2'>
            <Button
              color='primary'
              size='sm'
              variant='flat'
              onClick={handlePlay}
              startContent={<PlayIcon className='w-4 h-4' />}
            >
              Play
            </Button>
            {isCompiledPlaylist && session?.user && (
              <Button
                color={isSaved ? 'success' : 'default'}
                variant='flat'
                size='sm'
                onClick={handleOpenSaveModal}
                startContent={<BookmarkIcon className='w-4 h-4' />}
              >
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            )}
            <Button
              variant='light'
              size='sm'
              isIconOnly
              onClick={handleShare}
              aria-label='Share playlist'
            >
              <ShareIcon className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Tracks List */}
      {selectedTracks.length > 0 ? (
        <div className='space-y-1'>
          {selectedTracks.map((track, index) => (
            <TrackCard
              key={track.id}
              track={track}
              variant='compact'
              size='md'
              showDuration
              badge={String(index + 1)}
              onPlay={handlePlayTrack}
            />
          ))}
        </div>
      ) : (
        <div className='p-4 rounded-md border border-dashed border-gray-200 dark:border-slate-700 text-sm text-gray-500 dark:text-gray-400'>
          No tracks selected yet. Use the save modal to add tracks before
          saving.
        </div>
      )}

      {/* Save Playlist Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => {
          if (!isSaving) {
            setIsSaveModalOpen(false);
          }
        }}
        size='2xl'
        scrollBehavior='inside'
      >
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                <h3 className='text-lg font-semibold'>Save Playlist</h3>
                <p className='text-sm text-gray-600 dark:text-gray-400 font-normal'>
                  Review and edit playlist details before saving
                </p>
              </ModalHeader>
              <ModalBody>
                <div className='space-y-5'>
                  <div className='grid gap-4'>
                    <Input
                      label='Playlist Name'
                      placeholder='Enter playlist name'
                      value={playlistName}
                      onValueChange={handlePlaylistNameChange}
                      isRequired
                      variant='bordered'
                      size='lg'
                    />

                    <Textarea
                      label='Description'
                      placeholder='Add a description (optional)'
                      value={playlistDescription}
                      onValueChange={handlePlaylistDescriptionChange}
                      variant='bordered'
                      minRows={3}
                      maxRows={5}
                    />

                    <Select
                      label='Apply Genre (optional)'
                      placeholder={
                        isLoadingGenres ? 'Loading genres...' : 'Select genre'
                      }
                      selectedKeys={selectedGenre ? [selectedGenre] : ['none']}
                      onSelectionChange={handleGenreSelectionChange}
                      isLoading={isLoadingGenres}
                      variant='bordered'
                      disallowEmptySelection={false}
                    >
                      <Fragment>
                        <SelectItem key='none'>No genre</SelectItem>
                        {genres.map(genre => (
                          <SelectItem key={genre.slug} textValue={genre.name}>
                            {genre.name}
                          </SelectItem>
                        ))}
                      </Fragment>
                    </Select>
                  </div>

                  <div className='flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700'>
                    <div className='flex items-center gap-2'>
                      <MusicalNoteIcon className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                      <div>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          Tracks
                        </p>
                        <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                          {selectedTracks.length}
                          {playlist.maxTracks ? ` / ${playlist.maxTracks}` : ''}
                        </p>
                      </div>
                    </div>
                    {totalDuration > 0 && (
                      <div className='flex items-center gap-2'>
                        <ClockIcon className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                        <div>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            Duration
                          </p>
                          <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                            {totalDuration} min
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedGenreOption && (
                      <div className='flex items-center gap-2'>
                        <TagIcon className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                        <div>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            Genre
                          </p>
                          <p className='text-sm font-semibold text-gray-900 dark:text-white'>
                            {selectedGenreOption.name}
                          </p>
                        </div>
                      </div>
                    )}
                    {isCompiledPlaylist && (
                      <Chip
                        size='sm'
                        variant='flat'
                        color='secondary'
                        startContent={
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
                              d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                            />
                          </svg>
                        }
                      >
                        AI Compiled
                      </Chip>
                    )}
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <h4 className='text-sm font-semibold text-gray-900 dark:text-white'>
                        Tracks ({selectedTracks.length})
                      </h4>
                    </div>
                    <div className='max-h-64 overflow-y-auto space-y-1 pr-2 rounded-lg border border-gray-100 dark:border-slate-700'>
                      {selectedTracks.length === 0 ? (
                        <div className='p-4 text-sm text-gray-500 dark:text-gray-400'>
                          No tracks selected yet. Use the search below to add
                          tracks.
                        </div>
                      ) : (
                        selectedTracks.map((track, index) => (
                          <div
                            key={track.id}
                            className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors'
                          >
                            <span className='text-xs font-medium text-gray-400 dark:text-gray-500 w-6 flex-shrink-0'>
                              {index + 1}
                            </span>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                {track.title}
                              </p>
                              <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                <ArtistDisplay track={track as any} />
                              </p>
                            </div>
                            {track.duration && (
                              <span className='text-xs text-gray-400 dark:text-gray-500 flex-shrink-0'>
                                {Math.floor((track.duration || 0) / 60)}:
                                {Math.floor((track.duration || 0) % 60)
                                  .toString()
                                  .padStart(2, '0')}
                              </span>
                            )}
                            <Button
                              size='sm'
                              variant='light'
                              isIconOnly
                              onPress={() => handleRemoveTrack(track.id)}
                              aria-label='Remove track'
                            >
                              <MinusCircleIcon className='w-4 h-4 text-red-500 dark:text-red-400' />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <h4 className='text-sm font-semibold text-gray-900 dark:text-white'>
                        Add Tracks
                      </h4>
                      <span className='text-xs text-gray-500 dark:text-gray-400'>
                        {selectedTracks.length}
                        {playlist.maxTracks
                          ? ` / ${playlist.maxTracks}`
                          : ''}{' '}
                        used
                      </span>
                    </div>
                    <Input
                      placeholder='Search tracks by title or artist'
                      value={trackSearchTerm}
                      onValueChange={setTrackSearchTerm}
                      variant='bordered'
                      startContent={
                        <MagnifyingGlassIcon className='w-4 h-4 text-gray-400 dark:text-gray-500' />
                      }
                    />
                    {searchError && (
                      <div className='text-xs text-red-500 dark:text-red-400'>
                        {searchError}
                      </div>
                    )}
                    <div className='max-h-48 overflow-y-auto space-y-1 pr-2 rounded-lg border border-gray-100 dark:border-slate-700'>
                      {isSearching ? (
                        <div className='p-4 text-sm text-gray-500 dark:text-gray-400'>
                          Searching tracks...
                        </div>
                      ) : !trackSearchTerm.trim() ? (
                        <div className='p-4 text-sm text-gray-500 dark:text-gray-400'>
                          Start typing to search for tracks to add.
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className='p-4 text-sm text-gray-500 dark:text-gray-400'>
                          No tracks found.
                        </div>
                      ) : (
                        searchResults.map(track => {
                          const isAdded = selectedTracks.some(
                            item => item.id === track.id
                          );
                          return (
                            <div
                              key={track.id}
                              className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors'
                            >
                              <div className='flex-1 min-w-0'>
                                <p className='text-sm font-medium text-gray-900 dark:text-white truncate'>
                                  {track.title}
                                </p>
                                <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                                  {track.artist}
                                </p>
                              </div>
                              {track.duration && (
                                <span className='text-xs text-gray-400 dark:text-gray-500 flex-shrink-0'>
                                  {Math.floor((track.duration || 0) / 60)}:
                                  {Math.floor((track.duration || 0) % 60)
                                    .toString()
                                    .padStart(2, '0')}
                                </span>
                              )}
                              <Button
                                size='sm'
                                variant='light'
                                startContent={<PlusIcon className='w-4 h-4' />}
                                onPress={() => handleAddTrack(track)}
                                isDisabled={
                                  isAdded ||
                                  (playlist.maxTracks
                                    ? selectedTracks.length >=
                                      playlist.maxTracks
                                    : false)
                                }
                              >
                                {isAdded ? 'Added' : 'Add'}
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant='light'
                  onPress={onClose}
                  isDisabled={isSaving}
                  startContent={<XMarkIcon className='w-4 h-4' />}
                >
                  Cancel
                </Button>
                <Button
                  color='primary'
                  onPress={handleConfirmSave}
                  isLoading={isSaving}
                  startContent={
                    !isSaving && <BookmarkIcon className='w-4 h-4' />
                  }
                >
                  {isSaving ? 'Saving...' : 'Save Playlist'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
