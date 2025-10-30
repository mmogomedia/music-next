import {
  AIService,
  AIConfig,
  AIMessage,
  AIResponse,
  AIError,
  AIProvider,
} from '@/types/ai-service';

export abstract class BaseAIService implements AIService {
  protected config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  abstract chat(
    _messages: AIMessage[],
    _config?: Partial<AIConfig>
  ): Promise<AIResponse>;

  abstract isAvailable(): boolean;

  getProvider(): AIProvider {
    return this.config.provider;
  }

  protected validateConfig(config: AIConfig): void {
    if (!config.apiKey) {
      throw new Error(`API key is required for ${config.provider}`);
    }
    if (!config.model) {
      throw new Error(`Model is required for ${config.provider}`);
    }
  }

  protected createError(
    error: string,
    code: string,
    details?: string
  ): AIError {
    return {
      error,
      code,
      provider: this.config.provider,
      details,
    };
  }

  protected formatMessages(messages: AIMessage[]): AIMessage[] {
    return messages
      .map(msg => ({
        role: msg.role,
        content: msg.content.trim(),
      }))
      .filter(msg => msg.content.length > 0);
  }
}
