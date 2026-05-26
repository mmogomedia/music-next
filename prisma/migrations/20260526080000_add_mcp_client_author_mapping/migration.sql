-- AlterTable: optional per-client author mapping. When set, articles created
-- via MCP by this client are attributed to this User. Falls back to the
-- earliest-created ADMIN when null. Settable only by Flemoji ADMINs (never
-- via DCR); the FK uses SET NULL on user delete so attribution falls back
-- gracefully if a mapped user is removed.
ALTER TABLE "mcp_clients" ADD COLUMN "authorUserId" TEXT;

-- CreateIndex
CREATE INDEX "mcp_clients_authorUserId_idx" ON "mcp_clients"("authorUserId");

-- AddForeignKey
ALTER TABLE "mcp_clients" ADD CONSTRAINT "mcp_clients_authorUserId_fkey"
    FOREIGN KEY ("authorUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
