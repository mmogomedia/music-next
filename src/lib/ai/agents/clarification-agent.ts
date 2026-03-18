/**
 * Clarification Agent
 *
 * Handles ambiguous queries by asking clarifying questions with clickable options.
 * Uses user history to provide smart suggestions.
 *
 * @module ClarificationAgent
 */

import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import type {
  ClarificationResponse,
  ClarificationQuestion,
} from '@/types/ai-responses';
import { semanticMemoryManager } from '@/lib/ai/memory/bootstrap';
import { logger } from '@/lib/utils/logger';

interface MissingInfo {
  intent: boolean; // Missing: discovery/recommendation intent
  genre: boolean; // Missing: genre preference
  mood: boolean; // Missing: mood preference
}

/**
 * Clarification Agent
 *
 * Asks clarifying questions when user intent is ambiguous.
 */
export class ClarificationAgent extends BaseAgent {
  constructor() {
    super('ClarificationAgent', '');
  }

  /**
   * Process an ambiguous query and return clarification questions
   */
  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    try {
      // Analyze what information is missing
      const missingInfo = this.analyzeMissingInfo(message, context);

      // Get user history for smart suggestions
      const userGenres = context?.userId
        ? await this.getUserGenreHistory(context.userId)
        : [];

      // Get popular genres if no user history
      const popularGenres =
        userGenres.length === 0 ? await this.getPopularGenres() : [];

      // Build clarification questions
      const questions = await this.buildClarificationQuestions(
        missingInfo,
        userGenres,
        popularGenres,
        context
      );

      // Build message
      const messageText = this.buildClarificationMessage(
        userGenres,
        missingInfo,
        context
      );

      return {
        message: messageText,
        data: {
          questions,
          context: {
            detectedGenres: userGenres,
            previousIntent: context?.metadata?.previousIntent,
          },
          metadata: {
            requiresResponse: true,
            canSkip: true, // Allow skip with smart default
          },
        } as ClarificationResponse['data'],
      };
    } catch (error) {
      logger.error('ClarificationAgent error:', error);
      // Fallback: return basic clarification
      return {
        message: "I'd love to help! What would you like to do?",
        data: {
          questions: [this.buildBasicIntentQuestion()],
          metadata: {
            requiresResponse: true,
            canSkip: true,
          },
        } as ClarificationResponse['data'],
      };
    }
  }

  /**
   * Analyze what information is missing from the query
   */
  private analyzeMissingInfo(
    message: string,
    context?: AgentContext
  ): MissingInfo {
    const lowerMessage = message.toLowerCase();

    // Check for explicit intent keywords
    const hasIntentKeywords =
      /\b(find|search|show|list|browse|discover|recommend|suggest|play|start|queue)\b/.test(
        lowerMessage
      );

    // Check for genre mentions
    const hasGenre = this.hasGenreMention(lowerMessage);

    // Check for mood mentions
    const hasMood =
      /\b(lonely|sad|happy|excited|anxious|motivated|celebrating|focused|relaxed)\b/.test(
        lowerMessage
      );

    return {
      intent: !hasIntentKeywords && !context?.metadata?.previousIntent,
      genre: !hasGenre && !context?.filters?.genre,
      mood: !hasMood,
    };
  }

  /**
   * Check if message mentions a genre
   */
  private hasGenreMention(message: string): boolean {
    // This is a simple check - could be enhanced with actual genre list
    const commonGenres = [
      'amapiano',
      'afrobeat',
      'afro house',
      'hip hop',
      'r&b',
      'gospel',
      'house',
      'gqom',
    ];
    return commonGenres.some(genre => message.includes(genre));
  }

  /**
   * Get user's genre history from preferences
   */
  private async getUserGenreHistory(userId: string): Promise<string[]> {
    try {
      return await semanticMemoryManager.getTopPreferences({
        userId,
        type: 'GENRE',
        limit: 5,
      });
    } catch (error) {
      logger.error('Failed to get user genre history:', error);
      return [];
    }
  }

  /**
   * Get popular genres (fallback when no user history)
   */
  private async getPopularGenres(): Promise<string[]> {
    try {
      const { prisma } = await import('@/lib/db');
      const genres = await prisma.genre.findMany({
        where: { isActive: true },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        take: 5,
        select: { name: true },
      });

      return genres.map(g => g.name);
    } catch (error) {
      logger.error('Failed to get popular genres:', error);
      return ['Amapiano', 'Afrobeat', 'Hip Hop', 'R&B', 'House']; // Fallback
    }
  }

  /**
   * Build clarification questions based on missing info
   */
  private async buildClarificationQuestions(
    missingInfo: MissingInfo,
    userGenres: string[],
    popularGenres: string[],
    _context?: AgentContext
  ): Promise<ClarificationQuestion[]> {
    const questions: ClarificationQuestion[] = [];

    // Question 1: Intent (if missing)
    if (missingInfo.intent) {
      questions.push(this.buildBasicIntentQuestion());
    }

    // Question 2: Genre (if missing and intent is discovery/recommendation)
    // We'll add this conditionally after intent is selected
    // For now, if we have user history, show genre question with history highlighted
    if (
      missingInfo.genre &&
      (userGenres.length > 0 || popularGenres.length > 0)
    ) {
      questions.push(await this.buildGenreQuestion(userGenres, popularGenres));
    }

    return questions;
  }

  /**
   * Build basic intent question (what would you like to do?)
   */
  private buildBasicIntentQuestion(): ClarificationQuestion {
    return {
      id: 'intent',
      questionType: 'single_select',
      question: 'What would you like to do?',
      required: true,
      options: [
        {
          id: 'discover',
          label: 'Find music',
          value: 'discovery',
          icon: '🔍',
          metadata: { intent: 'discovery' },
        },
        {
          id: 'recommend',
          label: 'Get recommendations',
          value: 'recommendation',
          icon: '💡',
          metadata: { intent: 'recommendation' },
        },
      ],
    };
  }

  /**
   * Build genre question with user history highlighted
   */
  private async buildGenreQuestion(
    userGenres: string[],
    _popularGenres: string[]
  ): Promise<ClarificationQuestion> {
    // Get all available genres
    const allGenres = await this.getAllGenres();

    // Build options with user history highlighted
    const options = allGenres.map(genre => ({
      id: genre.slug,
      label: genre.name,
      value: genre.slug,
      metadata: { genre: genre.name },
      highlighted: userGenres.some(
        ug => ug.toLowerCase() === genre.name.toLowerCase()
      ),
    }));

    // Sort: highlighted (user history) first, then by name
    const sortedOptions = options.sort((a, b) => {
      if (a.highlighted && !b.highlighted) return -1;
      if (!a.highlighted && b.highlighted) return 1;
      return a.label.localeCompare(b.label);
    });

    // Take top 5 highlighted + top 5 others, or just top 10
    const topOptions = [
      ...sortedOptions.filter(o => o.highlighted).slice(0, 5),
      ...sortedOptions.filter(o => !o.highlighted).slice(0, 5),
    ].slice(0, 10);

    // Add "Browse all genres" option if we have more genres
    if (allGenres.length > 10) {
      topOptions.push({
        id: 'browse_all',
        label: 'Browse all genres',
        value: 'browse_all',
        metadata: { genre: 'all' },
        highlighted: false,
      });
    }

    return {
      id: 'genre',
      questionType: 'multiple_select',
      question:
        userGenres.length > 0
          ? `I see you've listened to ${userGenres.slice(0, 2).join(' and ')} before. What genre are you in the mood for?`
          : 'What genre are you in the mood for?',
      required: false, // Optional - user can skip
      options: topOptions,
      minSelections: 0,
      maxSelections: 3, // Allow up to 3 genres
    };
  }

  /**
   * Get all available genres from database
   */
  private async getAllGenres(): Promise<
    Array<{ id: string; name: string; slug: string }>
  > {
    try {
      const { prisma } = await import('@/lib/db');
      const genres = await prisma.genre.findMany({
        where: { isActive: true },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      return genres;
    } catch (error) {
      logger.error('Failed to get all genres:', error);
      return [];
    }
  }

  /**
   * Build clarification message based on context
   */
  private buildClarificationMessage(
    userGenres: string[],
    missingInfo: MissingInfo,
    context?: AgentContext
  ): string {
    if (userGenres.length > 0) {
      const genreList =
        userGenres.length === 1
          ? userGenres[0]
          : userGenres.length === 2
            ? `${userGenres[0]} and ${userGenres[1]}`
            : `${userGenres.slice(0, 2).join(', ')}, and more`;

      return `I see you've listened to ${genreList} before! Let me help you find what you're looking for.`;
    }

    if (context?.metadata?.previousIntent) {
      return "I'd love to help! Let me understand what you need.";
    }

    return "I'd love to help! What would you like to do?";
  }
}
