/**
 * Recommendation Agent
 *
 * Specialized agent for personalized music recommendations.
 * Uses analytics tools to provide data-driven recommendations.
 *
 * @module RecommendationAgent
 */

import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent';
import { analyticsTools, discoveryTools } from '@/lib/ai/tools';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { AIProvider } from '@/types/ai-service';

const RECOMMENDATION_SYSTEM_PROMPT = `You are a music recommendation assistant for Flemoji, a South African music streaming platform.

Your role is to provide personalized music recommendations based on user preferences, listening history, and current trends.

Available data sources:
- TRENDING: Current trending tracks
- GENRE STATS: Statistics by genre
- PROVINCE STATS: Regional music statistics
- USER HISTORY: User's listening patterns (if available)

When responding:
- Be enthusiastic about helping users discover new music
- Base recommendations on data and trends
- Explain why you're recommending specific tracks/artists
- Provide context about genres and regions
- Keep recommendations diverse and interesting

You have access to analytics tools to provide data-driven recommendations. Use them to suggest music that matches user preferences.`;

export class RecommendationAgent extends BaseAgent {
  private model: any;

  constructor(provider: AIProvider = 'openai') {
    super('RecommendationAgent', RECOMMENDATION_SYSTEM_PROMPT);

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
      // Combine analytics and discovery tools for recommendations
      const recommendationTools = [...analyticsTools, ...discoveryTools];

      // Bind tools to the model
      const agent = this.model.bindTools(recommendationTools);

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
      console.error('RecommendationAgent error:', error);
      return {
        message:
          'I apologize, but I encountered an error while generating recommendations. Please try again.',
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
