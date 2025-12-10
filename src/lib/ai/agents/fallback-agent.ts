import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { logUnprocessedQuery } from '@/lib/ai/unprocessed-query-logger';

/**
 * Fallback Agent
 *
 * Handles queries that don't match any specific music intent.
 * Provides helpful feedback directing users to music-related queries.
 * Does NOT use LLM to answer general knowledge questions.
 */
export class FallbackAgent extends BaseAgent {
  /**
   * Create a new FallbackAgent instance
   */
  constructor() {
    super('FallbackAgent', '');
  }

  /**
   * Process queries that don't match any specific intent
   * @param message - User message
   * @param context - Optional agent context (userId for logging)
   * @returns Agent response with helpful message directing to music queries
   */
  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    const isMetaQuestion = this.isMetaQuestion(message);
    const response = this.buildResponse(isMetaQuestion);

    await logUnprocessedQuery({
      userId: context?.userId,
      message,
      response,
      agent: 'FallbackAgent',
      reason: 'unsupported_query',
    });

    return {
      message: response,
      data: {
        type: 'text',
        message: response,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Check if query is a meta-question about the system
   */
  private isMetaQuestion(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return /\b(how can|how do|how to|what can|what does|where can|where do)\s+(i|you|we)\s+.*\b(search|find|use|play|listen|discover|here|this)\b/i.test(
      lowerMessage
    );
  }

  /**
   * Build helpful response message
   * Directs users to music-related queries without using LLM
   * @param isMetaQuestion - Whether this is a meta-question about the system
   * @returns Helpful message with examples
   */
  private buildResponse(isMetaQuestion: boolean): string {
    if (isMetaQuestion) {
      return `You can search for music by simply asking me! Just type what you're looking for in natural language. For example:

• **Search for songs**: "Play Amapiano tracks" or "Find songs by Kabza De Small"
• **Search by mood**: "Show me upbeat music" or "Find chill songs"
• **Search by artist**: "Play music by Major League DJz" or "Show me Uncle Waffles songs"
• **Search by genre**: "Find Afrobeats music" or "Show me Gospel tracks"

Just type your request in the chat box and I'll help you discover the music you're looking for!`;
    }

    return `I'm here to help you discover and enjoy South African music! I can help you with:

• Finding songs, artists, or playlists
• Playing music and managing your queue
• Getting personalized recommendations
• Learning about music genres and artists

Try asking me things like:
- "Play Amapiano tracks"
- "Show me songs by Kabza De Small"
- "Find upbeat music for a party"
- "Recommend some new artists"

What would you like to explore?`;
  }
}
