/*
  Warnings:

  - You are about to drop the column `artistId` on the `tracks` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `tracks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uniqueUrl]` on the table `tracks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `artistProfileId` to the `tracks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uniqueUrl` to the `tracks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `tracks` table without a default value. This is not possible if the table is not empty.
  - Made the column `filePath` on table `tracks` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PlaylistType" AS ENUM ('GENRE', 'FEATURED', 'TOP_TEN', 'PROVINCE');

-- CreateEnum
CREATE TYPE "PlaylistStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "TrackSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SHORTLISTED');

-- DropForeignKey
ALTER TABLE "tracks" DROP CONSTRAINT "tracks_artistId_fkey";

-- AlterTable
ALTER TABLE "tracks" DROP COLUMN "artistId",
DROP COLUMN "fileUrl",
ADD COLUMN     "albumArtwork" TEXT,
ADD COLUMN     "artist" TEXT,
ADD COLUMN     "artistProfileId" TEXT NOT NULL,
ADD COLUMN     "bitrate" INTEGER,
ADD COLUMN     "bpm" INTEGER,
ADD COLUMN     "channels" INTEGER,
ADD COLUMN     "composer" TEXT,
ADD COLUMN     "copyrightInfo" TEXT,
ADD COLUMN     "distributionRights" TEXT,
ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "isDownloadable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isExplicit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isrc" TEXT,
ADD COLUMN     "licenseType" TEXT,
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lyrics" TEXT,
ADD COLUMN     "releaseDate" TIMESTAMP(3),
ADD COLUMN     "sampleRate" INTEGER,
ADD COLUMN     "shareCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "uniqueUrl" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "watermarkId" TEXT,
ADD COLUMN     "year" INTEGER,
ALTER COLUMN "genre" DROP NOT NULL,
ALTER COLUMN "duration" DROP NOT NULL,
ALTER COLUMN "filePath" SET NOT NULL;

-- CreateTable
CREATE TABLE "artist_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "bio" TEXT,
    "profileImage" TEXT,
    "coverImage" TEXT,
    "location" TEXT,
    "website" TEXT,
    "genre" TEXT,
    "slug" TEXT,
    "socialLinks" JSONB,
    "streamingLinks" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalPlays" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalFollowers" INTEGER NOT NULL DEFAULT 0,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PlaylistType" NOT NULL,
    "coverImage" TEXT NOT NULL,
    "maxTracks" INTEGER NOT NULL,
    "currentTracks" INTEGER NOT NULL DEFAULT 0,
    "status" "PlaylistStatus" NOT NULL DEFAULT 'INACTIVE',
    "submissionStatus" "SubmissionStatus" NOT NULL DEFAULT 'CLOSED',
    "maxSubmissionsPerArtist" INTEGER NOT NULL DEFAULT 1,
    "province" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_submissions" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "status" "TrackSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "adminComment" TEXT,
    "artistComment" TEXT,

    CONSTRAINT "playlist_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_tracks" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT NOT NULL,
    "submissionId" TEXT,

    CONSTRAINT "playlist_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_analytics" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "uniqueListeners" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "playlist_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artist_profiles_userId_key" ON "artist_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "artist_profiles_artistName_key" ON "artist_profiles"("artistName");

-- CreateIndex
CREATE UNIQUE INDEX "artist_profiles_slug_key" ON "artist_profiles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_tracks_playlistId_trackId_key" ON "playlist_tracks"("playlistId", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_analytics_playlistId_date_key" ON "playlist_analytics"("playlistId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_uniqueUrl_key" ON "tracks"("uniqueUrl");

-- AddForeignKey
ALTER TABLE "artist_profiles" ADD CONSTRAINT "artist_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_submissions" ADD CONSTRAINT "playlist_submissions_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_submissions" ADD CONSTRAINT "playlist_submissions_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_submissions" ADD CONSTRAINT "playlist_submissions_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_submissions" ADD CONSTRAINT "playlist_submissions_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_analytics" ADD CONSTRAINT "playlist_analytics_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
