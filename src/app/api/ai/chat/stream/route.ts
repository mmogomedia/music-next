import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/ai-service';
import { routerAgent } from '@/lib/ai/agents';
import { ChatRequest, ChatResponse } from '@/types/ai';
import { conversationStore } from '@/lib/ai/memory/conversation-store';
import { preferenceTracker } from '@/lib/ai/memory/preference-tracker';
import { contextBuilder } from '@/lib/ai/memory/context-builder';
import { memoryOrchestrator } from '@/lib/ai/memory/memory-orchestrator';
import { logger } from '@/lib/utils/logger';
import type { SSEEvent, SSEEventEmitter } from '@/lib/ai/sse-event-emitter';

export const dynamic = 'force-dynamic';

/**
 * SSE endpoint for AI chat with real-time status updates
 * Accepts POST request and streams events as processing happens
 */
export async function POST(request: NextRequest) {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isActive = true;

      // Helper to send SSE events
      const sendEvent: SSEEventEmitter = (event: SSEEvent) => {
        if (!isActive) return;
        try {
          const message = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          logger.error('Error sending SSE event:', error);
        }
      };

      // Send initial connection confirmation
      sendEvent({
        type: 'connected',
        timestamp: new Date().toISOString(),
      });

      try {
        // Check if any AI provider is available
        const availableProviders = aiService.getAvailableProviders();
        if (availableProviders.length === 0) {
          sendEvent({
            type: 'error',
            timestamp: new Date().toISOString(),
            error: {
              message: 'No AI providers configured',
              code: 'MISSING_API_KEY',
            },
          });
          controller.close();
          return;
        }

        // Parse the request body
        const body: ChatRequest = await request.json();
        const { message, context, chatType } = body;

        if (!message || typeof message !== 'string') {
          sendEvent({
            type: 'error',
            timestamp: new Date().toISOString(),
            error: {
              message: 'Invalid request: message is required',
              code: 'INVALID_REQUEST',
            },
          });
          controller.close();
          return;
        }

        // Generate conversation ID if not provided
        const conversationId =
          body.conversationId ||
          `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Get conversation history for context-aware routing
        const conversationHistory = context?.userId
          ? await conversationStore.getConversation(
              context.userId,
              conversationId,
              6
            )
          : [];

        // Build enhanced context using Memory Orchestrator
        const enhancedContext = await memoryOrchestrator.buildEnhancedContext({
          userId: context?.userId,
          conversationId: conversationId,
          currentMessage: message,
          recentMessages: conversationHistory,
          maxTokens: 2000,
        });

        // Build legacy context for backward compatibility
        const built = await contextBuilder.buildContext(
          context?.userId,
          conversationId
        );

        const agentContext = {
          userId: context?.userId,
          conversationId: conversationId,
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          filters: {
            ...built.filters,
            // Use top genre preference from enhanced memory
            genre:
              enhancedContext.preferences.genres[0] || built.filters?.genre,
            // Add province from request context if provided
            ...(context?.province && { province: context.province }),
          },
          // Add chatType and enhanced memory to metadata
          metadata: {
            chatType: chatType,
            previousIntent: built.metadata?.previousIntent,
            // Enhanced memory data
            preferences: enhancedContext.preferences,
            relevantMemories: enhancedContext.relevantMemories,
            memoryTokenCount: enhancedContext.tokenCount,
          },
          // Add SSE event emitter to context
          emitEvent: sendEvent,
        };

        // Store user message
        if (context?.userId) {
          await conversationStore.storeMessage(
            context.userId,
            conversationId,
            {
              role: 'user',
              content: message,
              timestamp: new Date(),
            },
            undefined,
            chatType
          );
          await preferenceTracker.updateFromMessage(context.userId, message);
        }

        // Use Router Agent to get the appropriate response
        // RouterAgent will emit events through the context
        const agentResponse = await routerAgent.route(message, agentContext);

        // Ensure we have a message (fallback if empty)
        const responseMessage =
          agentResponse.message ||
          'I understand you want to explore music. Let me help you with that!';

        // Create response with structured data if available
        const responseData = agentResponse.data;
        const hasStructuredType =
          responseData &&
          typeof responseData === 'object' &&
          'type' in responseData &&
          'data' in responseData;

        // Ensure proper structure
        let finalData: any;
        if (hasStructuredType) {
          finalData = responseData;
        } else if (
          responseData &&
          typeof responseData === 'object' &&
          'tracks' in responseData
        ) {
          finalData = {
            type: 'track_list',
            message: '',
            timestamp: new Date(),
            data: {
              tracks: responseData.tracks,
              ...(responseData.other && { other: responseData.other }),
              metadata: {
                ...(responseData.metadata || {}),
                total: responseData.count || responseData.tracks?.length || 0,
              },
            },
          };
        } else if (
          responseData &&
          typeof responseData === 'object' &&
          'type' in responseData
        ) {
          // Response has type field but no nested data (e.g., text responses)
          // Use it as-is - it's already a valid AIResponse structure
          finalData = responseData;
        } else {
          finalData = responseData;
        }

        const chatResponse: ChatResponse = {
          message: responseMessage,
          conversationId,
          timestamp: new Date(),
          data: finalData,
        };

        // Store assistant response and update preferences
        if (context?.userId) {
          await conversationStore.storeMessage(
            context.userId,
            conversationId,
            {
              role: 'assistant',
              content: responseMessage,
              timestamp: new Date(),
              data: agentResponse.data,
            },
            undefined,
            chatType
          );
          if (agentResponse?.data) {
            await preferenceTracker.updateFromResults(
              context.userId,
              agentResponse.data
            );
          }

          // Store conversation in enhanced memory system (non-blocking)
          memoryOrchestrator
            .storeConversation({
              userId: context.userId,
              conversationId,
              messages: [
                ...conversationHistory.map(m => ({
                  id: m.id || 'temp',
                  role: m.role,
                  content: m.content,
                  timestamp: m.timestamp || new Date(),
                })),
                {
                  id: 'temp_user',
                  role: 'user',
                  content: message,
                  timestamp: new Date(),
                },
                {
                  id: 'temp_assistant',
                  role: 'assistant',
                  content: responseMessage,
                  timestamp: new Date(),
                },
              ],
              userMessage: message,
            })
            .catch(err =>
              logger.error('[Memory] Failed to store conversation:', err)
            );
        }

        // Send final response
        sendEvent({
          type: 'complete',
          timestamp: new Date().toISOString(),
          data: chatResponse,
        });

        // Close stream
        controller.close();
      } catch (error) {
        logger.error('AI Chat SSE Error:', error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'Unknown error occurred';

        sendEvent({
          type: 'error',
          timestamp: new Date().toISOString(),
          error: {
            message: errorMessage,
            code: 'INTERNAL_ERROR',
          },
        });

        controller.close();
      } finally {
        isActive = false;
      }
    },
  });

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in Nginx
    },
  });
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
