-- Repair: add the artist_profiles foreign keys that a fresh replay skips.
--
-- WHY THIS EXISTS
-- ---------------
-- `artist_profiles` is created by 20250909183449_add_playlist_system, but five
-- foreign keys pointing at it live in migrations timestamped EIGHT MONTHS
-- EARLIER (20250116190000_add_pulse3_scoring_tables and
-- 20250126120000_add_skills_tables). Prisma applies migrations in lexical
-- order, so on an empty database the chain died on the third migration with
-- `42P01 relation "artist_profiles" does not exist`. No environment could be
-- rebuilt from migrations alone — disaster recovery, a new contributor's
-- laptop, or a throwaway CI database all hit the same wall.
--
-- Those five statements are now wrapped in `IF EXISTS (artist_profiles)`
-- guards, so a fresh replay skips them instead of aborting. This migration
-- adds them back once the table genuinely exists.
--
-- Existing databases (dev, prod) already applied those migrations and never
-- re-run them, so for them every block below is a no-op: the constraints are
-- already present and the `pg_constraint` check short-circuits. That is also
-- why editing the historical files is safe here — `prisma migrate deploy` does
-- not verify checksums of already-applied migrations (verified empirically
-- before relying on it).
--
-- Each block is idempotent and independently guarded, so this is safe to
-- re-run and safe on a database in any intermediate state.

-- pulse_eligibility_scores.artistProfileId -> artist_profiles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pulse_eligibility_scores_artistProfileId_fkey'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'pulse_eligibility_scores'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'artist_profiles'
    ) THEN
        ALTER TABLE "pulse_eligibility_scores"
            ADD CONSTRAINT "pulse_eligibility_scores_artistProfileId_fkey"
            FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- pulse_momentum_scores.artistProfileId -> artist_profiles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pulse_momentum_scores_artistProfileId_fkey'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'pulse_momentum_scores'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'artist_profiles'
    ) THEN
        ALTER TABLE "pulse_momentum_scores"
            ADD CONSTRAINT "pulse_momentum_scores_artistProfileId_fkey"
            FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- pulse_monitoring_status.artistProfileId -> artist_profiles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pulse_monitoring_status_artistProfileId_fkey'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'pulse_monitoring_status'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'artist_profiles'
    ) THEN
        ALTER TABLE "pulse_monitoring_status"
            ADD CONSTRAINT "pulse_monitoring_status_artistProfileId_fkey"
            FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- pulse_platform_data.artistProfileId -> artist_profiles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pulse_platform_data_artistProfileId_fkey'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'pulse_platform_data'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'artist_profiles'
    ) THEN
        ALTER TABLE "pulse_platform_data"
            ADD CONSTRAINT "pulse_platform_data_artistProfileId_fkey"
            FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- artist_profile_skills.artistProfileId -> artist_profiles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'artist_profile_skills_artistProfileId_fkey'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'artist_profile_skills'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'artist_profiles'
    ) THEN
        ALTER TABLE "artist_profile_skills"
            ADD CONSTRAINT "artist_profile_skills_artistProfileId_fkey"
            FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Columns skipped by the same ordering problem.
--
-- 20250124000000 adds playlists."minStrength" and 20250125000000 adds four
-- artist_profiles location columns. Both already guarded on the COLUMN not
-- existing, but not on the TABLE existing — so on a fresh replay they aborted
-- rather than skipping. Both now carry table-existence guards too, and the
-- columns are (re)added here once the tables are real.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playlists')
       AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'playlists' AND column_name = 'minStrength'
    ) THEN
        ALTER TABLE "playlists" ADD COLUMN "minStrength" INTEGER;
    END IF;
END $$;

DO $$
DECLARE
    col TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artist_profiles') THEN
        FOREACH col IN ARRAY ARRAY['country', 'province', 'city', 'genreId'] LOOP
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'artist_profiles' AND column_name = col
            ) THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN %I TEXT', 'artist_profiles', col);
            END IF;
        END LOOP;
    END IF;
END $$;
