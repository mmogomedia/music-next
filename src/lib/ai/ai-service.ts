import { aiServiceFactory } from './ai-service-factory';
import {
  AIService,
  AIConfig,
  AIMessage,
  AIResponse,
  AIProvider,
} from '@/types/ai-service';

export class AIServiceManager {
  private static instance: AIServiceManager;
  private preferredProvider: AIProvider | null = null;

  private constructor() {
    // Set preferred provider based on available providers
    const availableProviders = aiServiceFactory.getAvailableProviders();
    if (availableProviders.length > 0) {
      this.preferredProvider = availableProviders[0];
    }
  }

  static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  setPreferredProvider(provider: AIProvider): void {
    if (aiServiceFactory.isProviderAvailable(provider)) {
      this.preferredProvider = provider;
    } else {
      throw new Error(`Provider ${provider} is not available`);
    }
  }

  getPreferredProvider(): AIProvider | null {
    return this.preferredProvider;
  }

  async chat(
    messages: AIMessage[],
    options?: {
      provider?: AIProvider;
      config?: Partial<AIConfig>;
      fallback?: boolean;
    }
  ): Promise<AIResponse> {
    const { provider, config, fallback = true } = options || {};

    // Determine which provider to use
    const targetProvider = provider || this.preferredProvider;

    if (!targetProvider) {
      throw new Error(
        'No AI provider available. Please configure at least one provider.'
      );
    }

    if (!aiServiceFactory.isProviderAvailable(targetProvider)) {
      if (fallback) {
        // Try to fallback to any available provider
        const availableProviders = aiServiceFactory.getAvailableProviders();
        if (availableProviders.length === 0) {
          throw new Error(
            'No AI providers are available. Please configure API keys.'
          );
        }
        return this.chat(messages, {
          provider: availableProviders[0],
          config,
          fallback: false,
        });
      } else {
        throw new Error(`Provider ${targetProvider} is not available`);
      }
    }

    try {
      const service = aiServiceFactory.createService(targetProvider, config);
      return await service.chat(messages, config);
    } catch (error) {
      if (fallback && provider) {
        // If we were using a specific provider and it failed, try fallback
        const availableProviders = aiServiceFactory.getAvailableProviders();
        const fallbackProvider = availableProviders.find(p => p !== provider);

        if (fallbackProvider) {
          console.warn(
            `Provider ${provider} failed, falling back to ${fallbackProvider}`
          );
          return this.chat(messages, {
            provider: fallbackProvider,
            config,
            fallback: false,
          });
        }
      }
      throw error;
    }
  }

  getAvailableProviders(): AIProvider[] {
    return aiServiceFactory.getAvailableProviders();
  }

  isProviderAvailable(provider: AIProvider): boolean {
    return aiServiceFactory.isProviderAvailable(provider);
  }

  getService(provider: AIProvider, config?: Partial<AIConfig>): AIService {
    return aiServiceFactory.createService(provider, config);
  }
}

// Export singleton instance
export const aiService = AIServiceManager.getInstance();
