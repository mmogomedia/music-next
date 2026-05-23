-- MCP integration (Picasite) — additive migration.
-- Adds OAuth 2.1 client/token/audit tables and article scheduling + social-image
-- columns. No destructive changes. See PICASITE_MCP_INTEGRATION_PLAN.md.

-- CreateEnum
CREATE TYPE "McpTokenType" AS ENUM ('ACCESS', 'REFRESH');

-- AlterTable (additive columns on existing articles table)
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "socialImages" JSONB;

-- CreateTable
CREATE TABLE "mcp_clients" (
    "id"               TEXT NOT NULL,
    "clientId"         TEXT NOT NULL,
    "clientSecretHash" TEXT NOT NULL,
    "name"             TEXT NOT NULL,
    "redirectUris"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "webhookUrl"       TEXT,
    "webhookSecret"    TEXT,
    "scopes"           TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt"        TIMESTAMP(3),
    CONSTRAINT "mcp_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcp_access_tokens" (
    "id"        TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "clientId"  TEXT NOT NULL,
    "scopes"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "type"      "McpTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mcp_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcp_audit_logs" (
    "id"       TEXT NOT NULL,
    "clientId" TEXT,
    "tool"     TEXT NOT NULL,
    "ok"       BOOLEAN NOT NULL,
    "detail"   TEXT,
    "at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mcp_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mcp_clients_clientId_key" ON "mcp_clients"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "mcp_access_tokens_tokenHash_key" ON "mcp_access_tokens"("tokenHash");
CREATE INDEX "mcp_access_tokens_clientId_idx" ON "mcp_access_tokens"("clientId");
CREATE INDEX "mcp_access_tokens_expiresAt_idx" ON "mcp_access_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "mcp_audit_logs_clientId_at_idx" ON "mcp_audit_logs"("clientId", "at");

-- AddForeignKey
ALTER TABLE "mcp_access_tokens"
    ADD CONSTRAINT "mcp_access_tokens_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "mcp_clients"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;
