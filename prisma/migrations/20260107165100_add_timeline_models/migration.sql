-- CreateEnum Safe
DO $$ BEGIN
    CREATE TYPE "PostType" AS ENUM ('MUSIC_POST', 'SONG', 'NEWS_ARTICLE', 'ADVERTISEMENT', 'FEATURED_CONTENT', 'RELEASE_PROMO', 'VIDEO_CONTENT', 'EVENT_ANNOUNCEMENT', 'POLL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum Safe
DO $$ BEGIN
    CREATE TYPE "AuthorType" AS ENUM ('ARTIST', 'ADMIN', 'PUBLISHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum Safe
DO $$ BEGIN
    CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED', 'FLAGGED', 'DELETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum Safe
DO $$ BEGIN
    CREATE TYPE "ChatType" AS ENUM ('STREAMING', 'TIMELINE', 'DASHBOARD', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable Users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "canPublishNews" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable AIConversations
-- We use a DO block for safely adding column with enum type if it might conflict or to check existence properly
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_conversations' AND column_name = 'chatType') THEN
        ALTER TABLE "ai_conversations" ADD COLUMN "chatType" "ChatType" NOT NULL DEFAULT 'OTHER';
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "timeline_posts" (
    "id" TEXT NOT NULL,
    "postType" "PostType" NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorType" "AuthorType" NOT NULL DEFAULT 'ARTIST',
    "content" JSONB NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "videoUrl" TEXT,
    "songUrl" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "timelineAdId" TEXT,

    CONSTRAINT "timeline_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "timeline_post_likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "timeline_post_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "timeline_comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "timeline_post_shares" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_post_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "timeline_post_views" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_post_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "timeline_post_tags" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "timeline_post_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "timeline_follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "timeline_feed_cache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "position" INTEGER NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_feed_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "timeline_ads" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "ctaText" TEXT NOT NULL,
    "ctaUrl" TEXT NOT NULL,
    "targetAudience" JSONB,
    "budget" DOUBLE PRECISION,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_ads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_conversations_userId_chatType_idx" ON "ai_conversations"("userId", "chatType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timeline_posts_postType_status_publishedAt_idx" ON "timeline_posts"("postType", "status", "publishedAt");
CREATE INDEX IF NOT EXISTS "timeline_posts_authorId_status_idx" ON "timeline_posts"("authorId", "status");
CREATE INDEX IF NOT EXISTS "timeline_posts_isFeatured_featuredUntil_idx" ON "timeline_posts"("isFeatured", "featuredUntil");
CREATE INDEX IF NOT EXISTS "timeline_posts_relevanceScore_idx" ON "timeline_posts"("relevanceScore");
CREATE INDEX IF NOT EXISTS "timeline_posts_publishedAt_idx" ON "timeline_posts"("publishedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timeline_post_likes_postId_idx" ON "timeline_post_likes"("postId");
CREATE INDEX IF NOT EXISTS "timeline_post_likes_userId_idx" ON "timeline_post_likes"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "timeline_post_likes_postId_userId_key" ON "timeline_post_likes"("postId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timeline_post_comments_postId_createdAt_idx" ON "timeline_post_comments"("postId", "createdAt");
CREATE INDEX IF NOT EXISTS "timeline_post_comments_parentId_idx" ON "timeline_post_comments"("parentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timeline_comment_likes_commentId_idx" ON "timeline_comment_likes"("commentId");
CREATE INDEX IF NOT EXISTS "timeline_comment_likes_userId_idx" ON "timeline_comment_likes"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "timeline_comment_likes_commentId_userId_key" ON "timeline_comment_likes"("commentId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timeline_post_shares_postId_idx" ON "timeline_post_shares"("postId");
CREATE INDEX IF NOT EXISTS "timeline_post_shares_userId_idx" ON "timeline_post_shares"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timeline_post_views_postId_viewedAt_idx" ON "timeline_post_views"("postId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "timeline_post_tags_postId_tag_key" ON "timeline_post_tags"("postId", "tag");
CREATE INDEX IF NOT EXISTS "timeline_post_tags_tag_idx" ON "timeline_post_tags"("tag");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timeline_follows_followerId_idx" ON "timeline_follows"("followerId");
CREATE INDEX IF NOT EXISTS "timeline_follows_followingId_idx" ON "timeline_follows"("followingId");
CREATE UNIQUE INDEX IF NOT EXISTS "timeline_follows_followerId_followingId_key" ON "timeline_follows"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "timeline_feed_cache_userId_postId_key" ON "timeline_feed_cache"("userId", "postId");
CREATE INDEX IF NOT EXISTS "timeline_feed_cache_userId_score_cachedAt_idx" ON "timeline_feed_cache"("userId", "score", "cachedAt");
CREATE INDEX IF NOT EXISTS "timeline_feed_cache_expiresAt_idx" ON "timeline_feed_cache"("expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "timeline_ads_isActive_startDate_endDate_idx" ON "timeline_ads"("isActive", "startDate", "endDate");

-- AddForeignKey Safe
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_posts_authorId_fkey') THEN
        ALTER TABLE "timeline_posts" ADD CONSTRAINT "timeline_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_posts_timelineAdId_fkey') THEN
        ALTER TABLE "timeline_posts" ADD CONSTRAINT "timeline_posts_timelineAdId_fkey" FOREIGN KEY ("timelineAdId") REFERENCES "timeline_ads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_post_likes_postId_fkey') THEN
        ALTER TABLE "timeline_post_likes" ADD CONSTRAINT "timeline_post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "timeline_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_post_likes_userId_fkey') THEN
        ALTER TABLE "timeline_post_likes" ADD CONSTRAINT "timeline_post_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_post_comments_postId_fkey') THEN
        ALTER TABLE "timeline_post_comments" ADD CONSTRAINT "timeline_post_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "timeline_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_post_comments_userId_fkey') THEN
        ALTER TABLE "timeline_post_comments" ADD CONSTRAINT "timeline_post_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_post_comments_parentId_fkey') THEN
        ALTER TABLE "timeline_post_comments" ADD CONSTRAINT "timeline_post_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "timeline_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_comment_likes_commentId_fkey') THEN
        ALTER TABLE "timeline_comment_likes" ADD CONSTRAINT "timeline_comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "timeline_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_post_shares_postId_fkey') THEN
        ALTER TABLE "timeline_post_shares" ADD CONSTRAINT "timeline_post_shares_postId_fkey" FOREIGN KEY ("postId") REFERENCES "timeline_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_post_shares_userId_fkey') THEN
        ALTER TABLE "timeline_post_shares" ADD CONSTRAINT "timeline_post_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_post_views_postId_fkey') THEN
        ALTER TABLE "timeline_post_views" ADD CONSTRAINT "timeline_post_views_postId_fkey" FOREIGN KEY ("postId") REFERENCES "timeline_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_post_views_userId_fkey') THEN
        ALTER TABLE "timeline_post_views" ADD CONSTRAINT "timeline_post_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_post_tags_postId_fkey') THEN
        ALTER TABLE "timeline_post_tags" ADD CONSTRAINT "timeline_post_tags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "timeline_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_follows_followerId_fkey') THEN
        ALTER TABLE "timeline_follows" ADD CONSTRAINT "timeline_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_follows_followingId_fkey') THEN
        ALTER TABLE "timeline_follows" ADD CONSTRAINT "timeline_follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_feed_cache_userId_fkey') THEN
        ALTER TABLE "timeline_feed_cache" ADD CONSTRAINT "timeline_feed_cache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'timeline_feed_cache_postId_fkey') THEN
        ALTER TABLE "timeline_feed_cache" ADD CONSTRAINT "timeline_feed_cache_postId_fkey" FOREIGN KEY ("postId") REFERENCES "timeline_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
