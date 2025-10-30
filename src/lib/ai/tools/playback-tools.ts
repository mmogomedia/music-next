/**
 * Playback Tools
 *
 * LangChain tools for creating playback actions that can be executed by the client.
 * These tools return action objects that the frontend can execute.
 *
 * @module PlaybackTools
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { Action } from '@/types/ai-responses';

/**
 * Create a play track action
 */
export const createPlayTrackActionTool = new DynamicStructuredTool({
  name: 'create_play_track_action',
  description:
    'Create an action to play a specific track. Returns a play action object.',
  schema: z.object({
    trackId: z.string().describe('The unique ID of the track to play'),
    label: z
      .string()
      .optional()
      .describe('Optional action label (defaults to "Play [Track Name]")'),
  }),
  func: async ({ trackId, label }) => {
    try {
      const action: Action = {
        type: 'play_track',
        label: label || 'Play Track',
        data: {
          trackId,
        },
      };

      return JSON.stringify({ action, message: 'Track will be played' });
    } catch (error) {
      console.error('Error in createPlayTrackActionTool:', error);
      return JSON.stringify({
        error: 'Failed to create play action',
        action: null,
      });
    }
  },
});

/**
 * Create a play playlist action
 */
export const createPlayPlaylistActionTool = new DynamicStructuredTool({
  name: 'create_play_playlist_action',
  description:
    'Create an action to play a specific playlist. Returns a play playlist action object.',
  schema: z.object({
    playlistId: z.string().describe('The unique ID of the playlist to play'),
    label: z
      .string()
      .optional()
      .describe('Optional action label (defaults to "Play [Playlist Name]")'),
  }),
  func: async ({ playlistId, label }) => {
    try {
      const action: Action = {
        type: 'play_playlist',
        label: label || 'Play Playlist',
        data: {
          playlistId,
        },
      };

      return JSON.stringify({ action, message: 'Playlist will be played' });
    } catch (error) {
      console.error('Error in createPlayPlaylistActionTool:', error);
      return JSON.stringify({
        error: 'Failed to create play playlist action',
        action: null,
      });
    }
  },
});

/**
 * Create a queue add action
 */
export const createQueueAddActionTool = new DynamicStructuredTool({
  name: 'create_queue_add_action',
  description: 'Create an action to add tracks to the playback queue.',
  schema: z.object({
    trackIds: z
      .array(z.string())
      .describe('Array of track IDs to add to the queue'),
    label: z
      .string()
      .optional()
      .describe('Optional action label (defaults to "Add to Queue")'),
  }),
  func: async ({ trackIds, label }) => {
    try {
      const action: Action = {
        type: 'queue_add',
        label:
          label ||
          `Add ${trackIds.length} Track${trackIds.length > 1 ? 's' : ''} to Queue`,
        data: {
          trackIds,
        },
      };

      return JSON.stringify({
        action,
        message: 'Tracks will be added to queue',
      });
    } catch (error) {
      console.error('Error in createQueueAddActionTool:', error);
      return JSON.stringify({
        error: 'Failed to create queue add action',
        action: null,
      });
    }
  },
});

/**
 * Create a shuffle action
 */
export const createShuffleActionTool = new DynamicStructuredTool({
  name: 'create_shuffle_action',
  description: 'Create an action to shuffle the current playlist or queue.',
  schema: z.object({
    label: z
      .string()
      .optional()
      .describe('Optional action label (defaults to "Shuffle")'),
  }),
  func: async ({ label }) => {
    try {
      const action: Action = {
        type: 'shuffle',
        label: label || 'Shuffle',
        data: {},
      };

      return JSON.stringify({ action, message: 'Playback will be shuffled' });
    } catch (error) {
      console.error('Error in createShuffleActionTool:', error);
      return JSON.stringify({
        error: 'Failed to create shuffle action',
        action: null,
      });
    }
  },
});

/**
 * Export all playback tools as an array
 */
export const playbackTools = [
  createPlayTrackActionTool,
  createPlayPlaylistActionTool,
  createQueueAddActionTool,
  createShuffleActionTool,
];
