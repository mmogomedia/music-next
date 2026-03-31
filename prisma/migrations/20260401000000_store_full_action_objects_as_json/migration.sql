-- Change blockedRevenue and rankedActions from String[] to JSONB
-- so full action/revenue objects survive a page reload instead of just IDs

ALTER TABLE "decision_results"
  ALTER COLUMN "blockedRevenue" DROP DEFAULT,
  ALTER COLUMN "rankedActions"  DROP DEFAULT;

ALTER TABLE "decision_results"
  ALTER COLUMN "blockedRevenue" TYPE JSONB USING to_jsonb("blockedRevenue"),
  ALTER COLUMN "rankedActions"  TYPE JSONB USING to_jsonb("rankedActions");
