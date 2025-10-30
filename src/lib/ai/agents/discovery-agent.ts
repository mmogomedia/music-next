/**
 * Discovery Agent
 *
 * Specialized agent for music discovery, search, and browsing operations.
 * Uses discovery tools to find tracks, playlists, and artists.
 *
 * @module DiscoveryAgent
 */

import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { discoveryTools } from '@/lib/ai/tools';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { AIProvider } from '@/types/ai-service';

const DISCOVERY_SYSTEM_PROMPT = `You are a music discovery assistant for Flemoji, a South African music streaming platform.

Your role is to help users discover new music, search for tracks and artists, browse playlists, and explore different genres and regions.

Available actions:
- SEARCH: Find tracks by title, artist, or description
- BROWSE: Explore playlists by genre or province
- DISCOVER: Find trending tracks and top charts
- ARTIST: Get information about specific artists

When responding:
- Be enthusiastic about helping users discover South African music
- Provide context about genres when relevant (Amapiano, Afrobeat, House, etc.)
- Suggest similar artists or tracks when appropriate
- Keep responses conversational and engaging
- Use the tools available to gather real data before responding

You have access to comprehensive music discovery tools. Use them to provide accurate, helpful information.`;

export class DiscoveryAgent extends BaseAgent {
  private model: any;

  constructor(provider: AIProvider = 'openai') {
    super('DiscoveryAgent', DISCOVERY_SYSTEM_PROMPT);

    // Initialize model based on provider
    switch (provider) {
      case 'openai':
        this.model = new ChatOpenAI({
          modelName: 'gpt-4o-mini',
          temperature: 0.7,
        });
        break;
      case 'anthropic':
        this.model = new ChatAnthropic({
          modelName: 'claude-3-5-sonnet',
          temperature: 0.7,
        });
        break;
      case 'google':
        this.model = new ChatGoogleGenerativeAI({
          model: 'gemini-pro',
          temperature: 0.7,
        });
        break;
      default:
        this.model = new ChatOpenAI({
          modelName: 'gpt-4o-mini',
          temperature: 0.7,
        });
    }
  }

  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    try {
      // Bind tools to the model
      const agent = this.model.bindTools(discoveryTools);

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

      console.log('Discovery Agent Response:', {
        content: response.content,
        toolCalls: response.tool_calls?.length || 0,
      });

      // Parse tool calls if any
      if (response.tool_calls && response.tool_calls.length > 0) {
        return this.handleToolCalls(response);
      }

      // Return text response
      const content = response.content as string;
      return {
        message:
          content ||
          'I found some information for you. Let me help you explore that!',
        metadata: {
          agent: this.name,
        },
      };
    } catch (error) {
      console.error('DiscoveryAgent error:', error);
      return {
        message:
          'I apologize, but I encountered an error while searching for music. Please try again.',
        metadata: {
          agent: this.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private async handleToolCalls(response: any): Promise<AgentResponse> {
    // Check if we have tool calls but no text response
    const hasText = response.content && response.content.trim().length > 0;
    
    // If agent made tool calls without text, provide a helpful message
    if (!hasText) {
      // Get the tool names that were called
      const toolNames = response.tool_calls?.map((tc: any) => tc.name).join(', ') || 'tools';
      
      return {
        message: `I'm searching for music information using ${toolNames}. Let me find the best results for you!`,
        metadata: {
          agent: this.name,
          toolCalls: response.tool_calls,
        },
      };
    }
    
    // Return the text response if we have one
    return {
      message: response.content as string,
      metadata: {
        agent: this.name,
        toolCalls: response.tool_calls,
      },
    };
  }
}
