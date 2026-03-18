import type {
  EpisodicMemoryManager,
  EpisodicMemory,
} from './episodic-memory-manager';
import type { SemanticMemoryManager } from './semantic-memory-manager';
import type { ILogger } from './interfaces/logger';
import type { MemoryConfig } from './config';

export interface EnhancedContext {
  recentMessages: string;
  relevantMemories: EpisodicMemory[];
  preferences: {
    genres: string[];
    artists: string[];
    moods: string[];
  };
  tokenCount: number;
  memoryRetrievalTime: number;
}

export class MemoryOrchestrator {
  constructor(
    private episodic: EpisodicMemoryManager, // eslint-disable-line no-unused-vars
    private semantic: SemanticMemoryManager, // eslint-disable-line no-unused-vars
    private logger: ILogger, // eslint-disable-line no-unused-vars
    private config: MemoryConfig // eslint-disable-line no-unused-vars
  ) {}

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
      maxTokens = this.config.maxContextTokens,
    } = params;

    const startTime = Date.now();

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
      const [relevantMemories, genrePrefs, artistPrefs, moodPrefs] =
        await Promise.all([
          this.episodic.retrieveRelevantMemories({
            userId,
            query: currentMessage,
            limit: this.config.episodicRetrievalLimit,
            minImportance: this.config.episodicMinImportance,
          }),
          this.semantic.getTopPreferences({
            userId,
            type: 'GENRE',
            limit: this.config.genrePrefsLimit,
          }),
          this.semantic.getTopPreferences({
            userId,
            type: 'ARTIST',
            limit: this.config.artistPrefsLimit,
          }),
          this.semantic.getTopPreferences({
            userId,
            type: 'MOOD',
            limit: this.config.moodPrefsLimit,
          }),
        ]);

      const recentMessagesText = this.formatRecentMessages(
        recentMessages,
        maxTokens * 0.4
      );
      const memoriesText = this.formatMemories(
        relevantMemories,
        maxTokens * 0.3
      );
      const preferencesText = this.formatPreferences(
        { genres: genrePrefs, artists: artistPrefs, moods: moodPrefs },
        maxTokens * 0.3
      );

      const totalTokens =
        this.estimateTokens([{ role: 'system', content: recentMessagesText }]) +
        this.estimateTokens([{ role: 'system', content: memoriesText }]) +
        this.estimateTokens([{ role: 'system', content: preferencesText }]);

      this.logger.debug('[MemoryOrchestrator] Built enhanced context', {
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
      this.logger.error('[MemoryOrchestrator] Failed to build context:', error);

      return {
        recentMessages: this.formatRecentMessages(recentMessages, maxTokens),
        relevantMemories: [],
        preferences: { genres: [], artists: [], moods: [] },
        tokenCount: this.estimateTokens(recentMessages),
        memoryRetrievalTime: Date.now() - startTime,
      };
    }
  }

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
      await this.episodic.storeMemory({ userId, conversationId, messages });

      await this.semantic.extractPreferencesFromText({
        userId,
        text: userMessage,
        explicit: false,
      });

      this.logger.debug('[MemoryOrchestrator] Stored conversation', {
        userId,
        conversationId,
        messageCount: messages.length,
      });
    } catch (error) {
      this.logger.error(
        '[MemoryOrchestrator] Failed to store conversation:',
        error
      );
      // Non-blocking: don't throw
    }
  }

  private formatRecentMessages(
    messages: Array<{ role: string; content: string }>,
    maxTokens: number
  ): string {
    if (messages.length === 0) return '';

    const formatted = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const estimatedTokens = this.estimateTokens(messages);

    if (estimatedTokens > maxTokens) {
      const ratio = maxTokens / estimatedTokens;
      const charsToKeep = Math.floor(formatted.length * ratio);
      return formatted.slice(-charsToKeep);
    }

    return formatted;
  }

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

    const maxChars = maxTokens * 4;
    return formatted.length > maxChars
      ? `${formatted.slice(0, maxChars)}...`
      : formatted;
  }

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

  private estimateTokens(
    messages: Array<{ role: string; content: string }>
  ): number {
    const totalChars = messages.reduce(
      (sum, m) => sum + m.role.length + m.content.length,
      0
    );
    return Math.ceil(totalChars / 4);
  }
}
