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
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { AIProvider } from '@/types/ai-service';

const PLAYBACK_SYSTEM_PROMPT = `You are a music playback control assistant for Flemoji, a South African music streaming platform.

Your role is to help users control music playback by creating actions to play tracks, playlists, manage the queue, and control playback.

Available actions:
- PLAY TRACK: Play a specific track
- PLAY PLAYLIST: Play a complete playlist
- QUEUE: Add tracks to the playback queue
- SHUFFLE: Shuffle the current playback

When responding:
- Be brief and action-oriented
- Confirm what action you're taking
- Use the playback tools to create executable actions
- Keep responses concise and helpful
- Always create actions when the user wants to play music

You have access to playback control tools. Use them to execute user requests.`;

export class PlaybackAgent extends BaseAgent {
  private model: any;

  constructor(provider: AIProvider = 'openai') {
    super('PlaybackAgent', PLAYBACK_SYSTEM_PROMPT);

    // Initialize model based on provider
    switch (provider) {
      case 'openai':
        this.model = new ChatOpenAI({
          modelName: 'gpt-4o-mini',
          temperature: 0.5,
        });
        break;
      case 'anthropic':
        this.model = new ChatAnthropic({
          modelName: 'claude-3-5-sonnet',
          temperature: 0.5,
        });
        break;
      case 'google':
        this.model = new ChatGoogleGenerativeAI({
          model: 'gemini-pro',
          temperature: 0.5,
        });
        break;
      default:
        this.model = new ChatOpenAI({
          modelName: 'gpt-4o-mini',
          temperature: 0.5,
        });
    }
  }

  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    try {
      // Bind tools to the model
      const agent = this.model.bindTools(playbackTools);

      // Build context message if filters are provided
      const contextMessage = this.formatContext(context);
      const fullMessage = contextMessage
        ? `${message}${contextMessage ? `\n\nContext: ${contextMessage}` : ''}`
        : message;

      // Get response from the agent
      const response = await agent.invoke([
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: fullMessage },
      ]);

      // Parse tool calls if any
      if (response.tool_calls && response.tool_calls.length > 0) {
        return this.handleToolCalls(response);
      }

      // Return text response
      return {
        message: response.content as string,
        metadata: {
          agent: this.name,
        },
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

  private async handleToolCalls(response: any): Promise<AgentResponse> {
    // For now, return the text response
    // In a full implementation, we would execute the tool calls
    return {
      message: response.content as string,
      metadata: {
        agent: this.name,
        toolCalls: response.tool_calls,
      },
    };
  }
}
