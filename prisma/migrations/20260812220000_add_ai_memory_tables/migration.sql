-- Add the AI memory-system tables that exist in schema.prisma but in no migration.
--
-- These four tables (conversation_embeddings, conversation_entities,
-- user_preferences, user_memory_profiles), two enums and their indexes were
-- pushed straight to the dev database and never captured as a migration, so a
-- database rebuilt from migrations alone came out MISSING them. Dev and prod
-- already have them, which is why nobody noticed.
--
-- Every statement is idempotent (IF NOT EXISTS / pg_catalog guards), so this is
-- a strict no-op on any database that already has them.
--
-- DELIBERATELY NOT INCLUDED —  also emitted these, and
-- applying them would be destructive or gratuitous:
--
--   DROP INDEX "articles_embedding_hnsw_idx";
--   DROP INDEX "tracks_embedding_hnsw_idx";
--       Prisma wants to drop both because the columns are
--       Unsupported("vector(1536)") and it cannot represent an HNSW index on
--       them. They ARE real, created by 20260228000000 and 20260305120000.
--       Applying the diff would silently turn every vector search into a
--       sequential scan. Anyone regenerating drift SQL must strip these again.
--
--   ALTER TABLE "site_profile"  ALTER COLUMN "id" SET DEFAULT ...
--   ALTER TABLE "split_sheets" ALTER COLUMN "updatedAt" DROP DEFAULT;
--   ALTER TABLE "tools"        ALTER COLUMN "updatedAt" DROP DEFAULT;
--       Cosmetic default differences that would MUTATE existing databases for
--       no behavioural gain. Left alone on purpose.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PreferenceType') THEN
        CREATE TYPE "PreferenceType" AS ENUM ('GENRE', 'ARTIST', 'TRACK', 'MOOD', 'TEMPO', 'ERA', 'LANGUAGE', 'INSTRUMENT');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EntityType') THEN
        CREATE TYPE "EntityType" AS ENUM ('ARTIST', 'TRACK', 'ALBUM', 'PLAYLIST', 'GENRE', 'MOOD', 'LOCATION', 'EVENT');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "conversation_embeddings" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT,
    "summary" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "messageCount" INTEGER NOT NULL DEFAULT 1,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_embeddings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PreferenceType" NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT NOT NULL,
    "explicitScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "implicitScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "halfLifeDays" INTEGER NOT NULL DEFAULT 30,
    "sentiment" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conversation_entities" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT NOT NULL,
    "mentions" INTEGER NOT NULL DEFAULT 1,
    "context" TEXT NOT NULL,
    "sentiment" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "firstMentioned" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMentioned" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_entities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_memory_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "favoriteGenres" JSONB NOT NULL,
    "favoriteArtists" JSONB NOT NULL,
    "favoriteMoods" JSONB NOT NULL,
    "listeningTimes" JSONB NOT NULL,
    "averageSessionLength" INTEGER NOT NULL DEFAULT 0,
    "preferredQueryStyle" TEXT,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3) NOT NULL,
    "profileCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_memory_profiles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "conversation_embeddings_conversationId_idx" ON "conversation_embeddings"("conversationId");

CREATE INDEX IF NOT EXISTS "conversation_embeddings_userId_idx" ON "conversation_embeddings"("userId");

CREATE INDEX IF NOT EXISTS "conversation_embeddings_importance_idx" ON "conversation_embeddings"("importance");

CREATE INDEX IF NOT EXISTS "conversation_embeddings_startTime_idx" ON "conversation_embeddings"("startTime");

CREATE INDEX IF NOT EXISTS "user_preferences_userId_type_idx" ON "user_preferences"("userId", "type");

CREATE INDEX IF NOT EXISTS "user_preferences_userId_lastSeenAt_idx" ON "user_preferences"("userId", "lastSeenAt");

CREATE UNIQUE INDEX IF NOT EXISTS "user_preferences_userId_type_entityName_key" ON "user_preferences"("userId", "type", "entityName");

CREATE INDEX IF NOT EXISTS "conversation_entities_userId_entityType_idx" ON "conversation_entities"("userId", "entityType");

CREATE INDEX IF NOT EXISTS "conversation_entities_conversationId_idx" ON "conversation_entities"("conversationId");

CREATE INDEX IF NOT EXISTS "conversation_entities_entityId_idx" ON "conversation_entities"("entityId");

CREATE UNIQUE INDEX IF NOT EXISTS "user_memory_profiles_userId_key" ON "user_memory_profiles"("userId");

CREATE INDEX IF NOT EXISTS "article_clusters_slug_idx" ON "article_clusters"("slug");

CREATE INDEX IF NOT EXISTS "articles_slug_idx" ON "articles"("slug");

CREATE INDEX IF NOT EXISTS "tracks_title_idx" ON "tracks"("title");

CREATE INDEX IF NOT EXISTS "tracks_artist_idx" ON "tracks"("artist");

CREATE INDEX IF NOT EXISTS "tracks_genreId_idx" ON "tracks"("genreId");

CREATE INDEX IF NOT EXISTS "tracks_strength_idx" ON "tracks"("strength");

CREATE INDEX IF NOT EXISTS "tracks_playCount_idx" ON "tracks"("playCount");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversation_embeddings_userId_fkey') THEN
        ALTER TABLE "conversation_embeddings" ADD CONSTRAINT "conversation_embeddings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversation_embeddings_conversationId_fkey') THEN
        ALTER TABLE "conversation_embeddings" ADD CONSTRAINT "conversation_embeddings_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversation_embeddings_messageId_fkey') THEN
        ALTER TABLE "conversation_embeddings" ADD CONSTRAINT "conversation_embeddings_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ai_conversation_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_preferences_userId_fkey') THEN
        ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversation_entities_userId_fkey') THEN
        ALTER TABLE "conversation_entities" ADD CONSTRAINT "conversation_entities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversation_entities_conversationId_fkey') THEN
        ALTER TABLE "conversation_entities" ADD CONSTRAINT "conversation_entities_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_memory_profiles_userId_fkey') THEN
        ALTER TABLE "user_memory_profiles" ADD CONSTRAINT "user_memory_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
