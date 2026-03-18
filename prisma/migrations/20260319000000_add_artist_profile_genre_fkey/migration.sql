-- Add missing foreign key from artist_profiles.genreId to genres.id
-- This FK was defined in the Prisma schema but was never captured in a migration file.
-- The genreId column was added in 20250125000000_add_artist_profile_location_fields
-- and the genres table was created in 20251106102529_add_genres_model, but the FK
-- constraint between them was applied via db push and not recorded as a migration.

ALTER TABLE "artist_profiles"
  ADD CONSTRAINT "artist_profiles_genreId_fkey"
  FOREIGN KEY ("genreId")
  REFERENCES "genres"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
