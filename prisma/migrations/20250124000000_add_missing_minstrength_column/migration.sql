-- Add minStrength column to playlists table if it doesn't exist
-- This is an idempotent migration that can be safely run multiple times

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'playlists'
        AND column_name = 'minStrength'
    ) AND EXISTS (
        -- table-existence guard: 'playlists' is created by a LATER-timestamped
        -- migration, so a fresh replay reaches here before it exists.
        SELECT 1 FROM information_schema.tables WHERE table_name = 'playlists'
    ) THEN
        ALTER TABLE "playlists" ADD COLUMN "minStrength" INTEGER;
    END IF;
END $$;

