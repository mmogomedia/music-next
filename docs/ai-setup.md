# AI Setup Guide

This guide explains how to set up the Flemoji AI functionality using LangChain and multiple LLM providers (Azure OpenAI, OpenAI, Anthropic, Google, Cohere).

## Prerequisites

1. **Azure OpenAI Credentials (recommended)**: Configure Azure first so it becomes the primary provider.
   - Create / use an Azure OpenAI resource
   - Collect the instance name, endpoint URL, deployment name(s), and API key
2. **Optional Provider Keys**: You can still set OpenAI, Anthropic, Google, or Cohere keys as fallbacks.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Azure OpenAI Configuration (preferred)
AZURE_OPENAI_API_INSTANCE_NAME="your-azure-openai-instance-name"
AZURE_OPENAI_ENDPOINT="https://your-instance-name.cognitiveservices.azure.com/"
AZURE_OPENAI_API_KEY="your-azure-openai-api-key"
AZURE_OPENAI_API_DEPLOYMENT_NAME="your-chat-deployment-name"
AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME="your-embeddings-deployment-name"
# Optional override (defaults to 2024-05-01-preview)
AZURE_OPENAI_API_VERSION="2024-05-01-preview"

# OpenAI Configuration (fallback / optional)
OPENAI_API_KEY="your-openai-api-key-here"

# Anthropic Configuration (optional)
ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Google Configuration (optional)
GOOGLE_API_KEY="your-google-api-key-here"

# Cohere Configuration (optional)
COHERE_API_KEY="your-cohere-api-key-here"
```

**Note**:

- Only configure the providers you intend to use. The system automatically detects available providers and selects Azure OpenAI first when it is configured.
- Do **not** commit real API keys to the repository—store them in your local `.env.local` and add them to the hosting environment via secret management.

## Features

### AI Service Factory

- **Multiple Providers**: Azure OpenAI, OpenAI, Anthropic, Google, and Cohere
- **Automatic Fallback**: If the preferred provider fails, the system falls back to any available provider
- **Provider Selection**: Choose a specific provider or let the system auto-select
- **Unified Interface**: Same API regardless of provider

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
  provider?: 'azure-openai' | 'openai' | 'anthropic' | 'google' | 'cohere';
  context?: {
    userId?: string;
    artistProfile?: string;
    trackInfo?: string;
    playlistInfo?: string;
    province?: string;
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

The default configuration is tuned for South African music discovery:

- **Model**: Azure deployment (default) or GPT-3.5-turbo when using OpenAI
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 1000
- **Context**: South African music platform focus

## Error Handling

The API includes comprehensive error handling for:

- Missing API keys
- Invalid requests
- Provider API errors
- Network issues

## Security

- API keys are stored in environment variables (never hard-coded)
- Input validation on all requests
- Error messages avoid exposing sensitive information
