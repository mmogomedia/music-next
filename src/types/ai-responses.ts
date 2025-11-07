/**
 * AI Response Types
 *
 * Defines all possible response types that the AI can return.
 * These types are registered in the response registry system for automatic
 * handling by both AI agents and UI components.
 *
 * @module ai-responses
 */

import type {
  TrackWithArtist,
  PlaylistWithTracks,
  PlaylistInfo,
  ArtistProfileComplete,
} from '@/lib/services';

/**
 * Base interface for all AI responses
 */
export interface BaseAIResponse {
  type: string;
  message: string;
  timestamp: Date;
  conversationId?: string;
}

/**
 * Simple text response for conversational messages
 */
export interface TextResponse extends BaseAIResponse {
  type: 'text';
}

/**
 * Action that can be executed by the client
 */
export interface Action {
  type:
    | 'play_track'
    | 'play_playlist'
    | 'queue_add'
    | 'queue_replace'
    | 'shuffle'
    | 'open_playlist'
    | 'view_artist'
    | 'share_track'
    | 'save_playlist';
  label: string;
  icon?: string;
  data: {
    trackId?: string;
    playlistId?: string;
    artistId?: string;
    [key: string]: any;
  };
}

/**
 * Response containing a list of tracks
 */
export interface TrackListResponse extends BaseAIResponse {
  type: 'track_list';
  data: {
    tracks: TrackWithArtist[];
    other?: TrackWithArtist[]; // Additional/featured tracks (e.g., for single track results)
    summary?: string; // AI-generated summary for single track results
    metadata?: {
      genre?: string;
      province?: string;
      total?: number;
      query?: string;
    };
  };
  actions?: Action[];
}

/**
 * Response containing a single playlist with tracks
 */
export interface PlaylistResponse extends BaseAIResponse {
  type: 'playlist';
  data: PlaylistWithTracks;
  actions?: Action[];
}

/**
 * Response containing multiple playlists (for browse/discover)
 */
export interface PlaylistGridResponse extends BaseAIResponse {
  type: 'playlist_grid';
  data: {
    playlists: PlaylistInfo[];
    metadata?: {
      genre?: string;
      province?: string;
      total?: number;
    };
  };
  actions?: Action[];
}

/**
 * Response containing an artist profile
 */
export interface ArtistResponse extends BaseAIResponse {
  type: 'artist';
  data: ArtistProfileComplete;
  actions?: Action[];
}

/**
 * Response containing mixed search results (tracks + artists)
 */
export interface SearchResultsResponse extends BaseAIResponse {
  type: 'search_results';
  data: {
    tracks?: TrackWithArtist[];
    artists?: ArtistProfileComplete[];
    metadata?: {
      query: string;
      total?: number;
    };
  };
  actions?: Action[];
}

/**
 * Genre information
 */
export interface GenreInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  colorHex?: string;
  icon?: string;
  trackCount?: number;
}

/**
 * Response containing a list of available genres
 */
export interface GenreListResponse extends BaseAIResponse {
  type: 'genre_list';
  data: {
    genres: GenreInfo[];
    metadata?: {
      total?: number;
    };
  };
  actions?: Action[];
}

/**
 * Response for playback actions
 */
export interface ActionResponse extends BaseAIResponse {
  type: 'action';
  action: Action;
  success?: boolean;
}

/**
 * Union type of all possible AI responses
 */
export type AIResponse =
  | TextResponse
  | TrackListResponse
  | PlaylistResponse
  | PlaylistGridResponse
  | ArtistResponse
  | SearchResultsResponse
  | ActionResponse
  | GenreListResponse;

/**
 * Registry of available response types
 */
export const RESPONSE_TYPES = {
  text: 'text',
  track_list: 'track_list',
  playlist: 'playlist',
  playlist_grid: 'playlist_grid',
  artist: 'artist',
  search_results: 'search_results',
  action: 'action',
  genre_list: 'genre_list',
} as const;

/**
 * Type representing all registered response type keys
 */
export type ResponseType = (typeof RESPONSE_TYPES)[keyof typeof RESPONSE_TYPES];

/**
 * Type guard to check if a response is a specific type
 */
export function isAIResponse(response: any): response is AIResponse {
  return (
    response &&
    typeof response === 'object' &&
    'type' in response &&
    'message' in response &&
    Object.values(RESPONSE_TYPES).includes(response.type)
  );
}

/**
 * Type guards for specific response types
 */
export function isTrackListResponse(
  response: AIResponse
): response is TrackListResponse {
  return response.type === 'track_list';
}

export function isPlaylistResponse(
  response: AIResponse
): response is PlaylistResponse {
  return response.type === 'playlist';
}

export function isPlaylistGridResponse(
  response: AIResponse
): response is PlaylistGridResponse {
  return response.type === 'playlist_grid';
}

export function isArtistResponse(
  response: AIResponse
): response is ArtistResponse {
  return response.type === 'artist';
}

export function isSearchResultsResponse(
  response: AIResponse
): response is SearchResultsResponse {
  return response.type === 'search_results';
}

export function isActionResponse(
  response: AIResponse
): response is ActionResponse {
  return response.type === 'action';
}

export function isTextResponse(response: AIResponse): response is TextResponse {
  return response.type === 'text';
}

export function isGenreListResponse(
  response: AIResponse
): response is GenreListResponse {
  return response.type === 'genre_list';
}
