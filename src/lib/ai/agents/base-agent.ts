/**
 * Base Agent
 *
 * Base class for all specialized AI agents with common functionality.
 *
 * @module BaseAgent
 */

import type { AIMessage } from '@/types/ai-service';
import type { SSEEventEmitter } from '@/lib/ai/sse-event-emitter';
import type { RunnableConfig } from '@langchain/core/runnables';

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
  conversationId?: string;
  conversationHistory?: AIMessage[];
  filters?: {
    genre?: string;
    province?: string;
  };
  metadata?: Record<string, any>;
  emitEvent?: SSEEventEmitter;
  /** LangChain RunnableConfig carrying trace tags/metadata for LangSmith grouping */
  runConfig?: RunnableConfig;
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
      // Genre is intentionally excluded. Injecting the user's preferred genre
      // into the message text causes the LLM to treat it as a hard filter on
      // every search_tracks call — including specific song/artist lookups where
      // genre should never be applied. Genre preferences are available to the
      // LLM via the system prompt memory injection and context.metadata.preferences.
      if (context.filters.province) {
        contextStr += ` Province: ${context.filters.province}`;
      }
    }

    return contextStr.trim();
  }

  /**
   * Build messages array including conversation history between system prompt and current user message.
   */
  protected buildMessagesWithHistory(
    systemContent: string,
    userContent: string,
    context?: AgentContext
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemContent },
    ];

    if (context?.conversationHistory?.length) {
      for (const msg of context.conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: userContent });
    return messages;
  }

  /**
   * Append a ## USER MEMORY CONTEXT section to the base system prompt
   * using preferences and relevant memories stored in context.metadata.
   */
  protected buildSystemPromptWithMemory(
    basePrompt: string,
    context?: AgentContext
  ): string {
    const preferences = context?.metadata?.preferences as
      | { genres?: string[]; artists?: string[]; moods?: string[] }
      | undefined;

    const relevantMemories = context?.metadata?.relevantMemories as
      | Array<{ summary: string; similarity: number }>
      | undefined;

    const hasPrefs =
      preferences &&
      ((preferences.genres?.length ?? 0) > 0 ||
        (preferences.artists?.length ?? 0) > 0 ||
        (preferences.moods?.length ?? 0) > 0);

    const hasMemories = relevantMemories && relevantMemories.length > 0;

    if (!hasPrefs && !hasMemories) return basePrompt;

    const lines: string[] = ['\n\n## USER MEMORY CONTEXT'];

    if (hasPrefs) {
      if (preferences!.genres?.length) {
        lines.push(`- Favourite genres: ${preferences!.genres.join(', ')}`);
      }
      if (preferences!.artists?.length) {
        lines.push(`- Favourite artists: ${preferences!.artists.join(', ')}`);
      }
      if (preferences!.moods?.length) {
        lines.push(`- Preferred moods: ${preferences!.moods.join(', ')}`);
      }
    }

    if (hasMemories) {
      lines.push('- Relevant past context:');
      for (const mem of relevantMemories!) {
        lines.push(`  * ${mem.summary}`);
      }
    }

    return basePrompt + lines.join('\n');
  }
}
