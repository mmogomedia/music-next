-- CreateTable: split_sheets
CREATE TABLE "split_sheets" (
    "id"               TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "name"             TEXT NOT NULL DEFAULT 'Untitled',
    "songTitle"        TEXT NOT NULL DEFAULT '',
    "songDate"         TEXT NOT NULL DEFAULT '',
    "masterSplits"     JSONB NOT NULL DEFAULT '[]',
    "publishingSplits" JSONB NOT NULL DEFAULT '[]',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "split_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "split_sheets_userId_idx" ON "split_sheets"("userId");

-- AddForeignKey
ALTER TABLE "split_sheets"
    ADD CONSTRAINT "split_sheets_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
