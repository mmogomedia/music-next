-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "completionPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "language" TEXT;
