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
import { ChatOpenAI, AzureChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { logger } from '@/lib/utils/logger';
import type { AIProvider } from '@/types/ai-service';
import type {
  AIResponse,
  TrackListResponse,
  PlaylistGridResponse,
  PlaylistResponse,
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
- SEARCH: Find tracks by title, artist, or description (use search_tracks tool)
- BROWSE: Explore playlists by genre or province (use get_playlists_by_genre tool)
- DISCOVER: Find trending tracks and top charts (use get_trending_tracks, get_top_charts tools)
- ARTIST: Get information about specific artists (use get_artist, search_artists tools)
- COMPILE PLAYLIST: When user asks to "compile", "create", "make", or "build" a playlist:
  * You MUST use get_tracks_by_genre or search_tracks to find tracks
  * DO NOT use get_genres or get_playlists_by_genre when compiling
  * Search for tracks matching the genre/criteria mentioned
  * The system will automatically compile the tracks into a playlist

When responding:
- Be enthusiastic about helping users discover South African music
- Provide context about genres when relevant (Amapiano, Afrobeat, House, etc.)
- Suggest similar artists or tracks when appropriate
- Keep responses conversational and engaging
- Use the tools available to gather real data before responding
- IMPORTANT: When users ask to compile/create a playlist, you MUST search for tracks using get_tracks_by_genre or search_tracks - do NOT just list genres

You have access to comprehensive music discovery tools. Use them to provide accurate, helpful information.`;

export class DiscoveryAgent extends BaseAgent {
  private model: any;

  constructor(provider: AIProvider = 'azure-openai') {
    super('DiscoveryAgent', DISCOVERY_SYSTEM_PROMPT);

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
        context,
        message // Pass original message to detect compile intent
      );

      return {
        message: messageText,
        data: structuredData || undefined,
        metadata,
      };
    } catch (error) {
      console.error('DiscoveryAgent error:', error);
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      const baseMessage =
        'I apologize, but I encountered an error while searching for music. Please try again.';
      return {
        message:
          process.env.NODE_ENV !== 'production'
            ? `${baseMessage} (debug: ${errorMessage})`
            : baseMessage,
        metadata: {
          agent: this.name,
          error: errorMessage,
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
    context?: AgentContext,
    userMessage?: string
  ): Promise<AIResponse | null> {
    const toolData = results.map(result => ({
      tool: result.name,
      data: result.parsedResult ?? result.rawResult,
    }));

    return this.convertToolDataToResponse(toolData, context, userMessage);
  }

  /**
   * Detect if user wants to compile/create a playlist
   */
  private detectCompileIntent(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const compileKeywords = [
      'compile',
      'create',
      'make',
      'build',
      'put together',
      'assemble',
      'curate',
      'generate',
    ];
    return compileKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Convert raw tool data to structured AI response format
   */
  private async convertToolDataToResponse(
    toolData: any[],
    context?: AgentContext,
    userMessage?: string
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
          // Handle both parsed JSON objects and string JSON
          let tracksData = data;
          if (typeof data === 'string') {
            try {
              tracksData = JSON.parse(data);
            } catch {
              // If parsing fails, use data as is
            }
          }

          // Handle different response structures
          if (Array.isArray(tracksData)) {
            aggregated.tracks.push(...tracksData);
          } else if (tracksData && Array.isArray(tracksData.tracks)) {
            aggregated.tracks.push(...tracksData.tracks);
          }

          if (tracksData?.genre) aggregated.meta.genre = tracksData.genre;
          if (typeof tracksData?.count === 'number')
            aggregated.meta.totalTracks = tracksData.count;
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

    // Check if user wants to compile a playlist
    const wantsToCompile = userMessage && this.detectCompileIntent(userMessage);
    const hasTracks = aggregated.tracks.length > 0;

    // If user wants to compile, create a compiled playlist (even if empty)
    // This takes priority over returning a track_list, even if there are existing playlists
    if (wantsToCompile) {
      // If no tracks found, try to get some tracks by genre from the user message
      if (!hasTracks && userMessage) {
        const genre = this.extractGenreFromMessage(userMessage);
        if (genre) {
          // Try to fetch tracks by genre one more time
          try {
            const { MusicService } = await import('@/lib/services');
            const genreTracks = await MusicService.getTracksByGenre(genre, 50);
            if (genreTracks && genreTracks.length > 0) {
              aggregated.tracks.push(
                ...genreTracks.map(track => ({
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
                  filePath: track.filePath,
                  artistId: track.artistProfileId,
                  userId: track.userId,
                  createdAt: track.createdAt,
                  updatedAt: track.updatedAt,
                  albumArtwork: track.albumArtwork,
                  isDownloadable: track.isDownloadable,
                }))
              );
              aggregated.meta.genre = genre;
            }
          } catch (error) {
            // If genre fetch fails, continue with empty tracks
          }
        }
      }

      return await this.compilePlaylistFromTracks(
        aggregated.tracks,
        aggregated.meta,
        userMessage
      );
    }

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

      // Check if Azure OpenAI is properly configured before attempting summaries
      const azureConfigured =
        process.env.AZURE_OPENAI_API_KEY &&
        process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME &&
        (process.env.AZURE_OPENAI_ENDPOINT ||
          process.env.AZURE_OPENAI_API_INSTANCE_NAME);

      const tracksWithSummaries = await Promise.all(
        aggregated.tracks.map(async track => {
          let summary: string | undefined;

          // Ensure fileUrl is constructed from filePath if missing
          const fileUrl =
            track.fileUrl ||
            (track.filePath ? constructFileUrl(track.filePath) : '');

          if (azureConfigured) {
            try {
              // Use AzureChatOpenAI directly (same as main agents) to ensure consistent config
              const { AzureChatOpenAI } = await import('@langchain/openai');
              const { HumanMessage } = await import('@langchain/core/messages');

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

              // Use same config pattern as main agents - LangChain reads env vars automatically
              const summaryModel = new AzureChatOpenAI({
                azureOpenAIApiDeploymentName:
                  process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-5-mini',
                azureOpenAIApiVersion:
                  process.env.AZURE_OPENAI_API_VERSION || '2024-05-01-preview',
                temperature: 1, // Azure OpenAI gpt-5-mini only supports temperature: 1
              });

              const summaryResponse = await summaryModel.invoke([
                new HumanMessage(summaryPrompt),
              ]);

              if (summaryResponse?.content) {
                summary = String(summaryResponse.content).trim();
              }
            } catch (error) {
              // If summary generation fails, just continue without it
            }
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

              if (!playlist) continue;

              if (playlist && playlist.tracks && playlist.tracks.length > 0) {
                // Map playlist tracks to actual track objects
                const playlistTrackObjects = playlist.tracks
                  .map(pt => {
                    // Handle both { track: {...} } and direct track objects
                    const track = pt.track || pt;
                    return track;
                  })
                  .filter(t => t !== null && t !== undefined);

                // Filter out tracks that are already in main results
                const tracksNotInMain = playlistTrackObjects.filter(
                  t => t && t.id && !mainTrackIds.has(t.id)
                );

                // Filter out duplicates within featured tracks
                const uniqueTracks = tracksNotInMain.filter(
                  t => !allFeaturedTracks.some(ft => ft.id === t.id)
                );

                allFeaturedTracks.push(...uniqueTracks);
              }
            } catch (playlistError) {
              // Continue to next playlist if this one fails
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

  /**
   * Compile a playlist from tracks
   */
  private async compilePlaylistFromTracks(
    tracks: any[],
    meta: Record<string, any>,
    userMessage?: string
  ): Promise<PlaylistResponse> {
    const { constructFileUrl } = await import('@/lib/url-utils');

    // Extract genre from meta or user message
    const genre = meta.genre || this.extractGenreFromMessage(userMessage || '');
    const playlistName = genre ? `${genre} Playlist` : 'Curated Playlist';

    // Prepare tracks with proper structure
    const playlistTracks = tracks.slice(0, 50).map((track, index) => {
      const coverImageUrl =
        track.coverImageUrl || track.albumArtwork
          ? constructFileUrl(track.coverImageUrl || track.albumArtwork)
          : null;

      return {
        track: {
          ...track,
          fileUrl: track.fileUrl || constructFileUrl(track.filePath),
          coverImageUrl,
          artistProfile: track.artistProfile || null,
        },
        order: index + 1,
      };
    });

    // Get cover image from first track or use a default
    const coverImage =
      playlistTracks[0]?.track?.coverImageUrl ||
      playlistTracks[0]?.track?.albumArtwork ||
      '';

    // Create virtual playlist object
    const compiledPlaylist = {
      id: `compiled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: playlistName,
      description: `A curated ${genre ? genre.toLowerCase() : ''} playlist compiled just for you.`,
      coverImage: coverImage || '',
      maxTracks: 50,
      currentTracks: playlistTracks.length,
      status: 'ACTIVE' as const,
      submissionStatus: 'CLOSED' as const,
      maxSubmissionsPerArtist: 1,
      province: meta.province || null,
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 0,
      playlistTypeId: '', // Virtual playlist, no type
      tracks: playlistTracks,
    };

    return {
      type: 'playlist',
      message: `I've compiled a ${genre ? genre.toLowerCase() : ''} playlist with ${playlistTracks.length} tracks for you!`,
      timestamp: new Date(),
      data: compiledPlaylist,
    } as PlaylistResponse;
  }

  /**
   * Extract genre from user message
   */
  private extractGenreFromMessage(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    const genres = [
      'amapiano',
      'afropop',
      'afrobeat',
      'hip hop',
      'hiphop',
      'trap',
      'house',
      '3 step',
      '3-step',
      'gqom',
      'kwaito',
      'afro house',
    ];

    for (const genre of genres) {
      if (lowerMessage.includes(genre)) {
        // Return the genre as-is (will be matched by MusicService)
        // MusicService handles case-insensitive matching and aliases
        return genre;
      }
    }

    return null;
  }
}
