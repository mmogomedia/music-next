import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { searchArticlesTool } from '@/lib/ai/tools/article-tools';

const HELP_ACTIONS = [
  {
    type: 'send_message' as const,
    label: 'Find music',
    icon: '🎵',
    data: { message: "I'm looking for music" },
  },
  {
    type: 'send_message' as const,
    label: 'Get recommendations',
    icon: '✨',
    data: { message: 'Recommend something for me' },
  },
  {
    type: 'send_message' as const,
    label: 'Browse genres',
    icon: '🎸',
    data: { message: 'Show me all genres' },
  },
  {
    type: 'send_message' as const,
    label: 'My taste profile',
    icon: '👤',
    data: { message: 'What music do I like?' },
  },
  {
    type: 'send_message' as const,
    label: 'Trending now',
    icon: '🔥',
    data: { message: "What's trending?" },
  },
];

/**
 * Help Agent
 *
 * Handles queries about how to use Flemoji.
 * Provides helpful information about system features and usage.
 */
export class HelpAgent extends BaseAgent {
  /**
   * Create a new HelpAgent instance
   */
  constructor() {
    super('HelpAgent', '');
  }

  /**
   * Process help queries about using Flemoji
   * @param message - User message asking about system usage
   * @param context - Optional agent context
   * @returns Agent response with helpful information about using Flemoji
   */
  async process(
    message: string,
    _context?: AgentContext
  ): Promise<AgentResponse> {
    // Check if the query is about music business / industry knowledge
    const isKnowledgeQuery =
      /royalt|capasso|samro|isrc|distribut|streaming income|music rights|how (do|can) (i|artists?)|what is (an? )?(isrc|capasso|samro|royalt)/i.test(
        message
      );

    if (isKnowledgeQuery) {
      try {
        const result = await searchArticlesTool.invoke({
          query: message,
          limit: 3,
        });
        const parsed = JSON.parse(result);
        if (parsed.articles?.length > 0) {
          const articleList = parsed.articles
            .map(
              (a: any) =>
                `- [${a.title}](/learn/${a.slug}) (${a.readTime} min read)`
            )
            .join('\n');
          const response = `Here are some articles that may help:\n\n${articleList}`;
          return {
            message: response,
            data: {
              type: 'text',
              message: response,
              timestamp: new Date(),
              actions: HELP_ACTIONS,
            },
          };
        }
      } catch {
        // Fall through to default response
      }
    }

    const response = this.buildHelpResponse(message);

    return {
      message: response,
      data: {
        type: 'text',
        message: response,
        timestamp: new Date(),
        actions: HELP_ACTIONS,
      },
    };
  }

  /**
   * Build helpful response based on the question
   * @param message - User's help question
   * @returns Helpful response message
   */
  private buildHelpResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Search/Find related questions
    if (
      /\b(search|find|look for|discover|browse)\b/i.test(lowerMessage) ||
      /\b(how|what|where)\s+(can|do|to)\s+(i|you)\s+(search|find|look|discover|browse)/i.test(
        lowerMessage
      )
    ) {
      return 'Search by genre, artist, mood, or title — just ask in natural language.';
    }

    // Play/Listen related questions
    if (
      /\b(play|listen|hear|stream)\b/i.test(lowerMessage) ||
      /\b(how|what|where)\s+(can|do|to)\s+(i|you)\s+(play|listen|hear|stream)/i.test(
        lowerMessage
      )
    ) {
      return "Ask me to play anything — a track, genre, artist, or mood — and I'll find it.";
    }

    // General "what can you do" questions
    if (
      /\b(what|which)\s+(can|does|do)\s+(you|this|it|the system|flemoji)\s+(do|help|offer|provide|support)/i.test(
        lowerMessage
      ) ||
      /\b(what|how)\s+(are|is)\s+(you|this|it|the system|flemoji)/i.test(
        lowerMessage
      )
    ) {
      return 'I help you discover and play South African music. What would you like to do?';
    }

    // Navigation/Usage questions
    if (
      /\b(how|where|what)\s+(to|can|do|is)\s+(use|navigate|access|get started|begin)/i.test(
        lowerMessage
      ) ||
      /\b(getting started|how to use|user guide|tutorial|help me)/i.test(
        lowerMessage
      )
    ) {
      return 'Just type what you want in natural language — a genre, artist, mood, or question.';
    }

    // Default help response
    return "I'm your music assistant for Flemoji. Pick something below to get started:";
  }
}
