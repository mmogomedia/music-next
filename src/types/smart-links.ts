import type { QuickLinkMeta, QuickLinkTrackData } from '@/types/ai-responses';

export interface QuickLinkChatPayload {
  quickLink: QuickLinkMeta;
  track?: QuickLinkTrackData;
  album?: {
    albumName: string;
    artistName?: string | null;
    artistSlug?: string | null;
    tracks: QuickLinkTrackData[];
  };
  artist?: {
    artistName: string;
    bio?: string | null;
    profileImage?: string | null;
    location?: string | null;
    genre?: string | null;
    slug?: string | null;
    socialLinks?: Record<string, unknown> | null;
    streamingLinks?: Record<string, unknown> | null;
    topTracks: QuickLinkTrackData[];
  };
}
