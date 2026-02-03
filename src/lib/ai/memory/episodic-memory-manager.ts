import { prisma } from '@/lib/db';
import { embeddingService } from './embedding-service';

export interface EpisodicMemory {
  id: string;
  summary: string;
  importance: number;
  similarity: number;
  startTime: Date;
  endTime: Date;
}

export class EpisodicMemoryManager {
  /**
   * Store conversation segment with embedding
   */
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
    const { userId, conversationId, messages } = params;

    if (messages.length === 0) return;

    try {
      // Create summary of messages
      const summary = this.summarizeMessages(messages);

      // Generate embedding
      const embeddingVector = await embeddingService.embedText(summary);

      // Calculate importance score
      const importance = this.calculateImportance(messages);

      // Get the last message ID to store with the embedding
      const lastMessage = messages[messages.length - 1];

      // Store in database using raw SQL for vector insertion
      await prisma.$executeRaw`
        INSERT INTO conversation_embeddings (
          id, conversation_id, user_id, message_id, summary,
          embedding, importance, message_count, start_time, end_time, created_at
        ) VALUES (
          gen_random_uuid()::text,
          ${conversationId},
          ${userId},
          ${lastMessage.id},
          ${summary},
          ${embeddingVector}::vector(1536),
          ${importance},
          ${messages.length},
          ${messages[0].timestamp},
          ${messages[messages.length - 1].timestamp},
          NOW()
        )
      `;

      console.error('[EpisodicMemory] Stored conversation segment', {
        userId,
        conversationId,
        messageCount: messages.length,
        importance,
      });
    } catch (error) {
      console.error('[EpisodicMemory] Failed to store memory:', error);
      // Non-blocking: don't throw
    }
  }

  /**
   * Retrieve relevant memories using semantic search
   */
  async retrieveRelevantMemories(params: {
    userId: string;
    query: string;
    limit?: number;
    minImportance?: number;
  }): Promise<EpisodicMemory[]> {
    const { userId, query, limit = 5, minImportance = 0.3 } = params;

    try {
      // Generate query embedding
      const queryEmbedding = await embeddingService.embedText(query);

      // Semantic search using pgvector
      const results = await prisma.$queryRaw<
        Array<{
          id: string;
          summary: string;
          importance: number;
          similarity: number;
          start_time: Date;
          end_time: Date;
        }>
      >`
        SELECT
          id,
          summary,
          importance,
          1 - (embedding <=> ${queryEmbedding}::vector(1536)) as similarity,
          start_time,
          end_time
        FROM conversation_embeddings
        WHERE user_id = ${userId}
          AND importance >= ${minImportance}
        ORDER BY
          embedding <=> ${queryEmbedding}::vector(1536)
        LIMIT ${limit}
      `;

      return results.map(r => ({
        id: r.id,
        summary: r.summary,
        importance: r.importance,
        similarity: r.similarity,
        startTime: r.start_time,
        endTime: r.end_time,
      }));
    } catch (error) {
      console.error('[EpisodicMemory] Failed to retrieve memories:', error);
      return [];
    }
  }

  /**
   * Summarize messages into concise text
   */
  private summarizeMessages(
    messages: Array<{ role: string; content: string }>
  ): string {
    // Simple extractive summary (can be enhanced with LLM summarization)
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    const userQuery = userMessages.map(m => m.content).join(' ');
    const assistantResponse = assistantMessages.map(m => m.content).join(' ');

    // Truncate to reasonable length
    const maxLength = 500;
    const combined = `Q: ${userQuery} A: ${assistantResponse}`;

    return combined.length > maxLength
      ? `${combined.slice(0, maxLength)}...`
      : combined;
  }

  /**
   * Calculate importance score for messages
   */
  private calculateImportance(
    messages: Array<{ role: string; content: string }>
  ): number {
    let score = 0.5; // Base score

    // Factor 1: Has entities (artist names, track titles)
    const hasEntities = messages.some(m => this.containsEntities(m.content));
    if (hasEntities) score += 0.2;

    // Factor 2: User asked a question
    const hasQuestion = messages.some(
      m => m.role === 'user' && m.content.includes('?')
    );
    if (hasQuestion) score += 0.1;

    // Factor 3: Long conversation segment
    if (messages.length >= 4) score += 0.1;

    // Factor 4: Contains preference indicators
    const hasPreference = messages.some(m =>
      /\b(love|like|prefer|favorite|enjoy|hate|dislike)\b/i.test(m.content)
    );
    if (hasPreference) score += 0.2;

    return Math.min(1.0, score);
  }

  /**
   * Check if text contains entities
   */
  private containsEntities(text: string): boolean {
    // Simple heuristic: capitalized words (can be enhanced with NER)
    const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    return capitalizedWords !== null && capitalizedWords.length > 0;
  }
}

export const episodicMemoryManager = new EpisodicMemoryManager();
