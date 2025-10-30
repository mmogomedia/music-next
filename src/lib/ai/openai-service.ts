import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage as LangChainMessage } from '@langchain/core/messages';
import { BaseAIService } from './base-service';
import { AIConfig, AIMessage, AIResponse } from '@/types/ai-service';

export class OpenAIService extends BaseAIService {
  private client: ChatOpenAI;

  constructor(config: AIConfig) {
    super(config);
    this.validateConfig(config);
    
    this.client = new ChatOpenAI({
      modelName: config.model,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      openAIApiKey: config.apiKey,
      configuration: {
        baseURL: config.baseURL,
      },
    });
  }

  async chat(messages: AIMessage[], config?: Partial<AIConfig>): Promise<AIResponse> {
    try {
      const mergedConfig = { ...this.config, ...config };
      const formattedMessages = this.formatMessages(messages);
      
      const langchainMessages: LangChainMessage[] = formattedMessages.map(msg => {
        if (msg.role === 'system') {
          return new SystemMessage(msg.content);
        }
        return new HumanMessage(msg.content);
      });

      const response = await this.client.invoke(langchainMessages);
      const usage = response.response_metadata?.tokenUsage;

      return {
        content: response.content as string,
        usage: usage ? {
          promptTokens: usage.promptTokens || 0,
          completionTokens: usage.completionTokens || 0,
          totalTokens: usage.totalTokens || 0,
        } : undefined,
        model: mergedConfig.model,
        provider: 'openai',
      };
    } catch (error) {
      throw this.createError(
        'OpenAI API error',
        'OPENAI_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  isAvailable(): boolean {
    return !!this.config.apiKey && !!this.config.model;
  }
}

