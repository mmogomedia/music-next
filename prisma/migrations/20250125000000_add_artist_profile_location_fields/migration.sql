-- Add location fields to artist_profiles table if they don't exist
-- This is an idempotent migration that can be safely run multiple times

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'artist_profiles' 
        AND column_name = 'country'
    ) THEN
        ALTER TABLE "artist_profiles" ADD COLUMN "country" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'artist_profiles' 
        AND column_name = 'province'
    ) THEN
        ALTER TABLE "artist_profiles" ADD COLUMN "province" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'artist_profiles' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE "artist_profiles" ADD COLUMN "city" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'artist_profiles' 
        AND column_name = 'genreId'
    ) THEN
        ALTER TABLE "artist_profiles" ADD COLUMN "genreId" TEXT;
    END IF;
END $$;

