'use client';

import { useEffect, useState, useRef } from 'react';
import { Input, Button, Chip, Avatar, Spinner } from '@heroui/react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';

export interface ArtistOption {
  id: string;
  name: string;
  slug: string;
  profileImage: string | null;
  coverImage: string | null;
  isUnclaimed: boolean;
  tracks: Array<{
    id: string;
    title: string;
    coverImage: string | null;
    playCount: number;
  }>;
}

interface ArtistLookupSelectProps {
  label: string;
  selectedArtistIds: string[];
  onSelectionChange: (_artistIds: string[]) => void;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  allowMultiple?: boolean;
  showOrder?: boolean; // Show order numbers for primary artists
  excludeArtistIds?: string[]; // Exclude these artists (e.g., from featured when selecting primary)
  onCreateNew?: (_name: string) => Promise<ArtistOption | null>;
}

export default function ArtistLookupSelect({
  label,
  selectedArtistIds,
  onSelectionChange,
  placeholder = 'Search for an artist...',
  isRequired = false,
  isDisabled = false,
  allowMultiple = true,
  showOrder = false,
  excludeArtistIds = [],
  onCreateNew,
}: ArtistLookupSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ArtistOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState<ArtistOption[]>([]);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Track previous selectedArtistIds to detect changes
  const prevSelectedIdsRef = useRef<string[]>([]);

  // Fetch selected artists details from API (syncs with prop changes)
  useEffect(() => {
    // Check if selectedArtistIds actually changed
    const idsChanged =
      selectedArtistIds.length !== prevSelectedIdsRef.current.length ||
      selectedArtistIds.some((id, i) => id !== prevSelectedIdsRef.current[i]);

    if (!idsChanged && selectedArtistIds.length > 0) {
      // IDs haven't changed, just ensure order is correct
      setSelectedArtists(prev => {
        const ordered = selectedArtistIds
          .map(id => prev.find(a => a.id === id))
          .filter((a): a is ArtistOption => a !== undefined);
        // Only update if order changed
        if (
          ordered.length === prev.length &&
          ordered.every((a, i) => a.id === prev[i]?.id)
        ) {
          return prev;
        }
        return ordered;
      });
      return;
    }

    prevSelectedIdsRef.current = selectedArtistIds;

    if (selectedArtistIds.length === 0) {
      setSelectedArtists([]);
      return;
    }

    // Fetch from API
    const fetchSelectedArtists = async () => {
      try {
        const response = await fetch(
          `/api/artists/by-ids?ids=${selectedArtistIds.join(',')}`
        );
        if (response.ok) {
          const data = await response.json();
          // Update with fetched data, maintaining order from selectedArtistIds
          const ordered = selectedArtistIds
            .map(id => data.artists?.find((a: ArtistOption) => a.id === id))
            .filter((a): a is ArtistOption => a !== undefined);
          setSelectedArtists(ordered);
        }
      } catch (error) {
        console.error('Error fetching selected artists:', error);
      }
    };

    fetchSelectedArtists();
  }, [selectedArtistIds]);

  // Search with debounce
  useEffect(() => {
    if (!isOpen) {
      setSearchResults([]);
      setShowCreateOption(false);
      return;
    }

    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setShowCreateOption(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/artists/search?q=${encodeURIComponent(query)}`
        );
        if (response.ok) {
          const data = await response.json();
          const artists = (data.artists || []).filter(
            (artist: ArtistOption) => !excludeArtistIds.includes(artist.id)
          );
          setSearchResults(artists);
          // Show create option if no exact match found
          setShowCreateOption(
            !artists.some(
              (a: ArtistOption) => a.name.toLowerCase() === query.toLowerCase()
            )
          );
        }
      } catch (error) {
        console.error('Error searching artists:', error);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen, excludeArtistIds]);

  const handleSelectArtist = (artist: ArtistOption) => {
    if (allowMultiple) {
      if (!selectedArtistIds.includes(artist.id)) {
        // Immediately add to selected artists for instant feedback
        setSelectedArtists(prev => [...prev, artist]);
        onSelectionChange([...selectedArtistIds, artist.id]);
      }
    } else {
      // Immediately set selected artist for instant feedback
      setSelectedArtists([artist]);
      onSelectionChange([artist.id]);
      setIsOpen(false);
    }
    setSearchQuery('');
  };

  const handleRemoveArtist = (artistId: string) => {
    onSelectionChange(selectedArtistIds.filter(id => id !== artistId));
  };

  const handleCreateNew = async () => {
    const name = searchQuery.trim();
    if (!name || !onCreateNew) return;

    setIsCreating(true);
    try {
      const newArtist = await onCreateNew(name);
      if (newArtist) {
        handleSelectArtist(newArtist);
        setSearchQuery('');
        setShowCreateOption(false);
      }
    } catch (error) {
      console.error('Error creating artist:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
        {label}
        {isRequired && <span className='text-red-500 ml-1'>*</span>}
      </label>

      {/* Search Input */}
      {!isDisabled && (
        <div className='relative'>
          <Input
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder={placeholder}
            startContent={<MagnifyingGlassIcon className='w-4 h-4' />}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              // Delay to allow click events
              setTimeout(() => setIsOpen(false), 200);
            }}
            endContent={
              isSearching ? (
                <Spinner size='sm' />
              ) : searchQuery.length >= 2 ? (
                <Button
                  isIconOnly
                  size='sm'
                  variant='light'
                  onPress={() => setSearchQuery('')}
                >
                  <XMarkIcon className='w-4 h-4' />
                </Button>
              ) : null
            }
          />

          {/* Search Results Dropdown */}
          {isOpen && searchQuery.length >= 2 && (
            <div className='absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-96 overflow-y-auto'>
              {isSearching ? (
                <div className='p-4 text-center'>
                  <Spinner size='sm' />
                  <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
                    Searching...
                  </p>
                </div>
              ) : searchResults.length > 0 || showCreateOption ? (
                <div className='py-2'>
                  {searchResults.map(artist => (
                    <div
                      key={artist.id}
                      onClick={() => handleSelectArtist(artist)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectArtist(artist);
                        }
                      }}
                      role='button'
                      tabIndex={0}
                      className='flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors'
                    >
                      <Avatar
                        src={artist.profileImage || undefined}
                        size='md'
                        fallback={
                          <MusicalNoteIcon className='w-6 h-6 text-gray-400' />
                        }
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <p className='font-medium text-gray-900 dark:text-white truncate'>
                            {artist.name}
                          </p>
                          {artist.isUnclaimed && (
                            <span className='text-xs text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded'>
                              Unclaimed
                            </span>
                          )}
                        </div>
                        {artist.tracks.length > 0 && (
                          <div className='flex items-center gap-2 mt-1'>
                            {artist.tracks.slice(0, 3).map(track => (
                              <div
                                key={track.id}
                                className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'
                              >
                                {track.coverImage && (
                                  <img
                                    src={track.coverImage}
                                    alt={track.title}
                                    className='w-4 h-4 rounded'
                                  />
                                )}
                                <span className='truncate max-w-[100px]'>
                                  {track.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {showCreateOption && onCreateNew && (
                    <div
                      onClick={handleCreateNew}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCreateNew();
                        }
                      }}
                      role='button'
                      tabIndex={0}
                      className='flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border-t border-gray-200 dark:border-slate-700'
                    >
                      <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center'>
                        <PlusIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-medium text-blue-600 dark:text-blue-400'>
                          Create &quot;{searchQuery}&quot;
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          Create a new artist profile
                        </p>
                      </div>
                      {isCreating && <Spinner size='sm' />}
                    </div>
                  )}
                </div>
              ) : (
                <div className='p-4 text-center text-sm text-gray-500 dark:text-gray-400'>
                  No artists found
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Artists Display */}
      {selectedArtists.length > 0 && (
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
              Selected ({selectedArtists.length})
            </span>
          </div>
          <div className='flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800'>
            {selectedArtists.map((artist, index) => (
              <Chip
                key={artist.id}
                variant='flat'
                color='primary'
                size='md'
                onClose={
                  !isDisabled ? () => handleRemoveArtist(artist.id) : undefined
                }
                startContent={
                  showOrder ? (
                    <span className='text-xs font-semibold mr-1 text-blue-700 dark:text-blue-300'>
                      {index + 1}.
                    </span>
                  ) : artist.profileImage ? (
                    <Avatar
                      src={artist.profileImage}
                      size='sm'
                      className='w-5 h-5'
                    />
                  ) : (
                    <MusicalNoteIcon className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                  )
                }
                className='cursor-default bg-white dark:bg-slate-700 border border-blue-300 dark:border-blue-700'
              >
                <span className='font-medium text-gray-900 dark:text-white'>
                  {artist.name}
                </span>
                {artist.isUnclaimed && (
                  <span className='text-xs text-gray-500 ml-1'>
                    (unclaimed)
                  </span>
                )}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
