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
import type {
  AIResponse,
  TrackListResponse,
  PlaylistGridResponse,
  ArtistResponse,
  SearchResultsResponse,
} from '@/types/ai-responses';

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

      // Debug: Agent responded; tool calls will be handled below

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

            // Debug: Executing tool with parsed args

            // Execute the tool
            const result = await (tool as unknown as any).invoke(args);

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
  private convertToolDataToResponse(toolData: any[]): AIResponse | null {
    if (toolData.length === 0) return null;

    // Aggregate across tool outputs
    const aggregated: {
      tracks: any[];
      artists: any[];
      playlists: any[];
      meta: Record<string, any>;
    } = { tracks: [], artists: [], playlists: [], meta: {} };

    for (const item of toolData) {
      const toolName = item.tool;
      const data = item.data || {};

      switch (toolName) {
        case 'search_tracks':
        case 'get_tracks_by_genre':
        case 'get_trending_tracks': {
          if (Array.isArray(data.tracks))
            aggregated.tracks.push(...data.tracks);
          if (data.genre) aggregated.meta.genre = data.genre;
          if (typeof data.count === 'number')
            aggregated.meta.totalTracks = data.count;
          break;
        }
        case 'get_top_charts':
        case 'get_featured_playlists':
        case 'get_playlists_by_genre':
        case 'get_playlists_by_province': {
          if (Array.isArray(data.playlists))
            aggregated.playlists.push(...data.playlists);
          if (data.genre) aggregated.meta.genre = data.genre;
          if (data.province) aggregated.meta.province = data.province;
          if (typeof data.count === 'number')
            aggregated.meta.totalPlaylists = data.count;
          break;
        }
        case 'get_playlist': {
          if (data) aggregated.playlists.push(data);
          break;
        }
        case 'get_artist': {
          // Tools may return { artist: {...} }
          const artistObj = data.artist ? data.artist : data;
          if (artistObj) aggregated.artists.push(artistObj);
          break;
        }
        case 'search_artists': {
          if (Array.isArray(data.artists))
            aggregated.artists.push(...data.artists);
          break;
        }
        default: {
          // ignore
          break;
        }
      }
    }

    // De-duplicate aggregated items by id where available
    const dedupeById = (arr: any[]) => {
      const seen = new Set<string>();
      const out: any[] = [];
      for (const item of arr) {
        const id = (item && item.id) as string | undefined;
        const key = id || JSON.stringify(item);
        if (!seen.has(key)) {
          seen.add(key);
          out.push(item);
        }
      }
      return out;
    };

    aggregated.tracks = dedupeById(aggregated.tracks);
    aggregated.artists = dedupeById(aggregated.artists);
    aggregated.playlists = dedupeById(aggregated.playlists);

    // If we have both tracks and artists, return mixed search results
    if (aggregated.tracks.length > 0 && aggregated.artists.length > 0) {
      return {
        type: 'search_results',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: aggregated.tracks,
          artists: aggregated.artists,
          metadata: {
            ...aggregated.meta,
            total:
              (aggregated.tracks?.length || 0) +
              (aggregated.artists?.length || 0),
          },
        },
      } as SearchResultsResponse;
    }

    // If only tracks
    if (aggregated.tracks.length > 0) {
      return {
        type: 'track_list',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: aggregated.tracks,
          metadata: {
            genre: aggregated.meta.genre,
            total: aggregated.tracks.length,
          },
        },
      } as TrackListResponse;
    }

    // If only artists
    if (aggregated.artists.length > 0) {
      // If single artist, return artist; otherwise mixed search with artists only
      if (aggregated.artists.length === 1) {
        return {
          type: 'artist',
          message: '',
          timestamp: new Date(),
          data: aggregated.artists[0],
        } as ArtistResponse;
      }
      return {
        type: 'search_results',
        message: '',
        timestamp: new Date(),
        data: {
          artists: aggregated.artists,
          metadata: { total: aggregated.artists.length },
        },
      } as SearchResultsResponse;
    }

    // If only playlists/grid
    if (aggregated.playlists.length > 0) {
      return {
        type: 'playlist_grid',
        message: '',
        timestamp: new Date(),
        data: {
          playlists: aggregated.playlists,
          metadata: {
            genre: aggregated.meta.genre,
            province: aggregated.meta.province,
            total: aggregated.playlists.length,
          },
        },
      } as PlaylistGridResponse;
    }

    // Fallback to first tool's raw data
    const first = toolData[0];
    return (first?.data as AIResponse) ?? null;
  }
}
