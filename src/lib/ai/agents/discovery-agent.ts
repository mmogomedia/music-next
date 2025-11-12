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
import { logger } from '@/lib/utils/logger';
import type { AIProvider } from '@/types/ai-service';
import type {
  AIResponse,
  TrackListResponse,
  PlaylistGridResponse,
  ArtistResponse,
  SearchResultsResponse,
} from '@/types/ai-responses';
import {
  executeToolCallLoop,
  extractTextContent,
  type ExecutedToolResult,
} from '@/lib/ai/tool-executor';

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
      // Build context message if filters are provided
      const contextMessage = this.formatContext(context);
      const fullMessage = contextMessage
        ? `${message}${contextMessage ? `\n\nContext: ${contextMessage}` : ''}`
        : message;

      const execution = await executeToolCallLoop({
        model: this.model,
        tools: discoveryTools,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: fullMessage },
        ],
      });

      const textContent = extractTextContent(execution.finalMessage.content);
      const messageText =
        textContent ||
        (execution.toolResults.length > 0
          ? this.buildFallbackMessage(execution.toolResults)
          : 'I found some information for you. Let me help you explore that!');

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

      if (execution.toolResults.length === 0) {
        return {
          message: messageText,
          metadata,
        };
      }

      const structuredData = await this.convertToolResultsToResponse(
        execution.toolResults,
        context
      );

      return {
        message: messageText,
        data: structuredData || undefined,
        metadata,
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

  private buildFallbackMessage(toolResults: ExecutedToolResult[]): string {
    const toolNames = Array.from(
      new Set(toolResults.map(result => result.name))
    ).join(', ');
    return `I found results using ${toolNames || 'the available tools'}! Here's what I discovered:`;
  }

  private async convertToolResultsToResponse(
    results: ExecutedToolResult[],
    context?: AgentContext
  ): Promise<AIResponse | null> {
    const toolData = results.map(result => ({
      tool: result.name,
      data: result.parsedResult ?? result.rawResult,
    }));

    return this.convertToolDataToResponse(toolData, context);
  }

  /**
   * Convert raw tool data to structured AI response format
   */
  private async convertToolDataToResponse(
    toolData: any[],
    context?: AgentContext
  ): Promise<AIResponse | null> {
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
        case 'get_genres': {
          // Handle genre list separately - return immediately
          if (Array.isArray(data.genres)) {
            return {
              type: 'genre_list',
              message: '',
              timestamp: new Date(),
              data: {
                genres: data.genres,
                metadata: {
                  total: data.count || data.genres.length,
                },
              },
            } as any;
          }
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
      let otherTracks: any[] | undefined;

      // Generate summaries for all tracks and ensure fileUrl is present
      const { constructFileUrl } = await import('@/lib/url-utils');
      const tracksWithSummaries = await Promise.all(
        aggregated.tracks.map(async track => {
          let summary: string | undefined;

          // Ensure fileUrl is constructed from filePath if missing
          const fileUrl =
            track.fileUrl ||
            (track.filePath ? constructFileUrl(track.filePath) : '');

          try {
            const { aiService } = await import('@/lib/ai/ai-service');
            const trackData = {
              title: track.title,
              artist: track.artist || 'Unknown Artist',
              genre: track.genre || 'Unknown Genre',
              playCount: track.playCount || 0,
              likeCount: track.likeCount || 0,
              duration: track.duration,
              album: track.album,
            };

            const summaryPrompt = `Create a brief, engaging summary (2-3 sentences) for this South African track on Flemoji:

Title: ${trackData.title}
Artist: ${trackData.artist}
Genre: ${trackData.genre}
Plays: ${trackData.playCount}
Likes: ${trackData.likeCount}
${trackData.album ? `Album: ${trackData.album}` : ''}

Write a concise summary that:
- Highlights the track's genre and style
- Mentions the artist
- Notes its popularity if significant (high play/like counts)
- Uses an enthusiastic, music-discovery tone
- Keeps it under 150 words

Summary:`;

            const summaryResponse = await aiService.chat(
              [{ role: 'user', content: summaryPrompt }],
              {
                provider: 'openai',
                config: {
                  temperature: 0.7,
                  maxTokens: 200,
                },
                fallback: true,
              }
            );

            if (summaryResponse?.content) {
              summary = summaryResponse.content.trim();
            }
          } catch (error) {
            // If summary generation fails, just continue without it
            logger.error('Error generating track summary:', error);
          }

          return {
            ...track,
            fileUrl,
            summary,
            isDownloadable: track.isDownloadable ?? false,
          };
        })
      );

      // Add featured tracks in "other" field for all track results
      // Fetch featured tracks - try multiple playlists if needed to get enough tracks
      try {
        const { PlaylistService } = await import('@/lib/services');
        const mainTrackIds = new Set(aggregated.tracks.map(t => t.id));
        const featuredPlaylists = await PlaylistService.getFeaturedPlaylists(3);

        if (featuredPlaylists && featuredPlaylists.length > 0) {
          // Try to get tracks from multiple featured playlists if needed
          const allFeaturedTracks: any[] = [];

          for (const featuredPlaylist of featuredPlaylists) {
            if (allFeaturedTracks.length >= 5) break;

            try {
              const playlist = await PlaylistService.getPlaylistById(
                featuredPlaylist.id
              );

              if (playlist && playlist.tracks.length > 0) {
                const uniqueTracks = playlist.tracks
                  .map(pt => pt.track)
                  .filter(t => t && !mainTrackIds.has(t.id))
                  .filter(t => !allFeaturedTracks.some(ft => ft.id === t.id));

                allFeaturedTracks.push(...uniqueTracks);
              }
            } catch (playlistError) {
              // Continue to next playlist if this one fails
              logger.error(
                `Error fetching featured playlist ${featuredPlaylist.id}:`,
                playlistError
              );
            }
          }

          if (allFeaturedTracks.length > 0) {
            // Get first 5 tracks, ensuring fileUrl is constructed
            const { constructFileUrl } = await import('@/lib/url-utils');
            otherTracks = allFeaturedTracks.slice(0, 5).map(track => ({
              id: track.id,
              title: track.title,
              artist:
                track.artist ||
                track.artistProfile?.artistName ||
                'Unknown Artist',
              genre: track.genre,
              duration: track.duration,
              playCount: track.playCount,
              likeCount: track.likeCount,
              coverImageUrl: track.coverImageUrl,
              uniqueUrl: track.uniqueUrl,
              filePath: track.filePath,
              fileUrl:
                track.fileUrl ||
                (track.filePath ? constructFileUrl(track.filePath) : ''),
              artistId: track.artistProfileId,
              userId: track.userId,
              createdAt: track.createdAt,
              updatedAt: track.updatedAt,
              albumArtwork: track.albumArtwork,
              isDownloadable: track.isDownloadable ?? false,
            }));
          }
        }
      } catch (error) {
        // If featured tracks fetch fails, just continue without them
        logger.error('Error fetching featured tracks:', error);
      }

      // Track AI search events for tracks in "other" field
      if (otherTracks && otherTracks.length > 0) {
        try {
          const { processAISearchEvents } = await import('@/lib/stats-server');

          // Deduplicate tracks within the same response (count once per track)
          const uniqueTrackIds = new Set<string>();
          const events: Array<{
            eventType: 'ai_search';
            trackId: string;
            userId?: string;
            sessionId: string;
            conversationId?: string;
            resultType: string;
          }> = [];

          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          for (const track of otherTracks) {
            if (track.id && !uniqueTrackIds.has(track.id)) {
              uniqueTrackIds.add(track.id);
              events.push({
                eventType: 'ai_search',
                trackId: track.id,
                userId: context?.userId,
                sessionId: sessionId,
                conversationId: context?.conversationId,
                resultType: 'track_list',
              });
            }
          }

          // Process events directly on server (non-blocking)
          if (events.length > 0) {
            processAISearchEvents(events).catch(error => {
              // Non-blocking: log error but continue
              logger.error('Failed to track AI search events:', error);
            });
          }
        } catch (error) {
          // Non-blocking: log error but continue
          logger.error('Failed to track AI search events:', error);
        }
      }

      return {
        type: 'track_list',
        message: '',
        timestamp: new Date(),
        data: {
          tracks: tracksWithSummaries,
          ...(otherTracks && otherTracks.length > 0 && { other: otherTracks }),
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
