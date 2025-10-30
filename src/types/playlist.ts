// Import PlaylistTypeDefinition from dynamic types
import type { PlaylistTypeDefinition } from './dynamic-playlist-types';

// Note: PlaylistType enum removed - now using dynamic PlaylistTypeDefinition from database
/* eslint-disable no-unused-vars */

export enum PlaylistStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum SubmissionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum TrackSubmissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SHORTLISTED = 'SHORTLISTED',
}
/* eslint-enable no-unused-vars */

// Main Playlist Interface
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  playlistTypeId: string;
  coverImage: string;
  maxTracks: number;
  currentTracks: number;
  status: PlaylistStatus;
  submissionStatus: SubmissionStatus;
  maxSubmissionsPerArtist: number;
  province?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  order: number;

  // Relations (optional, populated when needed)
  playlistType?: PlaylistTypeDefinition;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  submissions?: PlaylistSubmission[];
  tracks?: PlaylistTrack[];
  analytics?: PlaylistAnalytics[];
}

// Playlist Submission Interface
export interface PlaylistSubmission {
  id: string;
  playlistId: string;
  trackId: string;
  artistId: string;
  status: TrackSubmissionStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  adminComment?: string;
  artistComment?: string;

  // Relations (optional, populated when needed)
  playlist?: Playlist;
  track?: {
    id: string;
    title: string;
    artist: string;
    duration: number;
    genre: string;
    coverImageUrl?: string;
    albumArtwork?: string;
  };
  artist?: {
    id: string;
    name: string;
    email: string;
  };
  reviewedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

// Playlist Track Interface
export interface PlaylistTrack {
  id: string;
  playlistId: string;
  trackId: string;
  order: number;
  addedAt: Date;
  addedBy: string;
  submissionId?: string;

  // Relations (optional, populated when needed)
  playlist?: Playlist;
  track?: {
    id: string;
    title: string;
    artist: string;
    duration: number;
    genre: string;
    coverImageUrl?: string;
    albumArtwork?: string;
    playCount: number;
    likeCount: number;
  };
  addedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

// Playlist Analytics Interface
export interface PlaylistAnalytics {
  id: string;
  playlistId: string;
  date: Date;
  views: number;
  plays: number;
  likes: number;
  shares: number;
  uniqueListeners: number;

  // Relations (optional, populated when needed)
  playlist?: Playlist;
}

// Create Playlist Data
export interface CreatePlaylistData {
  name: string;
  description?: string;
  playlistTypeId: string;
  coverImage: string;
  maxTracks: number;
  maxSubmissionsPerArtist: number;
  province?: string;
}

// Update Playlist Data
export interface UpdatePlaylistData {
  name?: string;
  description?: string;
  coverImage?: string;
  maxTracks?: number;
  maxSubmissionsPerArtist?: number;
  status?: PlaylistStatus;
  submissionStatus?: SubmissionStatus;
  province?: string;
  order?: number;
}

// Submit Track Data
export interface SubmitTrackData {
  trackIds: string[];
  message?: string;
}

// Review Submission Data
export interface ReviewSubmissionData {
  status: TrackSubmissionStatus;
  comment?: string;
}

// Bulk Review Data
export interface BulkReviewData {
  submissionIds: string[];
  action: TrackSubmissionStatus;
  comment?: string;
}

// Playlist Filters
export interface PlaylistFilters {
  type?: string; // Now using playlistTypeId
  status?: PlaylistStatus;
  submissionStatus?: SubmissionStatus;
  province?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Submission Filters
export interface SubmissionFilters {
  status?: TrackSubmissionStatus;
  playlistId?: string;
  artistId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  page?: number;
  limit?: number;
}

// Playlist Analytics Data
export interface PlaylistAnalyticsData {
  playlistId: string;
  period: '7d' | '30d' | '90d';
  metrics: {
    views: number;
    plays: number;
    likes: number;
    shares: number;
    uniqueListeners: number;
    completionRate: number;
  };
  topTracks: {
    trackId: string;
    title: string;
    plays: number;
  }[];
  trends: {
    date: string;
    views: number;
    plays: number;
  }[];
}

// Landing Page Data
export interface LandingPageData {
  featuredPlaylist: Playlist & { tracks: PlaylistTrack[] };
  topTenPlaylist: Playlist & { tracks: PlaylistTrack[] };
  provincePlaylists: Playlist[];
  genrePlaylists: Playlist[];
}

// Province List
export const PROVINCES = [
  'Western Cape',
  'Eastern Cape',
  'Northern Cape',
  'Free State',
  'KwaZulu-Natal',
  'North West',
  'Gauteng',
  'Mpumalanga',
  'Limpopo',
] as const;

export type Province = (typeof PROVINCES)[number];

// Max Tracks Options
export const MAX_TRACKS_OPTIONS = [10, 15, 20, 50, 100] as const;

export type MaxTracksOption = (typeof MAX_TRACKS_OPTIONS)[number];

// Max Submissions Options
export const MAX_SUBMISSIONS_OPTIONS = [1, 2, 3, 4, 5] as const;

export type MaxSubmissionsOption = (typeof MAX_SUBMISSIONS_OPTIONS)[number];
