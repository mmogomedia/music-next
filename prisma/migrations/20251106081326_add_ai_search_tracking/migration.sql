-- AlterTable
ALTER TABLE "daily_stats" ADD COLUMN     "totalAISearches" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "monthly_stats" ADD COLUMN     "totalAISearches" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "aiSearchCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "weekly_stats" ADD COLUMN     "totalAISearches" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "yearly_stats" ADD COLUMN     "totalAISearches" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ai_search_events" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "conversationId" TEXT,
    "userId" TEXT,
    "resultType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_search_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_search_events_trackId_idx" ON "ai_search_events"("trackId");

-- CreateIndex
CREATE INDEX "ai_search_events_timestamp_idx" ON "ai_search_events"("timestamp");

-- CreateIndex
CREATE INDEX "ai_search_events_conversationId_idx" ON "ai_search_events"("conversationId");

-- CreateIndex
CREATE INDEX "ai_search_events_userId_idx" ON "ai_search_events"("userId");

-- CreateIndex
CREATE INDEX "ai_search_events_resultType_idx" ON "ai_search_events"("resultType");

-- AddForeignKey
ALTER TABLE "ai_search_events" ADD CONSTRAINT "ai_search_events_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_search_events" ADD CONSTRAINT "ai_search_events_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_search_events" ADD CONSTRAINT "ai_search_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
