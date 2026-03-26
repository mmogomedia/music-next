-- CreateEnum
CREATE TYPE "ArtistType" AS ENUM ('INDEPENDENT', 'SESSION_PRODUCER', 'SIGNED_ARTIST', 'PERFORMER', 'SONGWRITER', 'HYBRID');

-- CreateEnum
CREATE TYPE "CareerStage" AS ENUM ('STARTING', 'EMERGING', 'DEVELOPING', 'ESTABLISHED');

-- CreateEnum
CREATE TYPE "RevenueModel" AS ENUM ('LIVE_PERFORMER', 'STREAMING_ARTIST', 'PRODUCER', 'SYNC_FOCUSED', 'MERCH_DRIVEN', 'HYBRID');

-- CreateEnum
CREATE TYPE "GrowthEngine" AS ENUM ('SOCIAL_FIRST', 'PLAYLIST_DRIVEN', 'LIVE_DISCOVERY', 'COMMUNITY_DRIVEN', 'COLLABORATION_DRIVEN', 'PRESS_DRIVEN');

-- CreateEnum
CREATE TYPE "ArticleIntent" AS ENUM ('EDUCATIONAL', 'STRATEGIC', 'TACTICAL');

-- CreateEnum
CREATE TYPE "ActionEffort" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- DropIndex
DROP INDEX "tracks_embedding_hnsw_idx";

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "artistTypes" "ArtistType"[],
ADD COLUMN     "careerStages" "CareerStage"[],
ADD COLUMN     "intent" "ArticleIntent" NOT NULL DEFAULT 'EDUCATIONAL';

-- AlterTable
ALTER TABLE "artist_profiles" ADD COLUMN     "artistType" "ArtistType" NOT NULL DEFAULT 'INDEPENDENT',
ADD COLUMN     "careerStage" "CareerStage" NOT NULL DEFAULT 'STARTING',
ADD COLUMN     "growthEngines" "GrowthEngine"[],
ADD COLUMN     "revenueModels" "RevenueModel"[];

-- AlterTable
ALTER TABLE "split_sheets" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tools" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "article_versions" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "excerpt" TEXT,
    "coverImageUrl" TEXT,
    "seoTitle" TEXT,
    "metaDescription" TEXT,
    "targetKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primaryKeyword" TEXT,
    "internalLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "toolSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "savedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_audits" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "tier" TEXT NOT NULL,
    "profileScore" DOUBLE PRECISION NOT NULL,
    "platformScore" DOUBLE PRECISION NOT NULL,
    "releaseScore" DOUBLE PRECISION NOT NULL,
    "businessScore" DOUBLE PRECISION NOT NULL,
    "gaps" JSONB NOT NULL,
    "checks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capabilities" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_streams" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supportingPlatforms" TEXT[],

    CONSTRAINT "revenue_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_stream_capabilities" (
    "revenueStreamId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "revenue_stream_capabilities_pkey" PRIMARY KEY ("revenueStreamId","capabilityId")
);

-- CreateTable
CREATE TABLE "audit_check_capabilities" (
    "checkId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "audit_check_capabilities_pkey" PRIMARY KEY ("checkId","capabilityId")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "effort" "ActionEffort" NOT NULL,
    "timeToComplete" TEXT NOT NULL,
    "expectedImpact" DOUBLE PRECISION NOT NULL,
    "artistTypeRelevance" "ArtistType"[],
    "revenueModelRelevance" "RevenueModel"[],
    "growthEngineRelevance" "GrowthEngine"[],
    "actionUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_revenue_streams" (
    "actionId" TEXT NOT NULL,
    "revenueStreamId" TEXT NOT NULL,

    CONSTRAINT "action_revenue_streams_pkey" PRIMARY KEY ("actionId","revenueStreamId")
);

-- CreateTable
CREATE TABLE "artist_capabilities" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "level" DOUBLE PRECISION NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,

    CONSTRAINT "artist_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_outcomes" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selfReported" BOOLEAN NOT NULL DEFAULT true,
    "impactDelta" DOUBLE PRECISION,

    CONSTRAINT "action_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_results" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "missingCapabilities" TEXT[],
    "blockedRevenue" TEXT[],
    "rankedActions" TEXT[],
    "reasoning" TEXT NOT NULL,
    "revenueUnlockPath" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_questionnaire_responses" (
    "id" TEXT NOT NULL,
    "artistProfileId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "journeyType" TEXT NOT NULL,
    "discoveryRanked" TEXT[],
    "socialManaged" TEXT NOT NULL,
    "incomeRanked" TEXT[],
    "primaryGoal" TEXT NOT NULL,
    "trackCount" TEXT NOT NULL,
    "collaborations" TEXT NOT NULL,
    "derivedRevenueModels" "RevenueModel"[],
    "derivedGrowthEngines" "GrowthEngine"[],
    "derivedCareerStage" "CareerStage" NOT NULL,
    "derivedCollabBand" TEXT NOT NULL,

    CONSTRAINT "artist_questionnaire_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_capabilities" (
    "articleId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "article_capabilities_pkey" PRIMARY KEY ("articleId","capabilityId")
);

-- CreateTable
CREATE TABLE "article_revenue_streams" (
    "articleId" TEXT NOT NULL,
    "revenueStreamId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "article_revenue_streams_pkey" PRIMARY KEY ("articleId","revenueStreamId")
);

-- CreateIndex
CREATE INDEX "article_versions_articleId_idx" ON "article_versions"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "article_versions_articleId_version_key" ON "article_versions"("articleId", "version");

-- CreateIndex
CREATE INDEX "artist_audits_artistProfileId_idx" ON "artist_audits"("artistProfileId");

-- CreateIndex
CREATE INDEX "actions_capabilityId_idx" ON "actions"("capabilityId");

-- CreateIndex
CREATE INDEX "actions_dimension_idx" ON "actions"("dimension");

-- CreateIndex
CREATE INDEX "artist_capabilities_artistProfileId_idx" ON "artist_capabilities"("artistProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "artist_capabilities_artistProfileId_capabilityId_key" ON "artist_capabilities"("artistProfileId", "capabilityId");

-- CreateIndex
CREATE INDEX "action_outcomes_artistProfileId_idx" ON "action_outcomes"("artistProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "decision_results_auditId_key" ON "decision_results"("auditId");

-- CreateIndex
CREATE INDEX "decision_results_artistProfileId_idx" ON "decision_results"("artistProfileId");

-- CreateIndex
CREATE INDEX "artist_questionnaire_responses_artistProfileId_idx" ON "artist_questionnaire_responses"("artistProfileId");

-- AddForeignKey
ALTER TABLE "article_versions" ADD CONSTRAINT "article_versions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_versions" ADD CONSTRAINT "article_versions_savedById_fkey" FOREIGN KEY ("savedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_audits" ADD CONSTRAINT "artist_audits_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_stream_capabilities" ADD CONSTRAINT "revenue_stream_capabilities_revenueStreamId_fkey" FOREIGN KEY ("revenueStreamId") REFERENCES "revenue_streams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_stream_capabilities" ADD CONSTRAINT "revenue_stream_capabilities_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_check_capabilities" ADD CONSTRAINT "audit_check_capabilities_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_revenue_streams" ADD CONSTRAINT "action_revenue_streams_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_revenue_streams" ADD CONSTRAINT "action_revenue_streams_revenueStreamId_fkey" FOREIGN KEY ("revenueStreamId") REFERENCES "revenue_streams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_capabilities" ADD CONSTRAINT "artist_capabilities_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_capabilities" ADD CONSTRAINT "artist_capabilities_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_outcomes" ADD CONSTRAINT "action_outcomes_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_outcomes" ADD CONSTRAINT "action_outcomes_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_results" ADD CONSTRAINT "decision_results_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "artist_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decision_results" ADD CONSTRAINT "decision_results_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_questionnaire_responses" ADD CONSTRAINT "artist_questionnaire_responses_artistProfileId_fkey" FOREIGN KEY ("artistProfileId") REFERENCES "artist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_capabilities" ADD CONSTRAINT "article_capabilities_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_capabilities" ADD CONSTRAINT "article_capabilities_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "capabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_revenue_streams" ADD CONSTRAINT "article_revenue_streams_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_revenue_streams" ADD CONSTRAINT "article_revenue_streams_revenueStreamId_fkey" FOREIGN KEY ("revenueStreamId") REFERENCES "revenue_streams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

