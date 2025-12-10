-- Add minStrength column to playlists table if it doesn't exist
-- This is an idempotent migration that can be safely run multiple times

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'playlists' 
        AND column_name = 'minStrength'
    ) THEN
        ALTER TABLE "playlists" ADD COLUMN "minStrength" INTEGER;
    END IF;
END $$;

