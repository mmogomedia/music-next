-- CreateTable (idempotent to support baseline resets)
CREATE TABLE IF NOT EXISTS "track_completion_rules" (
    "id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "description" TEXT,
    "group" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "track_completion_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "track_completion_rules_field_key" ON "track_completion_rules"("field");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "track_completion_rules_category_idx" ON "track_completion_rules"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "track_completion_rules_isActive_idx" ON "track_completion_rules"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "track_completion_rules_order_idx" ON "track_completion_rules"("order");

