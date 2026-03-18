-- Add toolSlugs array to articles table
ALTER TABLE "articles" ADD COLUMN "toolSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
