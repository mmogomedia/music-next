import type { IEmbeddingAdapter } from '../core/interfaces/embedding';

/**
 * Embedding adapter backed by Azure OpenAI.
 *
 * Migrated from direct OpenAI (`OPENAI_API_KEY`) to the shared Azure OpenAI
 * resource so all AI spend is consolidated on a single key. It uses the
 * `text-embedding-3-small` deployment — the SAME underlying model as OpenAI
 * direct — so existing 1536-dim pgvector embeddings remain valid and no
 * re-embed is required. Endpoint / api-version / deployment resolve from env
 * (AZURE_OPENAI_BASE_PATH, AZURE_OPENAI_API_VERSION,
 * AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME); the api key is passed in.
 *
 * NOTE: the class/file name is intentionally kept as `OpenAIEmbeddingAdapter`
 * to avoid churn across call-sites — it now targets Azure OpenAI.
 */
export class OpenAIEmbeddingAdapter implements IEmbeddingAdapter {
  // Lazy-load to avoid build-time import issues
  private client: import('@langchain/openai').AzureOpenAIEmbeddings | null =
    null;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly dimensions: number;

  constructor(
    apiKey: string,
    model = 'text-embedding-3-small',
    dimensions = 1536
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.dimensions = dimensions;
  }

  private async getClient(): Promise<
    import('@langchain/openai').AzureOpenAIEmbeddings
  > {
    if (!this.client) {
      const { AzureOpenAIEmbeddings } = await import('@langchain/openai');
      this.client = new AzureOpenAIEmbeddings({
        azureOpenAIApiKey: this.apiKey,
        // Azure deployment for the embedding model (resolves from env; falls
        // back to the model name, which is also the deployment name here).
        azureOpenAIApiEmbeddingsDeploymentName:
          process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME || this.model,
        azureOpenAIApiVersion:
          process.env.AZURE_OPENAI_API_VERSION || '2025-03-01-preview',
        // azureOpenAIBasePath / instance name resolve from env
        // (AZURE_OPENAI_BASE_PATH), matching the chat-model wiring.
        dimensions: this.dimensions,
      });
    }
    return this.client;
  }

  async embed(text: string): Promise<number[]> {
    const client = await this.getClient();
    return client.embedQuery(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const client = await this.getClient();
    return client.embedDocuments(texts);
  }
}
