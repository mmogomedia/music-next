-- Create HNSW index on conversation_embeddings for fast vector similarity search
-- HNSW (Hierarchical Navigable Small World) provides fast approximate nearest neighbor search
-- Parameters:
--   m = 16: Number of connections per layer (higher = better recall, more memory)
--   ef_construction = 64: Size of dynamic candidate list during construction (higher = better quality, slower build)

CREATE INDEX IF NOT EXISTS idx_conversation_embedding_hnsw
ON conversation_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Add a regular index on importance for filtering
CREATE INDEX IF NOT EXISTS idx_conversation_embedding_importance
ON conversation_embeddings(importance DESC);

-- Add index for user + importance filtering
CREATE INDEX IF NOT EXISTS idx_conversation_embedding_user_importance
ON conversation_embeddings(user_id, importance DESC);

-- Add index for temporal queries
CREATE INDEX IF NOT EXISTS idx_conversation_embedding_temporal
ON conversation_embeddings(user_id, start_time DESC);
