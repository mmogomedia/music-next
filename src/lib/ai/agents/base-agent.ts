/**
 * Base Agent
 *
 * Base class for all specialized AI agents with common functionality.
 *
 * @module BaseAgent
 */

import type { AIMessage } from '@/types/ai-service';

/**
 * Base interface for all agents
 */
export interface BaseAgentInterface {
  /**
   * Process a user message and return a response
   */
  process(_message: string, _context?: AgentContext): Promise<AgentResponse>;

  /**
   * Get the agent's system prompt
   */
  getSystemPrompt(): string;
}

/**
 * Context passed to agents
 */
export interface AgentContext {
  userId?: string;
  conversationHistory?: AIMessage[];
  filters?: {
    genre?: string;
    province?: string;
  };
}

/**
 * Response from an agent
 */
export interface AgentResponse {
  message: string;
  data?: any;
  actions?: any[];
  metadata?: Record<string, any>;
}

/**
 * Base agent class with common functionality
 */
export abstract class BaseAgent implements BaseAgentInterface {
  protected systemPrompt: string;
  protected name: string;

  constructor(name: string, systemPrompt: string) {
    this.name = name;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Abstract method for processing messages (must be implemented by subclasses)
   */
  abstract process(
    _message: string,
    _context?: AgentContext
  ): Promise<AgentResponse>;

  /**
   * Get the system prompt
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /**
   * Get the agent name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Format context for inclusion in messages
   */
  protected formatContext(context?: AgentContext): string {
    if (!context) return '';

    let contextStr = '';
    if (context.filters) {
      if (context.filters.genre) {
        contextStr += ` Genre: ${context.filters.genre}`;
      }
      if (context.filters.province) {
        contextStr += ` Province: ${context.filters.province}`;
      }
    }

    return contextStr.trim();
  }
}
