-- Add optional trackId to split_sheets
ALTER TABLE "split_sheets" ADD COLUMN "trackId" TEXT;

-- Foreign key to tracks
ALTER TABLE "split_sheets"
  ADD CONSTRAINT "split_sheets_trackId_fkey"
  FOREIGN KEY ("trackId") REFERENCES "tracks"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for lookups
CREATE INDEX "split_sheets_trackId_idx" ON "split_sheets"("trackId");
