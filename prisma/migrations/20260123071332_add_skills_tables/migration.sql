-- This migration was created to resolve a missing migration file error.
-- The skills tables were already created in migration 20250126120000_add_skills_tables.
-- This migration is idempotent and will not create duplicate tables.

-- CreateTable (idempotent - only creates if not exists)
CREATE TABLE IF NOT EXISTS "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotent - only creates if not exists)
CREATE TABLE IF NOT EXISTS "artist_profile_skills" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_profile_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent - only creates if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'skills_name_key') THEN
        CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'skills_slug_key') THEN
        CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'skills_isActive_order_idx') THEN
        CREATE INDEX "skills_isActive_order_idx" ON "skills"("isActive", "order");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'artist_profile_skills_artistProfileId_skillId_key') THEN
        CREATE UNIQUE INDEX "artist_profile_skills_artistProfileId_skillId_key" ON "artist_profile_skills"("artistProfileId", "skillId");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'artist_profile_skills_artistProfileId_idx') THEN
        CREATE INDEX "artist_profile_skills_artistProfileId_idx" ON "artist_profile_skills"("artistProfileId");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'artist_profile_skills_skillId_idx') THEN
        CREATE INDEX "artist_profile_skills_skillId_idx" ON "artist_profile_skills"("skillId");
    END IF;
END $$;

-- AddForeignKey (idempotent - only adds if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'artist_profile_skills_artistProfileId_fkey'
    ) THEN
        ALTER TABLE "artist_profile_skills" 
        ADD CONSTRAINT "artist_profile_skills_artistProfileId_fkey" 
        FOREIGN KEY ("artistProfileId") 
        REFERENCES "artist_profiles"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'artist_profile_skills_skillId_fkey'
    ) THEN
        ALTER TABLE "artist_profile_skills" 
        ADD CONSTRAINT "artist_profile_skills_skillId_fkey" 
        FOREIGN KEY ("skillId") 
        REFERENCES "skills"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
