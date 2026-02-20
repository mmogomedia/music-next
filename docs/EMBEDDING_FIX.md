# Embedding Service Fix

## Issue

Embeddings were not being created because the service was only checking for `OPENAI_API_KEY`, but the project uses Azure OpenAI.

## Solution

Updated `src/lib/ai/memory/embedding-service.ts` to:

1. Check for Azure OpenAI configuration first
2. Use `AzureOpenAIEmbeddings` if Azure is configured
3. Fall back to `OpenAIEmbeddings` if only OpenAI key is available
4. Provide better error messages

## Configuration Required

The service now checks for:

- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT` or `AZURE_OPENAI_API_INSTANCE_NAME`
- `AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME` (or falls back to `AZURE_OPENAI_API_DEPLOYMENT_NAME`)

## Next Steps

1. **Restart your dev server** (required for changes to take effect)

   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   yarn dev
   ```

2. **Send a test message** through the chat interface

3. **Wait 10-15 seconds** for async processing

4. **Verify embeddings were created**:
   ```bash
   node scripts/verify-memory-system.js [userId]
   ```

## Expected Results After Restart

- ✅ Embeddings should be created automatically
- ✅ Summaries should be generated
- ✅ Importance scores should be calculated
- ✅ Vector storage in pgvector should work

## Troubleshooting

If embeddings still don't work after restart:

1. Check server logs for `[EpisodicMemory]` messages
2. Verify Azure OpenAI credentials are correct
3. Test embedding service directly:
   ```typescript
   import { embeddingService } from '@/lib/ai/memory/embedding-service';
   const embedding = await embeddingService.embedText('test');
   console.log('Embedding length:', embedding.length);
   ```
