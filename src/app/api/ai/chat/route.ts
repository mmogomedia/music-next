import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/ai-service';
import { routerAgent } from '@/lib/ai/agents';
import { ChatRequest, ChatResponse, AIError } from '@/types/ai';
import { conversationStore } from '@/lib/ai/memory/conversation-store';
import { preferenceTracker } from '@/lib/ai/memory/preference-tracker';
import { contextBuilder } from '@/lib/ai/memory/context-builder';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Check if any AI provider is available
    const availableProviders = aiService.getAvailableProviders();
    if (availableProviders.length === 0) {
      const error: AIError = {
        error: 'No AI providers configured',
        code: 'MISSING_API_KEY',
        details:
          'Please configure at least one AI provider API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)',
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Parse the request body
    const body: ChatRequest = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      const error: AIError = {
        error: 'Invalid request: message is required',
        code: 'INVALID_REQUEST',
        details: 'Please provide a valid message string',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Generate conversation ID if not provided
    const conversationId =
      body.conversationId ||
      `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build agent context from request context + memory
    const built = await contextBuilder.buildContext(
      context?.userId,
      conversationId
    );
    const agentContext = {
      userId: context?.userId,
      conversationId: conversationId,
      filters: built.filters ?? ({} as any),
    };

    // Map context to filters if needed
    if (context?.artistProfile || context?.trackInfo || context?.playlistInfo) {
      // Context information can be parsed here if needed
    }

    try {
      // Store user message
      if (context?.userId) {
        await conversationStore.storeMessage(context.userId, conversationId, {
          role: 'user',
          content: message,
          timestamp: new Date(),
        });
        await preferenceTracker.updateFromMessage(context.userId, message);
      }

      // Use Router Agent to get the appropriate response
      const agentResponse = await routerAgent.route(message, agentContext);

      // Ensure we have a message (fallback if empty)
      const responseMessage =
        agentResponse.message ||
        'I understand you want to explore music. Let me help you with that!';

      // Create response with structured data if available
      const chatResponse: ChatResponse = {
        message: responseMessage,
        conversationId,
        timestamp: new Date(),
        data: agentResponse.data, // Include structured data from agent
      };

      // Store assistant response and update preferences
      if (context?.userId) {
        await conversationStore.storeMessage(context.userId, conversationId, {
          role: 'assistant',
          content: responseMessage,
          timestamp: new Date(),
          data: agentResponse.data,
        });
        if (agentResponse?.data) {
          await preferenceTracker.updateFromResults(
            context.userId,
            agentResponse.data
          );
        }
      }

      // Debug: chat response built

      return NextResponse.json(chatResponse);
    } catch (agentError) {
      logger.error('Agent execution error:', agentError);

      // Fallback response
      const chatResponse: ChatResponse = {
        message:
          "I'm here to help you discover great South African music! Try asking me to find tracks, artists, or playlists.",
        conversationId,
        timestamp: new Date(),
      };

      return NextResponse.json(chatResponse);
    }
  } catch (error) {
    logger.error('AI Chat API Error:', error);

    const aiError: AIError = {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details:
        error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return NextResponse.json(aiError, { status: 500 });
  }
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
