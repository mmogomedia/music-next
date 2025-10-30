'use client';

import { TextRenderer } from './text-renderer';
import { TrackListRenderer } from './track-list-renderer';
import { PlaylistRenderer } from './playlist-renderer';
import { PlaylistGridRenderer } from './playlist-grid-renderer';
import { ArtistRenderer } from './artist-renderer';
import { SearchResultsRenderer } from './search-results-renderer';
import { ActionExecutor } from './action-executor';
import type { AIResponse } from '@/types/ai-responses';
import { responseRegistry } from '@/lib/ai/response-registry';
import { useEffect } from 'react';

interface ResponseRendererProps {
  response: AIResponse;
  onPlayTrack?: (_trackId: string, _track: any) => void;
  onPlayPlaylist?: (_playlistId: string) => void;
  onViewArtist?: (_artistId: string) => void;
}

/**
 * Main AI response renderer that switches based on response type
 */
export function ResponseRenderer({
  response,
  onPlayTrack,
  onPlayPlaylist,
  onViewArtist,
}: ResponseRendererProps) {
  // Register components on mount if not already registered
  useEffect(() => {
    if (!responseRegistry.isRegistered('text')) {
      responseRegistry.register('text', {
        component: TextRenderer,
        promptTemplate: 'Use for simple conversational messages',
        schema: {
          type: 'object',
          properties: {
            type: { type: 'string', const: 'text' },
            message: { type: 'string' },
          },
          required: ['type', 'message'],
        },
        metadata: {
          description: 'Simple text message',
          category: 'info',
          priority: 1,
        },
      });
    }

    if (!responseRegistry.isRegistered('track_list')) {
      responseRegistry.register('track_list', {
        component: TrackListRenderer,
        promptTemplate: 'Use when showing multiple tracks',
        schema: {
          type: 'object',
          properties: {
            type: { type: 'string', const: 'track_list' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                tracks: { type: 'array' },
              },
            },
          },
          required: ['type', 'message', 'data'],
        },
        metadata: {
          description: 'List of music tracks',
          category: 'discovery',
          priority: 10,
        },
      });
    }

    if (!responseRegistry.isRegistered('playlist')) {
      responseRegistry.register('playlist', {
        component: PlaylistRenderer,
        promptTemplate: 'Use when showing a single playlist',
        schema: {
          type: 'object',
          properties: {
            type: { type: 'string', const: 'playlist' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
          required: ['type', 'message', 'data'],
        },
        metadata: {
          description: 'Single playlist',
          category: 'discovery',
          priority: 9,
        },
      });
    }

    if (!responseRegistry.isRegistered('playlist_grid')) {
      responseRegistry.register('playlist_grid', {
        component: PlaylistGridRenderer,
        promptTemplate: 'Use when showing multiple playlists',
        schema: {
          type: 'object',
          properties: {
            type: { type: 'string', const: 'playlist_grid' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
          required: ['type', 'message', 'data'],
        },
        metadata: {
          description: 'Grid of playlists',
          category: 'discovery',
          priority: 8,
        },
      });
    }

    if (!responseRegistry.isRegistered('artist')) {
      responseRegistry.register('artist', {
        component: ArtistRenderer,
        promptTemplate: 'Use when showing an artist profile',
        schema: {
          type: 'object',
          properties: {
            type: { type: 'string', const: 'artist' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
          required: ['type', 'message', 'data'],
        },
        metadata: {
          description: 'Artist profile',
          category: 'discovery',
          priority: 9,
        },
      });
    }

    if (!responseRegistry.isRegistered('search_results')) {
      responseRegistry.register('search_results', {
        component: SearchResultsRenderer,
        promptTemplate: 'Use for mixed search results',
        schema: {
          type: 'object',
          properties: {
            type: { type: 'string', const: 'search_results' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
          required: ['type', 'message', 'data'],
        },
        metadata: {
          description: 'Mixed search results',
          category: 'discovery',
          priority: 7,
        },
      });
    }

    if (!responseRegistry.isRegistered('action')) {
      responseRegistry.register('action', {
        component: ActionExecutor,
        promptTemplate: 'Use for executing actions',
        schema: {
          type: 'object',
          properties: {
            type: { type: 'string', const: 'action' },
            message: { type: 'string' },
            action: { type: 'object' },
          },
          required: ['type', 'message', 'action'],
        },
        metadata: {
          description: 'Execute action',
          category: 'action',
          priority: 5,
        },
      });
    }
  }, []);

  // Get the registered handler for this response type
  const handler = responseRegistry.get(response.type);

  if (!handler) {
    console.error(`No renderer found for type: ${response.type}`);
    return (
      <div className='rounded-lg bg-red-50 dark:bg-red-900/20 p-4'>
        <p className='text-red-600 dark:text-red-400'>
          Unknown response type: {response.type}
        </p>
      </div>
    );
  }

  // Render using the registered component
  const Component = handler.component;

  return (
    <Component
      response={response}
      onPlayTrack={onPlayTrack}
      onPlayPlaylist={onPlayPlaylist}
      onViewArtist={onViewArtist}
    />
  );
}
