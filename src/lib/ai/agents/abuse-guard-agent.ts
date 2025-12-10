import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import {
  logUnprocessedQuery,
  type UnprocessedReason,
} from '@/lib/ai/unprocessed-query-logger';
import {
  MALICIOUS_KEYWORDS,
  OFF_TOPIC_KEYWORDS,
  MUSIC_KEYWORDS,
} from './router-keywords';
import { ABUSE_GUARD_RESPONSES } from './agent-prompts';

export class AbuseGuardAgent extends BaseAgent {
  /**
   * Create a new AbuseGuardAgent instance
   */
  constructor() {
    super('AbuseGuardAgent', '');
  }

  /**
   * Process potentially abusive or non-music queries
   * @param message - User message to check
   * @param context - Optional agent context (userId for logging)
   * @returns Agent response with sarcastic refusal message
   */
  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    const reason = this.detectReason(message.toLowerCase());
    const response = this.buildResponse(reason);

    await logUnprocessedQuery({
      userId: context?.userId,
      message,
      response,
      agent: 'AbuseGuardAgent',
      reason,
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
   * Detect the reason for blocking a query
   * @param lowerMessage - Lowercased user message
   * @returns UnprocessedReason enum value
   */
  private detectReason(lowerMessage: string): UnprocessedReason {
    const isMalicious = MALICIOUS_KEYWORDS.some(keyword =>
      lowerMessage.includes(keyword)
    );
    if (isMalicious) {
      return 'malicious';
    }

    const referencesMusic = MUSIC_KEYWORDS.some(keyword =>
      lowerMessage.includes(keyword)
    );

    if (!referencesMusic) {
      const isNonMusic = OFF_TOPIC_KEYWORDS.some(keyword =>
        lowerMessage.includes(keyword)
      );
      if (isNonMusic || lowerMessage.length > 0) {
        return 'non_music';
      }
    }

    return 'other';
  }

  /**
   * Build appropriate response message based on reason
   * @param reason - UnprocessedReason enum value
   * @returns Sarcastic but non-insulting refusal message
   */
  private buildResponse(reason: UnprocessedReason): string {
    switch (reason) {
      case 'malicious':
        return ABUSE_GUARD_RESPONSES.malicious;
      case 'non_music':
        return ABUSE_GUARD_RESPONSES.non_music;
      default:
        return ABUSE_GUARD_RESPONSES.default;
    }
  }
}
