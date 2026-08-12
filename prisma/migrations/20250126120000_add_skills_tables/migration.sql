-- CreateTable
CREATE TABLE "skills" (
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

-- CreateTable
CREATE TABLE "artist_profile_skills" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_profile_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "skills_isActive_order_idx" ON "skills"("isActive", "order");

-- CreateIndex
CREATE UNIQUE INDEX "artist_profile_skills_artistProfileId_skillId_key" ON "artist_profile_skills"("artistProfileId", "skillId");

-- CreateIndex
CREATE INDEX "artist_profile_skills_artistProfileId_idx" ON "artist_profile_skills"("artistProfileId");

-- CreateIndex
CREATE INDEX "artist_profile_skills_skillId_idx" ON "artist_profile_skills"("skillId");

-- AddForeignKey
-- GUARDED: "artist_profiles" is created by 20250909183449_add_playlist_system,
-- which sorts AFTER this migration, so on a fresh replay the table does not
-- exist yet and this FK aborted the whole chain. Existing databases already
-- applied this migration and never re-run it. Fresh databases get the FK from
-- 20250909190000_repair_out_of_order_schema once the table exists.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'artist_profiles'
    ) THEN
        ALTER TABLE "artist_profile_skills" ADD CONSTRAINT "artist_profile_skills_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
ALTER TABLE "artist_profile_skills" ADD CONSTRAINT "artist_profile_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
