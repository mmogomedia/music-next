-- Enable pgvector extension for vector similarity search
-- This extension allows storing and querying vector embeddings in PostgreSQL

CREATE EXTENSION IF NOT EXISTS vector;

-- Verify the extension was created
-- This query will be run by Prisma to check if migration succeeded
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE EXCEPTION 'pgvector extension was not created successfully';
  END IF;
END $$;
