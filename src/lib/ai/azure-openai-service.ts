import { AzureChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { BaseAIService } from './base-service';
import { AIConfig, AIMessage, AIResponse } from '@/types/ai-service';

export class AzureOpenAIService extends BaseAIService {
  private client: AzureChatOpenAI;

  constructor(config: AIConfig) {
    super(config);
    this.validateConfig(config);

    if (!config.azureDeploymentName) {
      throw new Error('Azure OpenAI deployment name is required');
    }

    const azureOptions: Record<string, unknown> = {
      azureOpenAIApiKey: config.apiKey,
      azureOpenAIApiDeploymentName: config.azureDeploymentName,
      azureOpenAIApiVersion: config.azureApiVersion || '2024-05-01-preview',
      temperature: config.temperature ?? 1,
    };

    if (config.azureEndpoint) {
      azureOptions.azureOpenAIBasePath = config.azureEndpoint;
    }

    if (config.azureInstanceName) {
      azureOptions.azureOpenAIApiInstanceName = config.azureInstanceName;
    }

    const apiVersion = (config.azureApiVersion ||
      process.env.AZURE_OPENAI_API_VERSION ||
      '2024-05-01-preview') as string;

    if (
      config.maxTokens !== undefined &&
      apiVersion.localeCompare('2024-10-01') < 0
    ) {
      azureOptions.maxTokens = config.maxTokens;
    }

    this.client = new AzureChatOpenAI(azureOptions);
  }

  async chat(
    messages: AIMessage[],
    config?: Partial<AIConfig>
  ): Promise<AIResponse> {
    try {
      const mergedConfig = { ...this.config, ...config };
      const formattedMessages = this.formatMessages(messages);

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
        provider: 'azure-openai',
      };
    } catch (error) {
      throw this.createError(
        'Azure OpenAI API error',
        'AZURE_OPENAI_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  isAvailable(): boolean {
    return (
      !!this.config.apiKey &&
      !!this.config.azureDeploymentName &&
      (!!this.config.azureEndpoint || !!this.config.azureInstanceName)
    );
  }
}
