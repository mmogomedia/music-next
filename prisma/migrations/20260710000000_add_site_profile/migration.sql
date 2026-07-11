-- Editable site identity (singleton, id = 'default'). Read by generateMetadata
-- and by the get_site_profile / set_site_profile MCP tools.
CREATE TABLE "site_profile" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_profile_pkey" PRIMARY KEY ("id")
);
