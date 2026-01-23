-- Seed league tiers (TIER1 and TIER2)
-- Uses INSERT ... ON CONFLICT to handle existing tiers gracefully
-- If tiers already exist, they will be updated with the correct values
-- IDs are generated as cuid-like strings (25 chars starting with 'cl')

-- Insert or update TIER1 (Top 20)
INSERT INTO "league_tiers" (
    "id",
    "code",
    "name",
    "targetSize",
    "minScore",
    "maxScore",
    "refreshIntervalHours",
    "isActive",
    "sortOrder",
    "createdAt",
    "updatedAt"
) 
SELECT
    COALESCE(existing."id", 'cl' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 23)),
    'TIER1',
    'Top 20',
    20,
    70.0,
    NULL,
    24,
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (SELECT "id" FROM "league_tiers" WHERE "code" = 'TIER1' LIMIT 1) existing
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "targetSize" = EXCLUDED."targetSize",
    "minScore" = EXCLUDED."minScore",
    "maxScore" = EXCLUDED."maxScore",
    "refreshIntervalHours" = EXCLUDED."refreshIntervalHours",
    "isActive" = EXCLUDED."isActive",
    "sortOrder" = EXCLUDED."sortOrder",
    "updatedAt" = CURRENT_TIMESTAMP;

-- Insert or update TIER2 (Watchlist)
INSERT INTO "league_tiers" (
    "id",
    "code",
    "name",
    "targetSize",
    "minScore",
    "maxScore",
    "refreshIntervalHours",
    "isActive",
    "sortOrder",
    "createdAt",
    "updatedAt"
)
SELECT
    COALESCE(existing."id", 'cl' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 23)),
    'TIER2',
    'Watchlist',
    100,
    50.0,
    70.0,
    12,
    true,
    2,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (SELECT "id" FROM "league_tiers" WHERE "code" = 'TIER2' LIMIT 1) existing
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "targetSize" = EXCLUDED."targetSize",
    "minScore" = EXCLUDED."minScore",
    "maxScore" = EXCLUDED."maxScore",
    "refreshIntervalHours" = EXCLUDED."refreshIntervalHours",
    "isActive" = EXCLUDED."isActive",
    "sortOrder" = EXCLUDED."sortOrder",
    "updatedAt" = CURRENT_TIMESTAMP;
