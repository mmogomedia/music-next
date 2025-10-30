import {
  AIServiceFactory,
  AIService,
  AIConfig,
  AIProvider,
} from '@/types/ai-service';
import { OpenAIService } from './openai-service';
import { AnthropicService } from './anthropic-service';

export class AIServiceFactoryImpl implements AIServiceFactory {
  private static instance: AIServiceFactoryImpl;
  private services: Map<AIProvider, AIService> = new Map();

  private constructor() {}

  static getInstance(): AIServiceFactoryImpl {
    if (!AIServiceFactoryImpl.instance) {
      AIServiceFactoryImpl.instance = new AIServiceFactoryImpl();
    }
    return AIServiceFactoryImpl.instance;
  }

  createService(provider: AIProvider, config?: Partial<AIConfig>): AIService {
    const fullConfig = this.getDefaultConfig(provider, config);

    // Check if service already exists with same config
    const existingService = this.services.get(provider);
    if (existingService && this.isSameConfig(existingService, fullConfig)) {
      return existingService;
    }

    let service: AIService;

    switch (provider) {
      case 'openai':
        service = new OpenAIService(fullConfig);
        break;
      case 'anthropic':
        service = new AnthropicService(fullConfig);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    this.services.set(provider, service);
    return service;
  }

  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];

    // Check OpenAI
    if (process.env.OPENAI_API_KEY) {
      providers.push('openai');
    }

    // Check Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      providers.push('anthropic');
    }

    return providers;
  }

  isProviderAvailable(provider: AIProvider): boolean {
    return this.getAvailableProviders().includes(provider);
  }

  private getDefaultConfig(
    provider: AIProvider,
    config?: Partial<AIConfig>
  ): AIConfig {
    const defaults: Record<AIProvider, Partial<AIConfig>> = {
      openai: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        apiKey: process.env.OPENAI_API_KEY || '',
      },
      anthropic: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        temperature: 0.7,
        maxTokens: 1000,
        apiKey: process.env.ANTHROPIC_API_KEY || '',
      },
      google: {
        provider: 'google',
        model: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 1000,
        apiKey: process.env.GOOGLE_API_KEY || '',
      },
      cohere: {
        provider: 'cohere',
        model: 'command',
        temperature: 0.7,
        maxTokens: 1000,
        apiKey: process.env.COHERE_API_KEY || '',
      },
    };

    return {
      ...defaults[provider],
      ...config,
    } as AIConfig;
  }

  private isSameConfig(service: AIService, config: AIConfig): boolean {
    // Simple check - in a real implementation, you might want to compare more fields
    return service.getProvider() === config.provider;
  }
}

// Export singleton instance
export const aiServiceFactory = AIServiceFactoryImpl.getInstance();

