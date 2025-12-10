-- Idempotent migration: Add AI enhancements

-- AlterTable tracks - add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'attributes') THEN
        ALTER TABLE "tracks" ADD COLUMN "attributes" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'mood') THEN
        ALTER TABLE "tracks" ADD COLUMN "mood" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'strength') THEN
        ALTER TABLE "tracks" ADD COLUMN "strength" INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- AlterTable playlists - add minStrength if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'playlists' AND column_name = 'minStrength') THEN
        ALTER TABLE "playlists" ADD COLUMN "minStrength" INTEGER;
    END IF;
END $$;

-- CreateEnum UnprocessedQueryReason (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UnprocessedQueryReason') THEN
        CREATE TYPE "UnprocessedQueryReason" AS ENUM ('malicious', 'non_music', 'knowledge_feature_not_ready', 'other');
    END IF;
END $$;

-- CreateTable unprocessed_query_logs (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "unprocessed_query_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "reason" "UnprocessedQueryReason" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unprocessed_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'unprocessed_query_logs_userId_idx') THEN
        CREATE INDEX "unprocessed_query_logs_userId_idx" ON "unprocessed_query_logs"("userId");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'unprocessed_query_logs_reason_idx') THEN
        CREATE INDEX "unprocessed_query_logs_reason_idx" ON "unprocessed_query_logs"("reason");
    END IF;
END $$;

-- AddForeignKey (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unprocessed_query_logs_userId_fkey'
    ) THEN
        ALTER TABLE "unprocessed_query_logs" ADD CONSTRAINT "unprocessed_query_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
