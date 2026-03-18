-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'TOOL', 'ARTIST', 'TRACK');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('REFERENCES', 'FEATURES', 'USES_TOOL', 'EXPLAINED_BY', 'RELATED');

-- CreateTable
CREATE TABLE "tools" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "gradient" TEXT NOT NULL DEFAULT '',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fullscreen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "content_links" (
    "id" TEXT NOT NULL,
    "fromType" "ContentType" NOT NULL,
    "fromId" TEXT NOT NULL,
    "toType" "ContentType" NOT NULL,
    "toId" TEXT NOT NULL,
    "linkType" "LinkType" NOT NULL DEFAULT 'RELATED',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_links_fromType_fromId_toType_toId_linkType_key"
    ON "content_links"("fromType", "fromId", "toType", "toId", "linkType");

-- CreateIndex
CREATE INDEX "content_links_fromType_fromId_idx" ON "content_links"("fromType", "fromId");

-- CreateIndex
CREATE INDEX "content_links_toType_toId_idx" ON "content_links"("toType", "toId");
