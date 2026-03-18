'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Input, Button } from '@heroui/react';
import {
  MagnifyingGlassIcon,
  UserIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import { WizardFormData } from '../ArtistProfileWizard';

interface Track {
  id: string;
  title: string;
  coverImage: string | null;
  playCount: number;
  likeCount: number;
}

interface UnclaimedProfile {
  id: string;
  name: string;
  slug: string;
  profileImage: string | null;
  coverImage: string | null;
  stats: {
    tracks: number;
    plays: number;
    likes: number;
    followers: number;
  };
  tracks: Track[];
  createdAt: string;
}

interface ClaimProfileStepProps {
  formData: WizardFormData;
  updateFormData: (_updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
  onClaimed?: () => void;
}

export default function ClaimProfileStep({
  formData,
  updateFormData: _updateFormData,
  errors: _errors,
  onClaimed: _onClaimed,
}: ClaimProfileStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<UnclaimedProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProfiles([]);
      setHasSearched(false);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const response = await fetch(
        `/api/artists/unclaimed?search=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
        setSearchError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          // User already has a profile
          setSearchError(
            errorData.error || 'You already have an artist profile'
          );
          setProfiles([]);
        } else {
          setSearchError(
            errorData.error || 'Failed to search profiles. Please try again.'
          );
          setProfiles([]);
        }
      }
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching profiles:', error);
      setSearchError('An unexpected error occurred. Please try again.');
      setProfiles([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  const handleClaim = async (profileId: string) => {
    try {
      const response = await fetch('/api/artists/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId: profileId }),
      });

      if (response.ok) {
        // Store claimed profile ID and continue wizard
        _updateFormData({ claimedProfileId: profileId });
        // Notify parent to move to next step
        if (_onClaimed) {
          _onClaimed();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to claim profile');
      }
    } catch (error) {
      console.error('Error claiming profile:', error);
      alert('Failed to claim profile');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='space-y-1.5'>
        <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
          Claim Existing Profile
        </h3>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          Search for your existing artist profile and claim it. If you
          don&apos;t find yours, you can create a new profile.
        </p>
      </div>

      <div>
        <Input
          placeholder='Search by artist name...'
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={
            <MagnifyingGlassIcon className='w-4 h-4 text-gray-400' />
          }
          endContent={
            isSearching ? (
              <div className='w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin' />
            ) : null
          }
          className='w-full'
          classNames={{
            input: 'text-sm',
            inputWrapper: 'border-gray-200 dark:border-slate-700',
          }}
        />
        {searchError && (
          <div className='mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
            <p className='text-sm text-red-600 dark:text-red-400'>
              {searchError}
            </p>
          </div>
        )}
      </div>

      {formData.claimedProfileId ? (
        <div className='border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-4'>
          <p className='text-sm text-green-700 dark:text-green-400 font-medium'>
            ✓ Profile claimed successfully! Click &quot;Continue&quot; to
            proceed.
          </p>
        </div>
      ) : (
        <>
          {hasSearched && (
            <div className='space-y-2'>
              {profiles.length === 0 ? (
                <div className='border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-lg p-6 text-center'>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    No unclaimed profiles found. Click &quot;Continue&quot; to
                    create a new profile.
                  </p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {profiles.map(profile => (
                    <div
                      key={profile.id}
                      className='border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg hover:border-blue-600 dark:hover:border-blue-500 transition-colors overflow-hidden'
                    >
                      <div className='p-4'>
                        <div className='flex items-start gap-3'>
                          {/* Profile Image */}
                          {profile.profileImage ? (
                            <Image
                              src={profile.profileImage}
                              alt={profile.name}
                              width={48}
                              height={48}
                              className='w-12 h-12 rounded-lg object-cover flex-shrink-0'
                            />
                          ) : (
                            <div className='w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0'>
                              <UserIcon className='w-6 h-6 text-gray-400' />
                            </div>
                          )}

                          {/* Content */}
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-start justify-between gap-3 mb-2'>
                              <div className='flex-1 min-w-0'>
                                <h4 className='font-semibold text-gray-900 dark:text-white text-base mb-1'>
                                  {profile.name}
                                </h4>
                                <div className='flex gap-3 text-xs text-gray-500 dark:text-gray-400'>
                                  <span>{profile.stats.tracks} tracks</span>
                                  <span>
                                    {profile.stats.plays.toLocaleString()} plays
                                  </span>
                                  <span>{profile.stats.likes} likes</span>
                                </div>
                              </div>
                              <Button
                                className='bg-blue-600 text-white hover:bg-blue-700 flex-shrink-0'
                                size='sm'
                                onPress={() => handleClaim(profile.id)}
                              >
                                Claim
                              </Button>
                            </div>

                            {/* Tracks - Horizontal Layout with Artwork */}
                            {profile.tracks && profile.tracks.length > 0 && (
                              <div className='mt-3 pt-3 border-t border-gray-100 dark:border-slate-800'>
                                <div className='flex items-center gap-3 flex-wrap'>
                                  {profile.tracks.map(track => (
                                    <div
                                      key={track.id}
                                      className='flex items-center gap-2 flex-shrink-0 group'
                                    >
                                      {track.coverImage ? (
                                        <Image
                                          src={track.coverImage}
                                          alt={track.title}
                                          width={48}
                                          height={48}
                                          className='w-12 h-12 rounded-md object-cover shadow-sm group-hover:shadow-md transition-shadow'
                                        />
                                      ) : (
                                        <div className='w-12 h-12 rounded-md bg-gray-100 dark:bg-slate-800 flex items-center justify-center'>
                                          <MusicalNoteIcon className='w-6 h-6 text-gray-400' />
                                        </div>
                                      )}
                                      <div className='min-w-0'>
                                        <p className='text-xs font-medium text-gray-900 dark:text-white truncate max-w-[140px]'>
                                          {track.title}
                                        </p>
                                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                                          {track.playCount.toLocaleString()}{' '}
                                          plays
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!hasSearched && !searchError && (
            <div className='border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-lg p-6 text-center'>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Enter an artist name above to search, or click
                &quot;Continue&quot; to create a new profile.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
