// Artist Profile Types
import { Track } from './track';

export interface SocialLinks {
  instagram?: {
    username: string;
    url: string;
    followers?: number;
    verified?: boolean;
  };
  twitter?: {
    username: string;
    url: string;
    followers?: number;
    verified?: boolean;
  };
  tiktok?: {
    username: string;
    url: string;
    followers?: number;
    verified?: boolean;
  };
  youtube?: {
    channelName: string;
    url: string;
    subscribers?: number;
    verified?: boolean;
  };
  facebook?: {
    pageName: string;
    url: string;
    followers?: number;
  };
  soundcloud?: {
    username: string;
    url: string;
    followers?: number;
  };
  bandcamp?: {
    artistName: string;
    url: string;
    followers?: number;
  };
}

// Base streaming platform link interface
export interface BaseStreamingLink {
  url: string;
  verified?: boolean;
}

// Artist-based platforms (most platforms)
export interface ArtistStreamingLink extends BaseStreamingLink {
  artistId: string;
  monthlyListeners?: number;
}

// Channel-based platforms (YouTube Music)
export interface ChannelStreamingLink extends BaseStreamingLink {
  channelId: string;
  subscribers?: number;
}

// Platform-specific link types
export type SpotifyLink = ArtistStreamingLink & {
  verified?: boolean;
};

export type AppleMusicLink = ArtistStreamingLink;
export type AmazonMusicLink = ArtistStreamingLink;
export type DeezerLink = ArtistStreamingLink;
export type TidalLink = ArtistStreamingLink;
export type YouTubeMusicLink = ChannelStreamingLink;

// Union type for all possible link types
export type StreamingPlatformLink =
  | SpotifyLink
  | AppleMusicLink
  | AmazonMusicLink
  | DeezerLink
  | TidalLink
  | YouTubeMusicLink;

// Type guard functions
export function isArtistLink(
  link: StreamingPlatformLink
): link is ArtistStreamingLink {
  return 'artistId' in link;
}

export function isChannelLink(
  link: StreamingPlatformLink
): link is ChannelStreamingLink {
  return 'channelId' in link;
}

// Streaming links interface using the union type
export interface StreamingLinks {
  spotify?: SpotifyLink;
  appleMusic?: AppleMusicLink;
  youtubeMusic?: YouTubeMusicLink;
  amazonMusic?: AmazonMusicLink;
  deezer?: DeezerLink;
  tidal?: TidalLink;
}

export interface ArtistProfile {
  id: string;
  userId: string;
  artistName: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  location?: string;
  website?: string;
  genre?: string;
  slug?: string;
  socialLinks?: SocialLinks;
  streamingLinks?: StreamingLinks;
  isPublic: boolean;
  isVerified: boolean;
  isActive: boolean;
  totalPlays: number;
  totalLikes: number;
  totalFollowers: number;
  profileViews: number;
  createdAt: Date;
  updatedAt: Date;
  tracks?: Track[];
  user?: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };
}

export interface CreateArtistProfileData {
  artistName: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  location?: string;
  website?: string;
  genre?: string;
  slug?: string;
  socialLinks?: SocialLinks;
  streamingLinks?: StreamingLinks;
}

export interface UpdateArtistProfileData {
  artistName?: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  location?: string;
  website?: string;
  genre?: string;
  slug?: string;
  socialLinks?: SocialLinks;
  streamingLinks?: StreamingLinks;
  isPublic?: boolean;
  isActive?: boolean;
}

export interface ProfileAnalytics {
  profile: {
    totalPlays: number;
    totalLikes: number;
    totalFollowers: number;
    profileViews: number;
  };
  tracks: {
    totalTracks: number;
    totalPlays: number;
    totalLikes: number;
    recentTracks: number;
    topTracks: Array<{
      id: string;
      title: string;
      playCount: number;
      likeCount: number;
      createdAt: Date;
    }>;
  };
  monthlyPlays: Array<{
    month: string;
    plays: number;
  }>;
  lastUpdated: string;
}

// API Response Types
export interface ArtistProfileResponse {
  artistProfile: ArtistProfile;
}

export interface SocialLinksResponse {
  socialLinks: SocialLinks;
}

export interface StreamingLinksResponse {
  streamingLinks: StreamingLinks;
}

export interface AnalyticsResponse {
  analytics: ProfileAnalytics;
}
