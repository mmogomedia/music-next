export interface IEmbeddingAdapter {
  embed(_text: string): Promise<number[]>;
  embedBatch(_texts: string[]): Promise<number[][]>;
}
