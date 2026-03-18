-- CreateTable
CREATE TABLE "pulse_eligibility_scores" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pulse_eligibility_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pulse_momentum_scores" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "position" INTEGER,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pulse_momentum_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pulse_monitoring_status" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "isActivelyMonitored" BOOLEAN NOT NULL DEFAULT false,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pulse_monitoring_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pulse_platform_data" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pulse_platform_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pulse_eligibility_scores_score_idx" ON "pulse_eligibility_scores"("score");

-- CreateIndex
CREATE INDEX "pulse_eligibility_scores_rank_idx" ON "pulse_eligibility_scores"("rank");

-- CreateIndex
CREATE INDEX "pulse_eligibility_scores_artistProfileId_idx" ON "pulse_eligibility_scores"("artistProfileId");

-- CreateIndex
CREATE INDEX "pulse_eligibility_scores_calculatedAt_idx" ON "pulse_eligibility_scores"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "pulse_eligibility_scores_artistProfileId_calculatedAt_key" ON "pulse_eligibility_scores"("artistProfileId", "calculatedAt");

-- CreateIndex
CREATE INDEX "pulse_momentum_scores_score_idx" ON "pulse_momentum_scores"("score");

-- CreateIndex
CREATE INDEX "pulse_momentum_scores_position_idx" ON "pulse_momentum_scores"("position");

-- CreateIndex
CREATE INDEX "pulse_momentum_scores_artistProfileId_idx" ON "pulse_momentum_scores"("artistProfileId");

-- CreateIndex
CREATE INDEX "pulse_momentum_scores_calculatedAt_idx" ON "pulse_momentum_scores"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "pulse_momentum_scores_artistProfileId_calculatedAt_key" ON "pulse_momentum_scores"("artistProfileId", "calculatedAt");

-- CreateIndex
CREATE INDEX "pulse_monitoring_status_isActivelyMonitored_idx" ON "pulse_monitoring_status"("isActivelyMonitored");

-- CreateIndex
CREATE INDEX "pulse_monitoring_status_artistProfileId_idx" ON "pulse_monitoring_status"("artistProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "pulse_monitoring_status_artistProfileId_key" ON "pulse_monitoring_status"("artistProfileId");

-- CreateIndex
CREATE INDEX "pulse_platform_data_artistProfileId_idx" ON "pulse_platform_data"("artistProfileId");

-- CreateIndex
CREATE INDEX "pulse_platform_data_platform_idx" ON "pulse_platform_data"("platform");

-- CreateIndex
CREATE INDEX "pulse_platform_data_fetchedAt_idx" ON "pulse_platform_data"("fetchedAt");

-- AddForeignKey
ALTER TABLE "pulse_eligibility_scores" ADD CONSTRAINT "pulse_eligibility_scores_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pulse_momentum_scores" ADD CONSTRAINT "pulse_momentum_scores_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pulse_monitoring_status" ADD CONSTRAINT "pulse_monitoring_status_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pulse_platform_data" ADD CONSTRAINT "pulse_platform_data_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
