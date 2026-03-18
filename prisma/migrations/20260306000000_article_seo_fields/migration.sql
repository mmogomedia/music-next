-- Add SEO and internal-linking fields to article_clusters and articles

ALTER TABLE "article_clusters" ADD COLUMN "audience" TEXT;

ALTER TABLE "articles" ADD COLUMN "primaryKeyword" TEXT;
ALTER TABLE "articles" ADD COLUMN "internalLinks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "articles" ADD COLUMN "ctaText" TEXT;
ALTER TABLE "articles" ADD COLUMN "ctaLink" TEXT;
