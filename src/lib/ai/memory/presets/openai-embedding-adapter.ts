import type { IEmbeddingAdapter } from '../core/interfaces/embedding';

export class OpenAIEmbeddingAdapter implements IEmbeddingAdapter {
  // Lazy-load to avoid build-time import issues
  private client: import('@langchain/openai').OpenAIEmbeddings | null = null;
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
    import('@langchain/openai').OpenAIEmbeddings
  > {
    if (!this.client) {
      const { OpenAIEmbeddings } = await import('@langchain/openai');
      this.client = new OpenAIEmbeddings({
        openAIApiKey: this.apiKey,
        modelName: this.model,
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
