-- Add vector embedding columns to tracks table for semantic search
ALTER TABLE "tracks" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
ALTER TABLE "tracks" ADD COLUMN IF NOT EXISTS "embeddingUpdatedAt" TIMESTAMP(3);

-- HNSW index for fast approximate nearest-neighbour search
-- vector_cosine_ops matches the <=> cosine distance operator used in queries
CREATE INDEX IF NOT EXISTS tracks_embedding_hnsw_idx
  ON tracks USING hnsw (embedding vector_cosine_ops);
