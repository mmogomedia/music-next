-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ClusterRole" AS ENUM ('PILLAR', 'SPOKE');

-- CreateTable
CREATE TABLE "article_clusters" (
    "id"             TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "slug"           TEXT NOT NULL,
    "description"    TEXT,
    "coverImageUrl"  TEXT,
    "targetKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status"         "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "article_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id"              TEXT NOT NULL,
    "title"           TEXT NOT NULL,
    "slug"            TEXT NOT NULL,
    "body"            TEXT NOT NULL,
    "excerpt"         TEXT,
    "coverImageUrl"   TEXT,
    "seoTitle"        TEXT,
    "metaDescription" TEXT,
    "targetKeywords"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "clusterId"       TEXT,
    "clusterRole"     "ClusterRole" NOT NULL DEFAULT 'SPOKE',
    "readTime"        INTEGER NOT NULL DEFAULT 0,
    "status"          "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt"     TIMESTAMP(3),
    "authorId"        TEXT NOT NULL,
    "timelinePostId"  TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_clusters_slug_key" ON "article_clusters"("slug");
CREATE INDEX "article_clusters_status_idx" ON "article_clusters"("status");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");
CREATE UNIQUE INDEX "articles_timelinePostId_key" ON "articles"("timelinePostId");
CREATE INDEX "articles_status_publishedAt_idx" ON "articles"("status", "publishedAt");
CREATE INDEX "articles_clusterId_idx" ON "articles"("clusterId");
CREATE INDEX "articles_authorId_idx" ON "articles"("authorId");

-- Vector embedding column (pgvector)
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "embeddingUpdatedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS articles_embedding_hnsw_idx
  ON articles USING hnsw (embedding vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "articles"
    ADD CONSTRAINT "articles_clusterId_fkey"
    FOREIGN KEY ("clusterId") REFERENCES "article_clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "articles"
    ADD CONSTRAINT "articles_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
