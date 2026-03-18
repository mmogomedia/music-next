import type {
  IStorageAdapter,
  EmbeddingSearchResult,
} from './interfaces/storage';
import type { IEmbeddingAdapter } from './interfaces/embedding';
import type { ILogger } from './interfaces/logger';
import type { MemoryConfig } from './config';

export interface EpisodicMemory {
  id: string;
  summary: string;
  importance: number;
  similarity: number;
  startTime: Date;
  endTime: Date;
}

export class EpisodicMemoryManager {
  constructor(
    private storage: IStorageAdapter, // eslint-disable-line no-unused-vars
    private embedder: IEmbeddingAdapter | null, // eslint-disable-line no-unused-vars
    private logger: ILogger, // eslint-disable-line no-unused-vars
    private config: MemoryConfig // eslint-disable-line no-unused-vars
  ) {}

  async storeMemory(params: {
    userId: string;
    conversationId: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      timestamp: Date;
    }>;
  }): Promise<void> {
    if (!this.embedder) return; // Episodic memory disabled when no embedder

    const { userId, conversationId, messages } = params;
    if (messages.length === 0) return;

    try {
      const summary = this.summarizeMessages(messages);
      const embeddingVector = await this.embedder.embed(summary);
      const importance = this.calculateImportance(messages);
      const lastMessage = messages[messages.length - 1];

      await this.storage.storeEmbedding({
        conversationId,
        userId,
        messageIds: [lastMessage.id],
        summary,
        embedding: embeddingVector,
        importance,
        messageCount: messages.length,
        startTime: messages[0].timestamp,
        endTime: lastMessage.timestamp,
      });

      this.logger.debug('[EpisodicMemory] Stored conversation segment', {
        userId,
        conversationId,
        messageCount: messages.length,
        importance,
      });
    } catch (error) {
      this.logger.error('[EpisodicMemory] Failed to store memory:', error);
      // Non-blocking: don't throw
    }
  }

  async retrieveRelevantMemories(params: {
    userId: string;
    query: string;
    limit?: number;
    minImportance?: number;
  }): Promise<EpisodicMemory[]> {
    if (!this.embedder) return []; // Episodic memory disabled

    const {
      userId,
      query,
      limit = this.config.episodicRetrievalLimit,
      minImportance = this.config.episodicMinImportance,
    } = params;

    try {
      const queryEmbedding = await this.embedder.embed(query);

      const results: EmbeddingSearchResult[] =
        await this.storage.searchEmbeddings({
          userId,
          queryEmbedding,
          limit,
          minImportance,
        });

      return results.map(r => ({
        id: r.id,
        summary: r.summary,
        importance: r.importance,
        similarity: r.similarity,
        startTime: r.startTime,
        endTime: r.endTime,
      }));
    } catch (error) {
      this.logger.error('[EpisodicMemory] Failed to retrieve memories:', error);
      return [];
    }
  }

  private summarizeMessages(
    messages: Array<{ role: string; content: string }>
  ): string {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    const userQuery = userMessages.map(m => m.content).join(' ');
    const assistantResponse = assistantMessages.map(m => m.content).join(' ');

    const combined = `Q: ${userQuery} A: ${assistantResponse}`;
    const maxLength = this.config.maxSummaryLength;

    return combined.length > maxLength
      ? `${combined.slice(0, maxLength)}...`
      : combined;
  }

  private calculateImportance(
    messages: Array<{ role: string; content: string }>
  ): number {
    let score = 0.5;

    const hasEntities = messages.some(m => this.containsEntities(m.content));
    if (hasEntities) score += 0.2;

    const hasQuestion = messages.some(
      m => m.role === 'user' && m.content.includes('?')
    );
    if (hasQuestion) score += 0.1;

    if (messages.length >= 4) score += 0.1;

    const hasPreference = messages.some(m =>
      /\b(love|like|prefer|favorite|enjoy|hate|dislike)\b/i.test(m.content)
    );
    if (hasPreference) score += 0.2;

    return Math.min(1.0, score);
  }

  private containsEntities(text: string): boolean {
    const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    return capitalizedWords !== null && capitalizedWords.length > 0;
  }
}
