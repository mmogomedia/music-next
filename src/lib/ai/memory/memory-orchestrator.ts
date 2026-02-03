import {
  episodicMemoryManager,
  type EpisodicMemory,
} from './episodic-memory-manager';
import { semanticMemoryManager } from './semantic-memory-manager';

export interface EnhancedContext {
  // Conversation context
  recentMessages: string;
  relevantMemories: EpisodicMemory[];

  // User profile
  preferences: {
    genres: string[];
    artists: string[];
    moods: string[];
  };

  // Metadata
  tokenCount: number;
  memoryRetrievalTime: number;
}

export class MemoryOrchestrator {
  /**
   * Build enhanced context for AI request
   */
  async buildEnhancedContext(params: {
    userId?: string;
    conversationId?: string;
    currentMessage: string;
    recentMessages?: Array<{ role: string; content: string }>;
    maxTokens?: number;
  }): Promise<EnhancedContext> {
    const {
      userId,
      conversationId,
      currentMessage,
      recentMessages = [],
      maxTokens = 2000,
    } = params;

    const startTime = Date.now();

    // If no userId, return minimal context
    if (!userId) {
      return {
        recentMessages: this.formatRecentMessages(recentMessages, maxTokens),
        relevantMemories: [],
        preferences: { genres: [], artists: [], moods: [] },
        tokenCount: this.estimateTokens(recentMessages),
        memoryRetrievalTime: Date.now() - startTime,
      };
    }

    try {
      // Run retrievals in parallel
      const [relevantMemories, genrePrefs, artistPrefs, moodPrefs] =
        await Promise.all([
          // Retrieve relevant episodic memories
          episodicMemoryManager.retrieveRelevantMemories({
            userId,
            query: currentMessage,
            limit: 3,
            minImportance: 0.5,
          }),

          // Get top genre preferences
          semanticMemoryManager.getTopPreferences({
            userId,
            type: 'GENRE',
            limit: 5,
          }),

          // Get top artist preferences
          semanticMemoryManager.getTopPreferences({
            userId,
            type: 'ARTIST',
            limit: 5,
          }),

          // Get top mood preferences
          semanticMemoryManager.getTopPreferences({
            userId,
            type: 'MOOD',
            limit: 3,
          }),
        ]);

      // Assemble context
      const recentMessagesText = this.formatRecentMessages(
        recentMessages,
        maxTokens * 0.4
      );
      const memoriesText = this.formatMemories(
        relevantMemories,
        maxTokens * 0.3
      );
      const preferencesText = this.formatPreferences(
        {
          genres: genrePrefs,
          artists: artistPrefs,
          moods: moodPrefs,
        },
        maxTokens * 0.3
      );

      const totalTokens =
        this.estimateTokens([{ role: 'system', content: recentMessagesText }]) +
        this.estimateTokens([{ role: 'system', content: memoriesText }]) +
        this.estimateTokens([{ role: 'system', content: preferencesText }]);

      console.error('[MemoryOrchestrator] Built enhanced context', {
        userId,
        conversationId,
        memoriesRetrieved: relevantMemories.length,
        genrePrefs: genrePrefs.length,
        totalTokens,
        retrievalTime: Date.now() - startTime,
      });

      return {
        recentMessages: recentMessagesText,
        relevantMemories,
        preferences: {
          genres: genrePrefs,
          artists: artistPrefs,
          moods: moodPrefs,
        },
        tokenCount: totalTokens,
        memoryRetrievalTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[MemoryOrchestrator] Failed to build context:', error);

      // Fallback to basic context
      return {
        recentMessages: this.formatRecentMessages(recentMessages, maxTokens),
        relevantMemories: [],
        preferences: { genres: [], artists: [], moods: [] },
        tokenCount: this.estimateTokens(recentMessages),
        memoryRetrievalTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Store conversation in memory after completion
   */
  async storeConversation(params: {
    userId: string;
    conversationId: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      timestamp: Date;
    }>;
    userMessage: string;
  }): Promise<void> {
    const { userId, conversationId, messages, userMessage } = params;

    try {
      // Store episodic memory
      await episodicMemoryManager.storeMemory({
        userId,
        conversationId,
        messages,
      });

      // Extract and store preferences
      await semanticMemoryManager.extractPreferencesFromText({
        userId,
        text: userMessage,
        explicit: false,
      });

      console.error('[MemoryOrchestrator] Stored conversation', {
        userId,
        conversationId,
        messageCount: messages.length,
      });
    } catch (error) {
      console.error(
        '[MemoryOrchestrator] Failed to store conversation:',
        error
      );
      // Non-blocking: don't throw
    }
  }

  /**
   * Format recent messages for context
   */
  private formatRecentMessages(
    messages: Array<{ role: string; content: string }>,
    maxTokens: number
  ): string {
    if (messages.length === 0) return '';

    // Estimate tokens and truncate if needed
    const formatted = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const estimatedTokens = this.estimateTokens(messages);

    if (estimatedTokens > maxTokens) {
      // Take most recent messages that fit
      const ratio = maxTokens / estimatedTokens;
      const charsToKeep = Math.floor(formatted.length * ratio);
      return formatted.slice(-charsToKeep);
    }

    return formatted;
  }

  /**
   * Format episodic memories for context
   */
  private formatMemories(
    memories: EpisodicMemory[],
    maxTokens: number
  ): string {
    if (memories.length === 0) return '';

    const formatted = memories
      .map(
        (m, i) =>
          `Memory ${i + 1} (similarity: ${m.similarity.toFixed(2)}): ${m.summary}`
      )
      .join('\n\n');

    // Truncate if too long
    const maxChars = maxTokens * 4; // Rough estimate
    return formatted.length > maxChars
      ? `${formatted.slice(0, maxChars)}...`
      : formatted;
  }

  /**
   * Format preferences for context
   */
  private formatPreferences(
    prefs: { genres: string[]; artists: string[]; moods: string[] },
    _maxTokens: number
  ): string {
    const parts: string[] = [];

    if (prefs.genres.length > 0) {
      parts.push(`Favorite genres: ${prefs.genres.join(', ')}`);
    }

    if (prefs.artists.length > 0) {
      parts.push(`Favorite artists: ${prefs.artists.join(', ')}`);
    }

    if (prefs.moods.length > 0) {
      parts.push(`Preferred moods: ${prefs.moods.join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Estimate token count for messages
   */
  private estimateTokens(
    messages: Array<{ role: string; content: string }>
  ): number {
    // Rough estimate: 1 token ≈ 4 characters
    const totalChars = messages.reduce(
      (sum, m) => sum + m.role.length + m.content.length,
      0
    );
    return Math.ceil(totalChars / 4);
  }
}

export const memoryOrchestrator = new MemoryOrchestrator();
