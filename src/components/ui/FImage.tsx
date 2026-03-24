'use client';

import React, { useState } from 'react';
import {
  MusicalNoteIcon,
  UserCircleIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';
import { constructFileUrl } from '@/lib/url-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type FImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type FImageAspect = 'square' | 'portrait' | 'wide' | 'free';
type FImageFallback = 'music' | 'person' | 'generic';
type FImageRounded = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
type FImageOverlay = 'none' | 'gradient' | 'dark';

export interface FImageProps {
  /** Image URL or file path. File paths are auto-resolved via constructFileUrl. */
  src?: string;
  /** Accessible alt text. */
  alt?: string;
  /**
   * Named size token. Maps to Tailwind w-/h- classes.
   * For custom sizes (e.g. 320px artwork) pass `className='w-80 h-80'` instead.
   */
  size?: FImageSize;
  /**
   * Enforce an aspect ratio on the container.
   * @default 'free' — no ratio enforced, image fills its container
   */
  aspect?: FImageAspect;
  /**
   * Icon shown when `src` is empty or fails to load.
   * @default 'generic' → PhotoIcon
   */
  fallback?: FImageFallback;
  /**
   * Border-radius variant.
   * @default 'lg'
   */
  rounded?: FImageRounded;
  /**
   * Optional overlay applied on top of the image.
   * `gradient` → bottom-fade for readability. `dark` → solid scrim.
   * @default 'none'
   */
  overlay?: FImageOverlay;
  /** Content rendered inside the overlay (e.g. caption text). */
  overlayContent?: React.ReactNode;
  /** Makes the image clickable. Adds cursor-pointer + hover:opacity-90. */
  onClick?: () => void;
  /** Absolute-positioned slot in the top-right corner (e.g. a badge or status chip). */
  badge?: React.ReactNode;
  /**
   * Adds a ring / outline around the image.
   * `true` → neutral gray ring. Pass a color name for a colored ring.
   */
  ring?: boolean | 'primary' | 'success' | 'warning' | 'danger';
  /** Native img loading attribute. @default 'lazy' */
  loading?: 'lazy' | 'eager';
  /** Additional classes for the outer container div. */
  className?: string;
  /** Additional classes for the img element. */
  imgClassName?: string;
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<FImageSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
  '2xl': 'w-32 h-32',
};

const FALLBACK_ICON_SIZES: Record<FImageSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16',
};

const ASPECT_CLASSES: Record<FImageAspect, string> = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-video',
  free: '',
};

const ROUNDED_CLASSES: Record<FImageRounded, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

const RING_CLASSES: Record<string, string> = {
  true: 'ring-2 ring-gray-300 dark:ring-gray-600 ring-offset-2 dark:ring-offset-slate-900',
  primary: 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900',
  success: 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900',
  warning: 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-900',
  danger: 'ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-slate-900',
};

// ─── Fallback icon ────────────────────────────────────────────────────────────

function FallbackIcon({
  type,
  className,
}: {
  type: FImageFallback;
  className?: string;
}) {
  const cls = cn('text-white opacity-60', className);
  switch (type) {
    case 'music':
      return <MusicalNoteIcon className={cls} />;
    case 'person':
      return <UserCircleIcon className={cls} />;
    default:
      return <PhotoIcon className={cls} />;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FImage — display-only image component for the Flemoji UI library.
 *
 * Features:
 * - Named size tokens (xs → 2xl) or custom sizes via className
 * - Aspect-ratio lock (square / portrait / wide / free)
 * - Contextual fallback (music note, person, generic icon) on empty/error
 * - Skeleton loading animation (fade-in on load)
 * - Overlay variants (gradient bottom-fade or dark scrim)
 * - Corner badge slot
 * - Ring/outline variants for selected states
 * - Click interaction with hover:opacity-90
 *
 * @example
 * // Track artwork
 * <FImage src={track.artworkUrl} alt={track.title} fallback="music"
 *   className="w-80 h-80" rounded="xl" aspect="square" />
 *
 * // Artist avatar
 * <FImage src={artist.profileImage} alt={artist.name} fallback="person"
 *   size="xl" rounded="full" />
 *
 * // Card thumbnail with overlay caption
 * <FImage src={playlist.cover} aspect="wide" overlay="gradient"
 *   overlayContent={<p className="text-white text-sm">{playlist.title}</p>} />
 */
export function FImage({
  src,
  alt = 'Image',
  size,
  aspect = 'free',
  fallback = 'generic',
  rounded = 'lg',
  overlay = 'none',
  overlayContent,
  onClick,
  badge,
  ring,
  loading = 'lazy',
  className,
  imgClassName,
}: FImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    src ? 'loading' : 'error'
  );

  // Resolve the URL — file paths go through constructFileUrl
  const resolvedSrc = src
    ? src.startsWith('http') ||
      src.startsWith('blob:') ||
      src.startsWith('data:')
      ? src
      : constructFileUrl(src)
    : undefined;

  const hasImage = !!resolvedSrc && status !== 'error';
  const isSkeletonVisible = !!resolvedSrc && status === 'loading';

  const sizeClass = size ? SIZE_CLASSES[size] : '';
  const aspectClass = ASPECT_CLASSES[aspect];
  const roundedClass = ROUNDED_CLASSES[rounded];
  const ringClass = ring ? (RING_CLASSES[String(ring)] ?? '') : '';

  const overlayClass =
    overlay === 'gradient'
      ? 'absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none'
      : overlay === 'dark'
        ? 'absolute inset-0 bg-black/40 pointer-events-none'
        : '';

  // Icon size for fallback — derive from named size or default to md
  const iconSize = size ? FALLBACK_ICON_SIZES[size] : 'w-8 h-8';

  return (
    <div
      className={cn(
        'relative overflow-hidden flex-shrink-0',
        sizeClass,
        aspectClass,
        roundedClass,
        ringClass,
        onClick &&
          'cursor-pointer hover:opacity-90 transition-opacity duration-200',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
    >
      {/* Loading skeleton */}
      {isSkeletonVisible && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-200 dark:bg-slate-700 animate-pulse',
            roundedClass
          )}
        />
      )}

      {/* Image */}
      {resolvedSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt={alt}
          loading={loading}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={cn(
            'w-full h-full object-cover',
            roundedClass,
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            'transition-opacity duration-300',
            imgClassName
          )}
        />
      )}

      {/* Fallback — shown when no src or load fails */}
      {!hasImage && !isSkeletonVisible && (
        <div className='absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
          <FallbackIcon type={fallback} className={iconSize} />
        </div>
      )}

      {/* Overlay */}
      {overlay !== 'none' && <div className={overlayClass} />}

      {/* Overlay content (e.g. caption) */}
      {overlayContent && (
        <div className='absolute inset-0 flex items-end p-2 pointer-events-none'>
          {overlayContent}
        </div>
      )}

      {/* Badge (top-right corner slot) */}
      {badge && <div className='absolute top-1 right-1'>{badge}</div>}
    </div>
  );
}

export default FImage;
