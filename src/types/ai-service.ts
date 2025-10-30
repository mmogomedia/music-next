export type AIProvider = 'openai' | 'anthropic' | 'google' | 'cohere';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  apiKey: string;
  baseURL?: string;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: AIProvider;
}

export interface AIError {
  error: string;
  code: string;
  provider: AIProvider;
  details?: string;
}

export interface AIService {
  chat(
    _messages: AIMessage[],
    _config?: Partial<AIConfig>
  ): Promise<AIResponse>;
  isAvailable(): boolean;
  getProvider(): AIProvider;
}

export interface AIServiceFactory {
  createService(_provider: AIProvider, _config?: Partial<AIConfig>): AIService;
  getAvailableProviders(): AIProvider[];
  isProviderAvailable(_provider: AIProvider): boolean;
}
