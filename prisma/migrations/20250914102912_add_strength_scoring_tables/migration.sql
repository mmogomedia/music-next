-- CreateTable
CREATE TABLE "artist_strength_scores" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "timeRange" TEXT NOT NULL,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "growthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "potentialScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_strength_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_metrics" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "timeRange" TEXT NOT NULL,
    "totalPlays" INTEGER NOT NULL DEFAULT 0,
    "uniquePlays" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "totalDownloads" INTEGER NOT NULL DEFAULT 0,
    "totalSaves" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skipRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "replayRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "growthVelocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viralCoefficient" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "geographicReach" INTEGER NOT NULL DEFAULT 0,
    "crossPlatformScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_trends" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "timeRange" TEXT NOT NULL,
    "playTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "growthTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viralTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "geographicTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_trends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "artist_strength_scores_timeRange_idx" ON "artist_strength_scores"("timeRange");

-- CreateIndex
CREATE INDEX "artist_strength_scores_artistId_idx" ON "artist_strength_scores"("artistId");

-- CreateIndex
CREATE INDEX "artist_strength_scores_overallScore_idx" ON "artist_strength_scores"("overallScore");

-- CreateIndex
CREATE UNIQUE INDEX "artist_strength_scores_artistId_timeRange_key" ON "artist_strength_scores"("artistId", "timeRange");

-- CreateIndex
CREATE INDEX "artist_metrics_timeRange_idx" ON "artist_metrics"("timeRange");

-- CreateIndex
CREATE INDEX "artist_metrics_artistId_idx" ON "artist_metrics"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "artist_metrics_artistId_timeRange_key" ON "artist_metrics"("artistId", "timeRange");

-- CreateIndex
CREATE INDEX "artist_trends_timeRange_idx" ON "artist_trends"("timeRange");

-- CreateIndex
CREATE INDEX "artist_trends_artistId_idx" ON "artist_trends"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "artist_trends_artistId_timeRange_key" ON "artist_trends"("artistId", "timeRange");

-- AddForeignKey
ALTER TABLE "artist_strength_scores" ADD CONSTRAINT "artist_strength_scores_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_metrics" ADD CONSTRAINT "artist_metrics_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_trends" ADD CONSTRAINT "artist_trends_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
