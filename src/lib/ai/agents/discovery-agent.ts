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
import type { TrackListResponse, PlaylistResponse, PlaylistGridResponse, ArtistResponse, SearchResultsResponse } from '@/types/ai-responses';

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
    try {
      // Execute tool calls and get results
      const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall: any) => {
          const tool = discoveryTools.find(t => t.name === toolCall.name);
          if (!tool) {
            return {
              toolName: toolCall.name,
              result: 'Tool not found',
            };
          }

          try {
            // Parse the tool arguments (may already be an object or a string)
            let args = toolCall.args;
            if (typeof args === 'string') {
              try {
                args = JSON.parse(args);
              } catch {
                args = {};
              }
            }

            console.log(`Executing tool ${toolCall.name} with args:`, args);

            // Execute the tool
            const result = await tool.invoke(args);

            return {
              toolName: toolCall.name,
              result: result,
            };
          } catch (error) {
            console.error(`Error executing tool ${toolCall.name}:`, error);
            return {
              toolName: toolCall.name,
              result: { error: 'Tool execution failed' },
            };
          }
        })
      );

      // Parse tool results to get structured data
      const data = toolResults.map(tr => {
        try {
          return {
            tool: tr.toolName,
            data:
              typeof tr.result === 'string' ? JSON.parse(tr.result) : tr.result,
          };
        } catch {
          return {
            tool: tr.toolName,
            data: tr.result,
          };
        }
      });

      // Convert tool results to structured response format
      const structuredData = this.convertToolDataToResponse(data);

      // Check if we have text response
      const hasText = response.content && response.content.trim().length > 0;

      // Get the tool names for the message
      const toolNames =
        response.tool_calls?.map((tc: any) => tc.name).join(', ') || 'tools';

      return {
        message: hasText
          ? (response.content as string)
          : `I found results using ${toolNames}! Here's what I discovered:`,
        data: structuredData,
        metadata: {
          agent: this.name,
          toolCalls: response.tool_calls,
          executed: true,
        },
      };
    } catch (error) {
      console.error('Error handling tool calls:', error);
      return {
        message:
          'I encountered an issue while searching. Let me try a different approach.',
        metadata: {
          agent: this.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Convert raw tool data to structured AI response format
   */
  private convertToolDataToResponse(toolData: any[]): any {
    if (toolData.length === 0) return null;
    
    const firstResult = toolData[0];
    const resultData = firstResult.data;
    const toolName = firstResult.tool;

    // Convert based on tool type
    switch (toolName) {
      case 'search_tracks':
      case 'get_tracks_by_genre':
      case 'get_trending_tracks':
        return {
          type: 'track_list',
          data: {
            tracks: resultData.tracks || [],
            metadata: {
              genre: resultData.genre,
              total: resultData.count || resultData.tracks?.length || 0,
            },
          },
        };

      case 'get_playlist':
        return {
          type: 'playlist',
          data: resultData,
        };

      case 'get_top_charts':
      case 'get_featured_playlists':
      case 'get_playlists_by_genre':
      case 'get_playlists_by_province':
        return {
          type: 'playlist_grid',
          data: {
            playlists: resultData.playlists || [],
            metadata: {
              genre: resultData.genre,
              province: resultData.province,
              total: resultData.count || resultData.playlists?.length || 0,
            },
          },
        };

      case 'get_artist':
      case 'search_artists':
        return {
          type: 'artist',
          data: resultData,
        };

      default:
        // Return raw data if we don't recognize the tool
        return resultData;
    }
  }
}
