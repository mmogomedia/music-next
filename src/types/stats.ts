/**
 * Central types for stats and analytics system
 */

export type SourceType =
  | 'landing'
  | 'playlist'
  | 'search'
  | 'direct'
  | 'share'
  | 'player';

export type PlatformType =
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'whatsapp'
  | 'copy_link'
  | 'embed';

export interface UseStatsOptions {
  trackId?: string;
  playlistId?: string;
  source?: SourceType;
}
