-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "filePath" TEXT,
ALTER COLUMN "fileUrl" DROP NOT NULL;
