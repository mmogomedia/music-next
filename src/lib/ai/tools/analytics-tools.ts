/**
 * Analytics Tools
 *
 * LangChain tools for accessing music analytics and statistics.
 * These tools enable AI agents to provide data-driven recommendations.
 *
 * @module AnalyticsTools
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AnalyticsService } from '@/lib/services';

/**
 * Get genre statistics
 */
export const getGenreStatsTool = new DynamicStructuredTool({
  name: 'get_genre_stats',
  description:
    'Get statistics for a specific genre including track count, total plays, and top tracks.',
  schema: z.object({
    genre: z
      .string()
      .optional()
      .describe(
        'Genre name to get stats for. If not provided, returns all genres.'
      ),
  }),
  func: async ({ genre }) => {
    try {
      const stats = await AnalyticsService.getGenreStats(genre);

      return JSON.stringify({
        stats: stats.map(stat => ({
          genre: stat.genre,
          trackCount: stat.trackCount,
          totalPlays: stat.totalPlays,
          topTrack: stat.topTrack,
        })),
      });
    } catch (error) {
      console.error('Error in getGenreStatsTool:', error);
      return JSON.stringify({ error: 'Failed to get genre stats', stats: [] });
    }
  },
});

/**
 * Get province statistics
 */
export const getProvinceStatsTool = new DynamicStructuredTool({
  name: 'get_province_stats',
  description:
    'Get statistics for a specific province including artist count, track count, and total plays.',
  schema: z.object({
    province: z
      .string()
      .optional()
      .describe(
        'Province name to get stats for. If not provided, returns all provinces.'
      ),
  }),
  func: async ({ province }) => {
    try {
      const stats = await AnalyticsService.getProvinceStats(province);

      return JSON.stringify({
        stats: stats.map(stat => ({
          province: stat.province,
          artistCount: stat.artistCount,
          trackCount: stat.trackCount,
          totalPlays: stat.totalPlays,
        })),
      });
    } catch (error) {
      console.error('Error in getProvinceStatsTool:', error);
      return JSON.stringify({
        error: 'Failed to get province stats',
        stats: [],
      });
    }
  },
});

/**
 * Export all analytics tools as an array
 */
export const analyticsTools = [getGenreStatsTool, getProvinceStatsTool];
