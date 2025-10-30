import { ChatAnthropic } from '@langchain/anthropic';
import {
  HumanMessage,
  SystemMessage,
  AIMessage as LangChainMessage,
} from '@langchain/core/messages';
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

      // Anthropic requires system message to be separate
      const systemMessage = formattedMessages.find(
        msg => msg.role === 'system'
      );
      const conversationMessages = formattedMessages.filter(
        msg => msg.role !== 'system'
      );

      const langchainMessages: LangChainMessage[] = conversationMessages.map(
        msg => new HumanMessage(msg.content)
      );

      // Create a new client instance with system message if provided
      const clientWithSystem = systemMessage?.content
        ? new ChatAnthropic({
            model: mergedConfig.model,
            temperature: mergedConfig.temperature || 0.7,
            maxTokens: mergedConfig.maxTokens || 1000,
            anthropicApiKey: mergedConfig.apiKey,
            system: systemMessage.content,
          })
        : this.client;

      const response = await clientWithSystem.invoke(langchainMessages);

      const usage = response.response_metadata?.tokenUsage;

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
