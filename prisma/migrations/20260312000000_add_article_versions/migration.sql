-- CreateTable: article_versions
CREATE TABLE "article_versions" (
    "id"              TEXT NOT NULL,
    "articleId"       TEXT NOT NULL,
    "version"         INTEGER NOT NULL,
    "title"           TEXT NOT NULL,
    "body"            TEXT NOT NULL,
    "excerpt"         TEXT,
    "coverImageUrl"   TEXT,
    "seoTitle"        TEXT,
    "metaDescription" TEXT,
    "targetKeywords"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "primaryKeyword"  TEXT,
    "internalLinks"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "toolSlugs"       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "ctaText"         TEXT,
    "ctaLink"         TEXT,
    "savedById"       TEXT NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_versions_pkey" PRIMARY KEY ("id")
);

-- UniqueConstraint
ALTER TABLE "article_versions" ADD CONSTRAINT "article_versions_articleId_version_key" UNIQUE ("articleId", "version");

-- CreateIndex
CREATE INDEX "article_versions_articleId_idx" ON "article_versions"("articleId");

-- AddForeignKey
ALTER TABLE "article_versions"
    ADD CONSTRAINT "article_versions_articleId_fkey"
    FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "article_versions"
    ADD CONSTRAINT "article_versions_savedById_fkey"
    FOREIGN KEY ("savedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
