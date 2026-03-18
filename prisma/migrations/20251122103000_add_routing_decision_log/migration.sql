-- CreateTable
CREATE TABLE "routing_decision_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "conversationId" TEXT,
    "message" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "routingMethod" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "keywordConfidence" DOUBLE PRECISION,
    "llmConfidence" DOUBLE PRECISION,
    "keywordLatency" INTEGER,
    "llmLatency" INTEGER,
    "totalLatency" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routing_decision_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "routing_decision_logs_userId_idx" ON "routing_decision_logs"("userId");

-- CreateIndex
CREATE INDEX "routing_decision_logs_conversationId_idx" ON "routing_decision_logs"("conversationId");

-- CreateIndex
CREATE INDEX "routing_decision_logs_intent_idx" ON "routing_decision_logs"("intent");

-- CreateIndex
CREATE INDEX "routing_decision_logs_routingMethod_idx" ON "routing_decision_logs"("routingMethod");

-- CreateIndex
CREATE INDEX "routing_decision_logs_createdAt_idx" ON "routing_decision_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "routing_decision_logs" ADD CONSTRAINT "routing_decision_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

