-- Idempotent migration: Check if enums exist before creating them

-- CreateEnum UserRole (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('USER', 'ARTIST', 'ADMIN');
    END IF;
END $$;

-- CreateEnum Platform (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Platform') THEN
        CREATE TYPE "Platform" AS ENUM ('SPOTIFY', 'APPLE_MUSIC', 'YOUTUBE', 'SOUNDCLOUD');
    END IF;
END $$;

-- CreateTable Account (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable Session (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable users (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable VerificationToken (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable tracks (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "tracks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "genre" TEXT NOT NULL,
    "album" TEXT,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable play_events (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "play_events" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "userId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "play_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable smart_links (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "smart_links" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smart_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable platform_links (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "platform_links" (
    "id" TEXT NOT NULL,
    "smartLinkId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "url" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent - will fail silently if exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Account_provider_providerAccountId_key') THEN
        CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Session_sessionToken_key') THEN
        CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'users_email_key') THEN
        CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'VerificationToken_token_key') THEN
        CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'VerificationToken_identifier_token_key') THEN
        CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'smart_links_slug_key') THEN
        CREATE UNIQUE INDEX "smart_links_slug_key" ON "smart_links"("slug");
    END IF;
END $$;

-- AddForeignKey (idempotent - will fail silently if exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Account_userId_fkey'
    ) THEN
        ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Session_userId_fkey'
    ) THEN
        ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    -- Only add foreign key if artistId column exists (old schema)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracks' 
        AND column_name = 'artistId'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tracks_artistId_fkey'
    ) THEN
        ALTER TABLE "tracks" ADD CONSTRAINT "tracks_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'play_events_trackId_fkey'
    ) THEN
        ALTER TABLE "play_events" ADD CONSTRAINT "play_events_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'play_events_userId_fkey'
    ) THEN
        ALTER TABLE "play_events" ADD CONSTRAINT "play_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'smart_links_trackId_fkey'
    ) THEN
        ALTER TABLE "smart_links" ADD CONSTRAINT "smart_links_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'smart_links_userId_fkey'
    ) THEN
        ALTER TABLE "smart_links" ADD CONSTRAINT "smart_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'platform_links_smartLinkId_fkey'
    ) THEN
        ALTER TABLE "platform_links" ADD CONSTRAINT "platform_links_smartLinkId_fkey" FOREIGN KEY ("smartLinkId") REFERENCES "smart_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
