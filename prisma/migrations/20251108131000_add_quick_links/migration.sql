-- CreateEnum
CREATE TYPE "QuickLinkType" AS ENUM ('TRACK', 'ARTIST', 'ALBUM');

-- CreateTable
CREATE TABLE "quick_links" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "QuickLinkType" NOT NULL,
    "trackId" TEXT,
    "artistProfileId" TEXT,
    "albumArtistId" TEXT,
    "albumName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrerelease" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT NOT NULL,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "firstVisitedAt" TIMESTAMP(3),
    "lastVisitedAt" TIMESTAMP(3),
    "referrerCounts" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "campaignCounts" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quick_links_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quick_links_slug_key" UNIQUE ("slug"),
    CONSTRAINT "quick_links_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quick_links_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quick_links_albumArtistId_fkey" FOREIGN KEY ("albumArtistId") REFERENCES "artist_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quick_links_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX "quick_links_type_idx" ON "quick_links"("type");
CREATE INDEX "quick_links_trackId_idx" ON "quick_links"("trackId");
CREATE INDEX "quick_links_artistProfileId_idx" ON "quick_links"("artistProfileId");
CREATE INDEX "quick_links_album_idx" ON "quick_links"("albumArtistId", "albumName");
