# AI Setup Guide

This guide explains how to set up the AI functionality using LangChain and OpenAI.

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key to use the AI chat functionality.
   - Sign up at [OpenAI](https://platform.openai.com/)
   - Generate an API key from your dashboard
   - Add it to your environment variables

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY="your-openai-api-key-here"

# Anthropic Configuration (optional)
ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Google Configuration (optional)
GOOGLE_API_KEY="your-google-api-key-here"

# Cohere Configuration (optional)
COHERE_API_KEY="your-cohere-api-key-here"
```

**Note**: You only need to configure the providers you want to use. The system will automatically detect available providers and use the best one if no specific provider is requested.

## Features

### AI Service Factory
- **Multiple Providers**: Support for OpenAI, Anthropic, Google, and Cohere
- **Automatic Fallback**: If a provider fails, automatically falls back to another available provider
- **Provider Selection**: Choose specific providers or let the system auto-select the best available
- **Unified Interface**: Same API regardless of which provider is used

### AI Chat Endpoint
- **Endpoint**: `/api/ai/chat`
- **Method**: POST
- **Purpose**: Provides AI-powered chat functionality for the Flemoji platform

### AI Providers Endpoint
- **Endpoint**: `/api/ai/providers`
- **Method**: GET
- **Purpose**: Returns list of available AI providers

### Request Format
```typescript
{
  message: string;
  conversationId?: string;
  provider?: 'openai' | 'anthropic' | 'google' | 'cohere';
  context?: {
    userId?: string;
    artistProfile?: string;
    trackInfo?: string;
    playlistInfo?: string;
  };
}
```

### Response Format
```typescript
{
  message: string;
  conversationId: string;
  timestamp: Date;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

## Testing

1. Start your development server:
   ```bash
   yarn dev
   ```

2. Navigate to `/ai-test` to test the AI chat functionality

3. Try asking questions like:
   - "What genres are popular in South African music?"
   - "How can I discover new Amapiano artists?"
   - "Tell me about the playlist system on Flemoji"

## Components

### AIChat Component
Located at `src/components/ai/AIChat.tsx`, this component provides a user interface for interacting with the AI assistant.

### Types
AI-related TypeScript types are defined in `src/types/ai.ts`.

## Configuration

The AI system is configured with:
- **Model**: GPT-3.5-turbo
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 1000
- **Context**: South African music platform focus

## Error Handling

The API includes comprehensive error handling for:
- Missing API keys
- Invalid requests
- OpenAI API errors
- Network issues

## Security

- API key is stored securely in environment variables
- Input validation on all requests
- Error messages don't expose sensitive information
