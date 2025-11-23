-- AlterTable
ALTER TABLE "tracks" ADD COLUMN "attributes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "mood" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "strength" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "playlists" ADD COLUMN "minStrength" INTEGER;

-- CreateEnum
CREATE TYPE "UnprocessedQueryReason" AS ENUM ('malicious', 'non_music', 'knowledge_feature_not_ready', 'other');

-- CreateTable
CREATE TABLE "unprocessed_query_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "reason" "UnprocessedQueryReason" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unprocessed_query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "unprocessed_query_logs_userId_idx" ON "unprocessed_query_logs"("userId");

-- CreateIndex
CREATE INDEX "unprocessed_query_logs_reason_idx" ON "unprocessed_query_logs"("reason");

-- AddForeignKey
ALTER TABLE "unprocessed_query_logs" ADD CONSTRAINT "unprocessed_query_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
