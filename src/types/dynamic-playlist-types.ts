// Dynamic Playlist Types System
export interface PlaylistTypeDefinition {
  id: string;
  name: string; // "Genre", "Featured", "Top Ten"
  slug: string; // "genre", "featured", "top-ten"
  description?: string; // "Curated music by specific genres"
  icon?: string; // "🎵", "🏆", "📊"
  color?: string; // "#3B82F6", "#8B5CF6"
  maxInstances: number; // -1 = unlimited, 1 = single instance
  requiresProvince: boolean; // true for province playlists
  defaultMaxTracks: number; // Default max tracks for this type
  displayOrder: number; // Order in admin interface
  isActive: boolean; // Can be disabled without deletion
  createdAt: Date;
  updatedAt: Date;
}

// Updated Playlist interface with dynamic type
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  playlistTypeId: string; // Reference to PlaylistTypeDefinition
  playlistType?: PlaylistTypeDefinition; // Populated relation
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

  // Relations
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  submissions?: PlaylistSubmission[];
  tracks?: PlaylistTrack[];
  analytics?: PlaylistAnalytics[];
}

// Create/Update Playlist Type Data
export interface CreatePlaylistTypeDefinitionData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  maxInstances: number;
  requiresProvince: boolean;
  defaultMaxTracks: number;
  displayOrder: number;
}

export interface UpdatePlaylistTypeDefinitionData {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  maxInstances?: number;
  requiresProvince?: boolean;
  defaultMaxTracks?: number;
  displayOrder?: number;
  isActive?: boolean;
}

// Create/Update Playlist Data (updated)
export interface CreatePlaylistData {
  name: string;
  description?: string;
  playlistTypeId: string; // Now references dynamic type
  coverImage: string;
  maxTracks: number;
  maxSubmissionsPerArtist: number;
  province?: string;
}

export interface UpdatePlaylistData {
  name?: string;
  description?: string;
  playlistTypeId?: string; // Can change type
  coverImage?: string;
  maxTracks?: number;
  maxSubmissionsPerArtist?: number;
  status?: PlaylistStatus;
  submissionStatus?: SubmissionStatus;
  province?: string;
  order?: number;
}

// Playlist Type Management
export interface PlaylistTypeManagement {
  types: PlaylistTypeDefinition[];
  loading: boolean;
  error: string | null;
  selectedType: PlaylistTypeDefinition | null;
  isCreating: boolean;
  isEditing: boolean;
}

// Validation helpers
export interface PlaylistTypeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Backward compatibility - keep old enums for migration
/* eslint-disable no-unused-vars */
export enum LegacyPlaylistType {
  GENRE = 'GENRE',
  FEATURED = 'FEATURED',
  TOP_TEN = 'TOP_TEN',
  PROVINCE = 'PROVINCE',
}

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

// Import existing types
import type {
  PlaylistSubmission,
  PlaylistTrack,
  PlaylistAnalytics,
} from './playlist';
