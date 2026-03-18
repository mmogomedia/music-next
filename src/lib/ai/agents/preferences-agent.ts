/**
 * Preferences Agent
 *
 * Handles queries about a user's stored taste profile.
 * Returns an interactive card with genre, artist, and mood chips.
 *
 * @module PreferencesAgent
 */

import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { semanticMemoryManager } from '@/lib/ai/memory/bootstrap';
import { logger } from '@/lib/utils/logger';
import type { UserPreferencesResponse } from '@/types/ai-responses';

export class PreferencesAgent extends BaseAgent {
  constructor() {
    super('PreferencesAgent', '');
  }

  async process(
    _message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    const userId = context?.userId;

    if (!userId) {
      const noAuthResponse: UserPreferencesResponse = {
        type: 'user_preferences',
        message: 'Sign in to see your personal taste profile.',
        timestamp: new Date(),
        data: { genres: [], artists: [], moods: [], hasHistory: false },
      };
      return { message: noAuthResponse.message, data: noAuthResponse };
    }

    try {
      const [genrePrefs, artistPrefs, moodPrefs] = await Promise.all([
        semanticMemoryManager.getPreferences({
          userId,
          type: 'GENRE',
          limit: 12,
        }),
        semanticMemoryManager.getPreferences({
          userId,
          type: 'ARTIST',
          limit: 12,
        }),
        semanticMemoryManager.getPreferences({
          userId,
          type: 'MOOD',
          limit: 6,
        }),
      ]);

      const hasHistory =
        genrePrefs.length > 0 || artistPrefs.length > 0 || moodPrefs.length > 0;

      const summary = hasHistory
        ? `You've explored ${
            genrePrefs.length > 0
              ? genrePrefs
                  .slice(0, 3)
                  .map(g => g.entityName)
                  .join(', ')
              : 'some music'
          } and more. Here's your taste profile.`
        : "You haven't explored much music yet — let's change that!";

      const response: UserPreferencesResponse = {
        type: 'user_preferences',
        message: summary,
        timestamp: new Date(),
        data: {
          genres: genrePrefs.map(p => ({
            name: p.entityName,
            type: 'GENRE' as const,
            score: p.score,
            confidence: p.confidence,
          })),
          artists: artistPrefs.map(p => ({
            name: p.entityName,
            type: 'ARTIST' as const,
            score: p.score,
            confidence: p.confidence,
          })),
          moods: moodPrefs.map(p => ({
            name: p.entityName,
            type: 'MOOD' as const,
            score: p.score,
            confidence: p.confidence,
          })),
          hasHistory,
        },
      };

      return { message: summary, data: response };
    } catch (error) {
      logger.error('[PreferencesAgent] Failed to fetch preferences:', error);
      return {
        message: 'I had trouble fetching your preferences. Try again shortly.',
        data: {
          type: 'user_preferences',
          message: 'Failed to load preferences.',
          timestamp: new Date(),
          data: { genres: [], artists: [], moods: [], hasHistory: false },
        } as UserPreferencesResponse,
      };
    }
  }
}
