/*
  Warnings:

  - You are about to drop the column `ipAddress` on the `play_events` table. All the data in the column will be lost.
  - Added the required column `sessionId` to the `play_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `play_events` table without a default value. This is not possible if the table is not empty.
  - Made the column `userAgent` on table `play_events` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "play_events" DROP COLUMN "ipAddress",
ADD COLUMN     "completionRate" INTEGER,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "playlistId" TEXT,
ADD COLUMN     "replayed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sessionId" TEXT NOT NULL,
ADD COLUMN     "skipped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" TEXT NOT NULL,
ALTER COLUMN "timestamp" DROP DEFAULT,
ALTER COLUMN "userAgent" SET NOT NULL;

-- CreateTable
CREATE TABLE "like_events" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "like_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "save_events" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "playlistId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "save_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_events" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "platform" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_events" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "like_events_trackId_idx" ON "like_events"("trackId");

-- CreateIndex
CREATE INDEX "like_events_timestamp_idx" ON "like_events"("timestamp");

-- CreateIndex
CREATE INDEX "like_events_sessionId_idx" ON "like_events"("sessionId");

-- CreateIndex
CREATE INDEX "save_events_trackId_idx" ON "save_events"("trackId");

-- CreateIndex
CREATE INDEX "save_events_timestamp_idx" ON "save_events"("timestamp");

-- CreateIndex
CREATE INDEX "save_events_sessionId_idx" ON "save_events"("sessionId");

-- CreateIndex
CREATE INDEX "share_events_trackId_idx" ON "share_events"("trackId");

-- CreateIndex
CREATE INDEX "share_events_timestamp_idx" ON "share_events"("timestamp");

-- CreateIndex
CREATE INDEX "share_events_sessionId_idx" ON "share_events"("sessionId");

-- CreateIndex
CREATE INDEX "download_events_trackId_idx" ON "download_events"("trackId");

-- CreateIndex
CREATE INDEX "download_events_timestamp_idx" ON "download_events"("timestamp");

-- CreateIndex
CREATE INDEX "download_events_sessionId_idx" ON "download_events"("sessionId");

-- CreateIndex
CREATE INDEX "play_events_trackId_idx" ON "play_events"("trackId");

-- CreateIndex
CREATE INDEX "play_events_timestamp_idx" ON "play_events"("timestamp");

-- CreateIndex
CREATE INDEX "play_events_sessionId_idx" ON "play_events"("sessionId");

-- CreateIndex
CREATE INDEX "play_events_source_idx" ON "play_events"("source");

-- AddForeignKey
ALTER TABLE "like_events" ADD CONSTRAINT "like_events_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like_events" ADD CONSTRAINT "like_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "save_events" ADD CONSTRAINT "save_events_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "save_events" ADD CONSTRAINT "save_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_events" ADD CONSTRAINT "share_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_events" ADD CONSTRAINT "download_events_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_events" ADD CONSTRAINT "download_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
