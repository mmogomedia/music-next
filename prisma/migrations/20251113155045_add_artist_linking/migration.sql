-- AlterTable
ALTER TABLE "artist_profiles" ADD COLUMN     "isUnclaimed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "quick_links" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "featuredArtistIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "primaryArtistIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "artistProfileId" DROP NOT NULL;

-- RenameIndex
ALTER INDEX "quick_links_album_idx" RENAME TO "quick_links_albumArtistId_albumName_idx";
