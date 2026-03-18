import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { logUnprocessedQuery } from '@/lib/ai/unprocessed-query-logger';
import { INDUSTRY_INFO_RESPONSE } from './agent-prompts';

export class IndustryInfoAgent extends BaseAgent {
  /**
   * Create a new IndustryInfoAgent instance
   */
  constructor() {
    super('IndustryInfoAgent', '');
  }

  /**
   * Process music industry knowledge queries
   * @param message - User message asking about music industry topics
   * @param context - Optional agent context (userId for logging)
   * @returns Agent response informing user the feature is under development
   */
  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    const response = INDUSTRY_INFO_RESPONSE;

    await logUnprocessedQuery({
      userId: context?.userId,
      message,
      response,
      agent: 'IndustryInfoAgent',
      reason: 'knowledge_feature_not_ready',
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
}
