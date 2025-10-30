export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// Re-export service types for convenience
export type {
  AIProvider,
  AIConfig,
  AIResponse,
  AIService,
  AIServiceFactory,
} from './ai-service';
import type { AIProvider } from './ai-service';

export interface ChatRequest {
  message: string;
  conversationId?: string;
  provider?: AIProvider;
  context?: {
    userId?: string;
    artistProfile?: string;
    trackInfo?: string;
    playlistInfo?: string;
  };
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  timestamp: Date;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIError {
  error: string;
  code: string;
  details?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}
