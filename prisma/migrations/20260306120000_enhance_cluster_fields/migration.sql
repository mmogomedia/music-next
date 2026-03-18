-- AlterTable
ALTER TABLE "article_clusters"
ADD COLUMN "about"              TEXT,
ADD COLUMN "goal"               TEXT,
ADD COLUMN "primaryKeywords"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "secondaryKeywords"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "longTailKeywords"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
