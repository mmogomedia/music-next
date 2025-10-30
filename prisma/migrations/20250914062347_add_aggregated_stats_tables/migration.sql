-- CreateTable
CREATE TABLE "daily_stats" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalPlays" INTEGER NOT NULL DEFAULT 0,
    "uniquePlays" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "totalDownloads" INTEGER NOT NULL DEFAULT 0,
    "totalSaves" INTEGER NOT NULL DEFAULT 0,
    "avgDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skipRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "replayRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_stats" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "totalPlays" INTEGER NOT NULL DEFAULT 0,
    "uniquePlays" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "totalDownloads" INTEGER NOT NULL DEFAULT 0,
    "totalSaves" INTEGER NOT NULL DEFAULT 0,
    "avgDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skipRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "replayRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_stats" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "monthStart" DATE NOT NULL,
    "totalPlays" INTEGER NOT NULL DEFAULT 0,
    "uniquePlays" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "totalDownloads" INTEGER NOT NULL DEFAULT 0,
    "totalSaves" INTEGER NOT NULL DEFAULT 0,
    "avgDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skipRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "replayRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yearly_stats" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalPlays" INTEGER NOT NULL DEFAULT 0,
    "uniquePlays" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "totalDownloads" INTEGER NOT NULL DEFAULT 0,
    "totalSaves" INTEGER NOT NULL DEFAULT 0,
    "avgDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skipRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "replayRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "yearly_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_stats_date_idx" ON "daily_stats"("date");

-- CreateIndex
CREATE INDEX "daily_stats_trackId_idx" ON "daily_stats"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_stats_trackId_date_key" ON "daily_stats"("trackId", "date");

-- CreateIndex
CREATE INDEX "weekly_stats_weekStart_idx" ON "weekly_stats"("weekStart");

-- CreateIndex
CREATE INDEX "weekly_stats_trackId_idx" ON "weekly_stats"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_stats_trackId_weekStart_key" ON "weekly_stats"("trackId", "weekStart");

-- CreateIndex
CREATE INDEX "monthly_stats_monthStart_idx" ON "monthly_stats"("monthStart");

-- CreateIndex
CREATE INDEX "monthly_stats_trackId_idx" ON "monthly_stats"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_stats_trackId_monthStart_key" ON "monthly_stats"("trackId", "monthStart");

-- CreateIndex
CREATE INDEX "yearly_stats_year_idx" ON "yearly_stats"("year");

-- CreateIndex
CREATE INDEX "yearly_stats_trackId_idx" ON "yearly_stats"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "yearly_stats_trackId_year_key" ON "yearly_stats"("trackId", "year");

-- AddForeignKey
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_stats" ADD CONSTRAINT "weekly_stats_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_stats" ADD CONSTRAINT "monthly_stats_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yearly_stats" ADD CONSTRAINT "yearly_stats_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
