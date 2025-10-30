/*
  Warnings:

  - You are about to drop the column `type` on the `playlists` table. All the data in the column will be lost.
  - Added the required column `playlistTypeId` to the `playlists` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "playlists" DROP COLUMN "type",
ADD COLUMN     "playlistTypeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "playlist_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "maxInstances" INTEGER NOT NULL DEFAULT -1,
    "requiresProvince" BOOLEAN NOT NULL DEFAULT false,
    "defaultMaxTracks" INTEGER NOT NULL DEFAULT 20,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlist_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "playlist_types_slug_key" ON "playlist_types"("slug");

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_playlistTypeId_fkey" FOREIGN KEY ("playlistTypeId") REFERENCES "playlist_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
