-- AlterTable
ALTER TABLE "tracks" ADD COLUMN IF NOT EXISTS "streamingLinks" JSONB;
