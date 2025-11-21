-- Add genreId and location fields to artist_profiles
ALTER TABLE "artist_profiles" ADD COLUMN "genreId" TEXT;
ALTER TABLE "artist_profiles" ADD COLUMN "country" TEXT;
ALTER TABLE "artist_profiles" ADD COLUMN "province" TEXT;
ALTER TABLE "artist_profiles" ADD COLUMN "city" TEXT;

-- Add foreign key for genreId
ALTER TABLE "artist_profiles" ADD CONSTRAINT "artist_profiles_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create skills table
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

-- Create unique constraints for skills
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- Create index for skills
CREATE INDEX "skills_isActive_order_idx" ON "skills"("isActive", "order");

-- Create artist_profile_skills junction table
CREATE TABLE "artist_profile_skills" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_profile_skills_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for artist_profile_skills
CREATE UNIQUE INDEX "artist_profile_skills_artistProfileId_skillId_key" ON "artist_profile_skills"("artistProfileId", "skillId");

-- Create indexes for artist_profile_skills
CREATE INDEX "artist_profile_skills_artistProfileId_idx" ON "artist_profile_skills"("artistProfileId");
CREATE INDEX "artist_profile_skills_skillId_idx" ON "artist_profile_skills"("skillId");

-- Add foreign keys for artist_profile_skills
ALTER TABLE "artist_profile_skills" ADD CONSTRAINT "artist_profile_skills_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "artist_profile_skills" ADD CONSTRAINT "artist_profile_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

