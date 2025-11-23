/**
 * Playback Agent
 *
 * Specialized agent for music playback control and actions.
 * Uses playback tools to create actions for playing tracks and playlists.
 *
 * @module PlaybackAgent
 */

import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { playbackTools } from '@/lib/ai/tools';
import { createModel } from './model-factory';
import { PLAYBACK_SYSTEM_PROMPT } from './agent-prompts';
import { AGENT_TEMPERATURE_OVERRIDES } from './agent-config';
import type { AIProvider } from '@/types/ai-service';
import {
  executeToolCallLoop,
  extractTextContent,
} from '@/lib/ai/tool-executor';

export class PlaybackAgent extends BaseAgent {
  private model: any;

  /**
   * Create a new PlaybackAgent instance
   * @param provider - AI provider to use (defaults to 'azure-openai')
   */
  constructor(provider: AIProvider = 'azure-openai') {
    super('PlaybackAgent', PLAYBACK_SYSTEM_PROMPT);
    this.model = createModel(provider, {
      temperature: AGENT_TEMPERATURE_OVERRIDES.playback,
    });
  }

  /**
   * Process a user message and return playback actions
   * @param message - User's playback command message
   * @param context - Optional agent context (userId, filters, etc.)
   * @returns Agent response with playback actions
   */
  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    try {
      // Build context message if filters are provided
      const contextMessage = this.formatContext(context);
      const fullMessage = contextMessage
        ? `${message}${contextMessage ? `\n\nContext: ${contextMessage}` : ''}`
        : message;

      const execution = await executeToolCallLoop({
        model: this.model,
        tools: playbackTools,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: fullMessage },
        ],
      });

      const responseContent = extractTextContent(
        execution.finalMessage.content
      );

      const actions = execution.toolResults
        .map(tool => {
          const parsed = tool.parsedResult ?? tool.rawResult;
          if (
            parsed &&
            typeof parsed === 'object' &&
            'action' in (parsed as any)
          ) {
            return (parsed as any).action;
          }
          return undefined;
        })
        .filter(Boolean);

      const metadata = {
        agent: this.name,
        iterations: execution.iterations,
        toolCalls: execution.toolResults.map(tool => ({
          name: tool.name,
          args: tool.args,
          error: tool.error,
        })),
        toolExecutionTruncated: execution.toolExecutionTruncated || undefined,
      };

      return {
        message:
          responseContent ||
          (actions.length > 0
            ? 'Playback actions are ready for execution.'
            : 'How can I assist with playback?'),
        actions: actions.length > 0 ? actions : undefined,
        metadata,
      };
    } catch (error) {
      console.error('PlaybackAgent error:', error);
      return {
        message:
          'I apologize, but I encountered an error while handling playback. Please try again.',
        metadata: {
          agent: this.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}
