'use client';

import React from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { constructFileUrl } from '@/lib/url-utils';

interface TrackArtworkProps {
  artworkUrl?: string;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export default function TrackArtwork({
  artworkUrl,
  title = 'Track',
  size = 'md',
  className = '',
  showFallback = true,
}: TrackArtworkProps) {
  const sizeClass = sizeClasses[size];
  const fallbackIconSize =
    size === 'xs'
      ? 'w-3 h-3'
      : size === 'sm'
        ? 'w-4 h-4'
        : size === 'md'
          ? 'w-6 h-6'
          : size === 'lg'
            ? 'w-8 h-8'
            : 'w-12 h-12';

  if (artworkUrl) {
    // Handle both file paths and full URLs
    const imageUrl = artworkUrl.startsWith('http')
      ? artworkUrl
      : constructFileUrl(artworkUrl);

    return (
      <img
        src={imageUrl}
        alt={`${title} artwork`}
        className={`${sizeClass} rounded-lg object-cover flex-shrink-0 ${className}`}
        onError={e => {
          // If image fails to load, show fallback
          if (showFallback) {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="${sizeClass} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 ${className}">
                  <svg class="${fallbackIconSize} text-white opacity-50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              `;
            }
          }
        }}
      />
    );
  }

  if (!showFallback) {
    return null;
  }

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <MusicalNoteIcon
        className={`${fallbackIconSize} text-white opacity-50`}
      />
    </div>
  );
}
