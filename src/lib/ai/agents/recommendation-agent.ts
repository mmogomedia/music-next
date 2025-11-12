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
import { ChatOpenAI, AzureChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { AIProvider } from '@/types/ai-service';
import {
  executeToolCallLoop,
  extractTextContent,
} from '@/lib/ai/tool-executor';

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

  constructor(provider: AIProvider = 'azure-openai') {
    super('RecommendationAgent', RECOMMENDATION_SYSTEM_PROMPT);

    // Initialize model based on provider
    switch (provider) {
      case 'azure-openai':
        this.model = new AzureChatOpenAI({
          azureOpenAIApiDeploymentName:
            process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-5-mini',
          azureOpenAIApiVersion:
            process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview',
          temperature: 1,
        });
        break;
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
        this.model = new AzureChatOpenAI({
          azureOpenAIApiDeploymentName:
            process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-5-mini',
          azureOpenAIApiVersion:
            process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview',
          temperature: 1,
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

      // Build context message if filters are provided
      const contextMessage = this.formatContext(context);
      const fullMessage = contextMessage
        ? `${message}${contextMessage ? `\n\nContext: ${contextMessage}` : ''}`
        : message;

      const execution = await executeToolCallLoop({
        model: this.model,
        tools: recommendationTools,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: fullMessage },
        ],
      });

      const responseContent = extractTextContent(
        execution.finalMessage.content
      );

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

      const data =
        execution.toolResults.length > 0
          ? execution.toolResults.map(tool => ({
              tool: tool.name,
              result: tool.parsedResult ?? tool.rawResult,
              error: tool.error,
            }))
          : undefined;

      return {
        message:
          responseContent ||
          'Here are some recommendations based on the latest analytics.',
        data,
        metadata,
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
}
