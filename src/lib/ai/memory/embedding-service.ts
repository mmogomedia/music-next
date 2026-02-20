import { OpenAIEmbeddings } from '@langchain/openai';

export class EmbeddingService {
  private embeddings: OpenAIEmbeddings | null = null;

  private getEmbeddings(): OpenAIEmbeddings {
    if (!this.embeddings) {
      // Embeddings only use OpenAI (Azure OpenAI is used for chat)
      const openaiApiKey = process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        throw new Error(
          'Missing OPENAI_API_KEY. Embeddings require OpenAI API key to be set.'
        );
      }

      this.embeddings = new OpenAIEmbeddings({
        modelName: 'text-embedding-3-small',
        dimensions: 1536,
        openAIApiKey: openaiApiKey,
      });
    }
    return this.embeddings;
  }

  /**
   * Generate embedding for a single text
   */
  async embedText(text: string): Promise<number[]> {
    try {
      const embedding = await this.getEmbeddings().embedQuery(text);
      return embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await this.getEmbeddings().embedDocuments(texts);
      return embeddings;
    } catch (error) {
      console.error('Failed to generate batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }
}

export const embeddingService = new EmbeddingService();
