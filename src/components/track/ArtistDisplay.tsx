'use client';

import { useMemo } from 'react';
import { Avatar } from '@heroui/react';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { Track } from '@/types/track';

export interface ArtistDisplayData {
  id: string;
  name: string;
  profileImage?: string | null;
  isUnclaimed?: boolean;
}

interface ArtistDisplayProps {
  track?: Track; // Accept track directly
  primaryArtists?: ArtistDisplayData[];
  featuredArtists?: ArtistDisplayData[];
  legacyArtist?: string; // Fallback for backward compatibility
  showAvatars?: boolean;
  className?: string;
}

/**
 * Helper function to extract artist data from a track
 */
export function extractArtistsFromTrack(track: Track): {
  primaryArtists: ArtistDisplayData[];
  featuredArtists: ArtistDisplayData[];
  legacyArtist: string | undefined;
} {
  // If track has full artist objects (from API)
  const primaryArtists: ArtistDisplayData[] =
    (track as any).primaryArtists?.map((a: any) => ({
      id: a.id,
      name: a.artistName || a.name,
      profileImage: a.profileImage,
      isUnclaimed: a.isUnclaimed,
    })) || [];

  const featuredArtists: ArtistDisplayData[] =
    (track as any).featuredArtists?.map((a: any) => ({
      id: a.id,
      name: a.artistName || a.name,
      profileImage: a.profileImage,
      isUnclaimed: a.isUnclaimed,
    })) || [];

  return {
    primaryArtists,
    featuredArtists,
    legacyArtist: track.artist,
  };
}

/**
 * Component to display artists in the format:
 * "Artist1, Artist2 feat. Featured1, Featured2"
 */
export default function ArtistDisplay({
  track,
  primaryArtists = [],
  featuredArtists = [],
  legacyArtist,
  showAvatars = false,
  className = '',
}: ArtistDisplayProps) {
  // Extract artist data from track if provided
  const artistData = useMemo(() => {
    if (track) {
      return extractArtistsFromTrack(track);
    }
    return { primaryArtists, featuredArtists, legacyArtist };
  }, [track, primaryArtists, featuredArtists, legacyArtist]);

  const displayText = useMemo(() => {
    const parts: string[] = [];

    // Primary artists
    if (artistData.primaryArtists.length > 0) {
      parts.push(artistData.primaryArtists.map(a => a.name).join(', '));
    } else if (artistData.legacyArtist) {
      // Fallback to legacy string if no primary artists
      parts.push(artistData.legacyArtist);
    }

    // Featured artists
    if (artistData.featuredArtists.length > 0) {
      parts.push(
        `feat. ${artistData.featuredArtists.map(a => a.name).join(', ')}`
      );
    }

    return parts.join(' ');
  }, [artistData]);

  if (showAvatars && artistData.primaryArtists.length > 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className='flex -space-x-2'>
          {artistData.primaryArtists.slice(0, 3).map(artist => (
            <Avatar
              key={artist.id}
              src={artist.profileImage || undefined}
              size='sm'
              fallback={<MusicalNoteIcon className='w-4 h-4 text-gray-400' />}
              className='border-2 border-white dark:border-slate-800'
            />
          ))}
          {artistData.primaryArtists.length > 3 && (
            <div className='w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300'>
              +{artistData.primaryArtists.length - 3}
            </div>
          )}
        </div>
        <span className='text-sm text-gray-700 dark:text-gray-300'>
          {displayText}
        </span>
      </div>
    );
  }

  return (
    <span className={`text-sm text-gray-700 dark:text-gray-300 ${className}`}>
      {displayText || 'Unknown Artist'}
    </span>
  );
}
