import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { BaseAIService } from './base-service';
import { AIConfig, AIMessage, AIResponse } from '@/types/ai-service';

export class AnthropicService extends BaseAIService {
  private client: ChatAnthropic;

  constructor(config: AIConfig) {
    super(config);
    this.validateConfig(config);

    this.client = new ChatAnthropic({
      model: config.model,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      anthropicApiKey: config.apiKey,
    });
  }

  async chat(
    messages: AIMessage[],
    config?: Partial<AIConfig>
  ): Promise<AIResponse> {
    try {
      const mergedConfig = { ...this.config, ...config };
      const formattedMessages = this.formatMessages(messages);

      // Convert all messages to LangChain format including system messages
      const langchainMessages = formattedMessages.map(msg => {
        if (msg.role === 'system') {
          return new SystemMessage(msg.content);
        }
        return new HumanMessage(msg.content);
      });

      const response = await this.client.invoke(langchainMessages);

      const usage = response.response_metadata?.tokenUsage as any;

      return {
        content: response.content as string,
        usage: usage
          ? {
              promptTokens: usage.promptTokens || 0,
              completionTokens: usage.completionTokens || 0,
              totalTokens: usage.totalTokens || 0,
            }
          : undefined,
        model: mergedConfig.model,
        provider: 'anthropic',
      };
    } catch (error) {
      throw this.createError(
        'Anthropic API error',
        'ANTHROPIC_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  isAvailable(): boolean {
    return !!this.config.apiKey && !!this.config.model;
  }
}
