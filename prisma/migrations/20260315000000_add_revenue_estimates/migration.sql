-- CreateTable
CREATE TABLE "revenue_estimates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Untitled',
    "streams" JSONB NOT NULL DEFAULT '{}',
    "zarRate" DOUBLE PRECISION NOT NULL DEFAULT 18.5,
    "splitSheetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_estimates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "revenue_estimates" ADD CONSTRAINT "revenue_estimates_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_estimates" ADD CONSTRAINT "revenue_estimates_splitSheetId_fkey"
  FOREIGN KEY ("splitSheetId") REFERENCES "split_sheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "revenue_estimates_userId_idx" ON "revenue_estimates"("userId");

-- CreateIndex
CREATE INDEX "revenue_estimates_splitSheetId_idx" ON "revenue_estimates"("splitSheetId");
