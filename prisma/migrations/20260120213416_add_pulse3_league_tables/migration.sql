-- AlterTable: Add component score fields to pulse_eligibility_scores
ALTER TABLE "pulse_eligibility_scores" ADD COLUMN "followerScore" DOUBLE PRECISION;
ALTER TABLE "pulse_eligibility_scores" ADD COLUMN "engagementScore" DOUBLE PRECISION;
ALTER TABLE "pulse_eligibility_scores" ADD COLUMN "consistencyScore" DOUBLE PRECISION;
ALTER TABLE "pulse_eligibility_scores" ADD COLUMN "platformDiversityScore" DOUBLE PRECISION;

-- CreateEnum
CREATE TYPE "LeagueRunType" AS ENUM ('SCHEDULED', 'MANUAL');

-- CreateEnum
CREATE TYPE "LeagueBandState" AS ENUM ('SECURE', 'BELOW_RANGE', 'ABOVE_RANGE');

-- CreateEnum
CREATE TYPE "LeagueStatusChange" AS ENUM ('NEW', 'UP', 'DOWN', 'UNCHANGED', 'PROMOTED', 'DEMOTED', 'EXITED');

-- CreateTable
CREATE TABLE "league_tiers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetSize" INTEGER NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION,
    "refreshIntervalHours" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_runs" (
    "id" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "runType" "LeagueRunType" NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_entries" (
    "id" TEXT NOT NULL,
    "leagueRunId" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "bandState" "LeagueBandState" NOT NULL,
    "isAtRisk" BOOLEAN NOT NULL,
    "previousRank" INTEGER,
    "rankDelta" INTEGER,
    "statusChange" "LeagueStatusChange" NOT NULL,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "league_tiers_code_key" ON "league_tiers"("code");

-- CreateIndex
CREATE INDEX "league_tiers_code_idx" ON "league_tiers"("code");

-- CreateIndex
CREATE INDEX "league_tiers_isActive_idx" ON "league_tiers"("isActive");

-- CreateIndex
CREATE INDEX "league_tiers_sortOrder_idx" ON "league_tiers"("sortOrder");

-- CreateIndex
CREATE INDEX "league_runs_tierId_idx" ON "league_runs"("tierId");

-- CreateIndex
CREATE INDEX "league_runs_runAt_idx" ON "league_runs"("runAt");

-- CreateIndex
CREATE INDEX "league_runs_runType_idx" ON "league_runs"("runType");

-- CreateIndex
CREATE INDEX "league_entries_leagueRunId_idx" ON "league_entries"("leagueRunId");

-- CreateIndex
CREATE INDEX "league_entries_artistProfileId_idx" ON "league_entries"("artistProfileId");

-- CreateIndex
CREATE INDEX "league_entries_rank_idx" ON "league_entries"("rank");

-- CreateIndex
CREATE INDEX "league_entries_bandState_idx" ON "league_entries"("bandState");

-- AddForeignKey
ALTER TABLE "league_runs" ADD CONSTRAINT "league_runs_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "league_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_entries" ADD CONSTRAINT "league_entries_leagueRunId_fkey" FOREIGN KEY ("leagueRunId") REFERENCES "league_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_entries" ADD CONSTRAINT "league_entries_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
