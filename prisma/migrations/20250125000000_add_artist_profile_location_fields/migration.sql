-- Add location fields to artist_profiles table if they don't exist
-- This is an idempotent migration that can be safely run multiple times

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'artist_profiles'
        AND column_name = 'country'
    ) AND EXISTS (
        -- table-existence guard: 'artist_profiles' is created by a LATER-timestamped
        -- migration, so a fresh replay reaches here before it exists.
        SELECT 1 FROM information_schema.tables WHERE table_name = 'artist_profiles'
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
    ) AND EXISTS (
        -- table-existence guard: 'artist_profiles' is created by a LATER-timestamped
        -- migration, so a fresh replay reaches here before it exists.
        SELECT 1 FROM information_schema.tables WHERE table_name = 'artist_profiles'
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
    ) AND EXISTS (
        -- table-existence guard: 'artist_profiles' is created by a LATER-timestamped
        -- migration, so a fresh replay reaches here before it exists.
        SELECT 1 FROM information_schema.tables WHERE table_name = 'artist_profiles'
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
    ) AND EXISTS (
        -- table-existence guard: 'artist_profiles' is created by a LATER-timestamped
        -- migration, so a fresh replay reaches here before it exists.
        SELECT 1 FROM information_schema.tables WHERE table_name = 'artist_profiles'
    ) THEN
        ALTER TABLE "artist_profiles" ADD COLUMN "genreId" TEXT;
    END IF;
END $$;

