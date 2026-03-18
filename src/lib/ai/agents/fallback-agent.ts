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
        actions: [
          {
            type: 'send_message',
            label: 'Search for something',
            data: { message: 'Search for music' },
          },
          {
            type: 'send_message',
            label: 'Show trending',
            data: { message: "Show me what's trending" },
          },
          {
            type: 'send_message',
            label: 'Get help',
            data: { message: 'What can you help me with?' },
          },
        ],
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
      return "Just ask me in natural language — I'll find the music for you.";
    }

    return "I didn't quite catch that. Try one of these instead:";
  }
}
