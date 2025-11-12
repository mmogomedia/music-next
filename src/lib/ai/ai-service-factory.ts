import {
  AIServiceFactory,
  AIService,
  AIConfig,
  AIProvider,
} from '@/types/ai-service';
import { OpenAIService } from './openai-service';
import { AnthropicService } from './anthropic-service';
import { AzureOpenAIService } from './azure-openai-service';

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
      case 'azure-openai':
        service = new AzureOpenAIService(fullConfig);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }

    this.services.set(provider, service);
    return service;
  }

  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];

    // Check Azure OpenAI first so it becomes preferred if configured
    if (
      process.env.AZURE_OPENAI_API_KEY &&
      (process.env.AZURE_OPENAI_ENDPOINT ||
        process.env.AZURE_OPENAI_API_INSTANCE_NAME) &&
      process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME
    ) {
      providers.push('azure-openai');
    }

    // Check OpenAI
    if (process.env.OPENAI_API_KEY) {
      providers.push('openai');
    }

    // Check Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      providers.push('anthropic');
    }

    // Check Google
    if (process.env.GOOGLE_API_KEY) {
      providers.push('google');
    }

    // Check Cohere
    if (process.env.COHERE_API_KEY) {
      providers.push('cohere');
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
      'azure-openai': {
        provider: 'azure-openai',
        model: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-4o-mini',
        temperature: 1,
        apiKey: process.env.AZURE_OPENAI_API_KEY || '',
        azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
        azureInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
        azureDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
        azureEmbeddingsDeploymentName:
          process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
        azureApiVersion:
          process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview',
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
