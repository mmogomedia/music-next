import { constructFileUrl } from '@/lib/url-utils';

export function getArtistImageUrl(
  src: string | null | undefined
): string | null {
  const s = (src ?? '').trim();
  if (!s) return null;
  // Match the player pattern (TrackArtwork): treat non-http(s) as a stored file path.
  return s.startsWith('http://') || s.startsWith('https://')
    ? s
    : constructFileUrl(s);
}

export function getSocialIcon(platform: string): string {
  const icons: Record<string, string> = {
    instagram: '📷',
    twitter: '🐦',
    tiktok: '🎵',
    youtube: '📺',
    facebook: '👥',
    soundcloud: '🎧',
    bandcamp: '🎸',
  };
  return icons[platform] || '🔗';
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export type StatusChange =
  | 'NEW'
  | 'UP'
  | 'DOWN'
  | 'UNCHANGED'
  | 'PROMOTED'
  | 'DEMOTED'
  | 'EXITED';

export function getStatusLabel(statusChange: StatusChange): string {
  switch (statusChange) {
    case 'UP':
      return 'Rising';
    case 'DOWN':
      return 'Falling';
    case 'UNCHANGED':
      return 'Holding';
    case 'NEW':
      return 'New Entry';
    case 'PROMOTED':
      return 'Promoted';
    case 'DEMOTED':
      return 'Demoted';
    default:
      return '';
  }
}

export interface PlacesMoved {
  moved: number;
  label: string;
}

export function formatPlacesMoved(
  previousRank: number | null | undefined,
  currentRank: number
): PlacesMoved | null {
  const prev = previousRank ?? null;
  if (prev == null) return null;
  const moved = prev - currentRank; // positive means moved up
  if (moved === 0) return { moved: 0, label: 'No change' };
  return {
    moved,
    label:
      moved > 0
        ? `Up ${moved} place${moved === 1 ? '' : 's'}`
        : `Down ${Math.abs(moved)} place${Math.abs(moved) === 1 ? '' : 's'}`,
  };
}
