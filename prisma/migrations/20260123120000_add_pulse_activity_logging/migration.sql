-- CreateTable
CREATE TABLE "pulse_eligibility_recalc_logs" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "totalDurationMs" INTEGER,
    "artistsProcessed" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "rateLimitCount" INTEGER NOT NULL DEFAULT 0,
    "top100Updated" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'running',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pulse_eligibility_recalc_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pulse_eligibility_recalc_artist_logs" (
    "id" TEXT NOT NULL,
    "recalcLogId" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "score" DOUBLE PRECISION,
    "rank" INTEGER,
    "rateLimited" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "tiktokUserInfoFetched" BOOLEAN NOT NULL DEFAULT false,
    "tiktokVideosFetched" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pulse_eligibility_recalc_artist_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pulse_league_run_logs" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "totalDurationMs" INTEGER,
    "tiersProcessed" INTEGER NOT NULL DEFAULT 0,
    "tiersSkipped" INTEGER NOT NULL DEFAULT 0,
    "tiersErrored" INTEGER NOT NULL DEFAULT 0,
    "entriesCreated" INTEGER NOT NULL DEFAULT 0,
    "promotionsProcessed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'running',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pulse_league_run_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pulse_eligibility_recalc_logs_startedAt_idx" ON "pulse_eligibility_recalc_logs"("startedAt");

-- CreateIndex
CREATE INDEX "pulse_eligibility_recalc_logs_status_idx" ON "pulse_eligibility_recalc_logs"("status");

-- CreateIndex
CREATE INDEX "pulse_eligibility_recalc_artist_logs_recalcLogId_idx" ON "pulse_eligibility_recalc_artist_logs"("recalcLogId");

-- CreateIndex
CREATE INDEX "pulse_eligibility_recalc_artist_logs_artistProfileId_idx" ON "pulse_eligibility_recalc_artist_logs"("artistProfileId");

-- CreateIndex
CREATE INDEX "pulse_eligibility_recalc_artist_logs_startedAt_idx" ON "pulse_eligibility_recalc_artist_logs"("startedAt");

-- CreateIndex
CREATE INDEX "pulse_eligibility_recalc_artist_logs_success_idx" ON "pulse_eligibility_recalc_artist_logs"("success");

-- CreateIndex
CREATE INDEX "pulse_league_run_logs_startedAt_idx" ON "pulse_league_run_logs"("startedAt");

-- CreateIndex
CREATE INDEX "pulse_league_run_logs_status_idx" ON "pulse_league_run_logs"("status");

-- AddForeignKey
ALTER TABLE "pulse_eligibility_recalc_artist_logs" ADD CONSTRAINT "pulse_eligibility_recalc_artist_logs_recalcLogId_fkey" FOREIGN KEY ("recalcLogId") REFERENCES "pulse_eligibility_recalc_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pulse_eligibility_recalc_artist_logs" ADD CONSTRAINT "pulse_eligibility_recalc_artist_logs_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
