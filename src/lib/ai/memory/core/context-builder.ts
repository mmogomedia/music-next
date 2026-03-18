import type { ConversationStore } from './conversation-store';
import type { SemanticMemoryManager } from './semantic-memory-manager';
import type { MemoryConfig } from './config';

export interface BuiltContext {
  filters?: {
    genre?: string;
    province?: string;
  };
  summary?: string;
  metadata?: {
    previousIntent?: string;
  };
}

export class ContextBuilder {
  constructor(
    private conversation: ConversationStore, // eslint-disable-line no-unused-vars
    private semantic: SemanticMemoryManager, // eslint-disable-line no-unused-vars
    private config: MemoryConfig // eslint-disable-line no-unused-vars
  ) {}

  async buildContext(
    userId?: string,
    conversationId?: string
  ): Promise<BuiltContext> {
    if (!userId) return {};

    const [recent, topGenres] = await Promise.all([
      this.conversation.getConversation(
        userId,
        conversationId || '',
        this.config.recentMessageLimit
      ),
      this.semantic.getTopPreferences({ userId, type: 'GENRE', limit: 1 }),
    ]);

    const topGenre = topGenres[0];

    const summary = recent
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')
      .slice(-this.config.contextSummaryMaxChars);

    return {
      filters: topGenre ? { genre: topGenre } : undefined,
      summary,
    };
  }
}
