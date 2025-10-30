/**
 * Response Registry
 *
 * Central registry for AI response types that provides:
 * - Auto-registration for new response types
 * - Dynamic prompt generation for AI agents
 * - Type-safe component mapping
 * - Response validation
 *
 * @module ResponseRegistry
 */

import type { ComponentType } from 'react';
import type { AIResponse, ResponseType } from '@/types/ai-responses';

/**
 * JSON Schema definition for a response type
 */
export interface ResponseSchema {
  type: 'object' | 'array';
  properties?: Record<string, any>;
  items?: any;
  required?: string[];
  [key: string]: any;
}

/**
 * Metadata for a response type
 */
export interface ResponseMetadata {
  description: string;
  category: 'discovery' | 'action' | 'info';
  icon?: string;
  priority?: number;
}

/**
 * Handler for a specific response type
 */
export interface ResponseHandler<T extends AIResponse> {
  /**
   * React component to render this response type
   */
  component: ComponentType<any>;

  /**
   * Prompt template for AI to use when generating this response
   */
  promptTemplate: string;

  /**
   * JSON schema for LangChain structured output
   */
  schema: ResponseSchema;

  /**
   * Metadata about the response type
   */
  metadata: ResponseMetadata;

  /**
   * Optional validation function
   */
  validate?: (_response: T) => boolean;
}

/**
 * Registry for AI response types
 */
class AIResponseRegistry {
  private handlers = new Map<ResponseType, ResponseHandler<any>>();

  /**
   * Register a new response type with its handler
   */
  register<T extends AIResponse>(
    type: T['type'],
    handler: ResponseHandler<T>
  ): void {
    this.handlers.set(type as ResponseType, handler);
  }

  /**
   * Get handler for a specific response type
   */
  get(type: string): ResponseHandler<any> | undefined {
    return this.handlers.get(type as ResponseType);
  }

  /**
   * Get all registered response types
   */
  getRegisteredTypes(): ResponseType[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if a response type is registered
   */
  isRegistered(type: string): boolean {
    return this.handlers.has(type as ResponseType);
  }

  /**
   * Get all handlers
   */
  getAllHandlers(): Map<ResponseType, ResponseHandler<any>> {
    return new Map(this.handlers);
  }

  /**
   * Generate system prompt for AI with all available response types
   */
  generateSystemPrompt(): string {
    const types = Array.from(this.handlers.values())
      .sort((a, b) => (b.metadata.priority || 0) - (a.metadata.priority || 0))
      .map(
        handler =>
          `- **${handler.metadata.category.toUpperCase()}**: ${handler.metadata.description} (${handler.promptTemplate})`
      )
      .join('\n');

    return `Available response types:\n${types}\n\nUse the most appropriate response type based on the user's query.`;
  }

  /**
   * Get all schemas for LangChain structured output
   */
  getAllSchemas(): { anyOf: ResponseSchema[] } {
    const schemas = Array.from(this.handlers.values()).map(handler => ({
      ...handler.schema,
      description: handler.metadata.description,
    }));

    return { anyOf: schemas };
  }

  /**
   * Validate a response against its registered handler
   */
  validateResponse(_response: any): boolean {
    if (!_response || !_response.type) {
      return false;
    }

    const handler = this.get(_response.type);
    if (!handler) {
      return false;
    }

    // Use custom validator if provided
    if (handler.validate) {
      return handler.validate(_response);
    }

    // Basic validation: check required fields exist
    const basicFields = ['type', 'message'];
    return basicFields.every(field => field in _response);
  }

  /**
   * Get response metadata for a type
   */
  getMetadata(type: string): ResponseMetadata | undefined {
    const handler = this.get(type);
    return handler?.metadata;
  }
}

// Create and export singleton instance
export const responseRegistry = new AIResponseRegistry();

// Export the class for testing
export { AIResponseRegistry };
