-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "scenarioJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "LiveSession_code_key" ON "LiveSession"("code");

-- CreateIndex
CREATE INDEX "LiveSession_code_idx" ON "LiveSession"("code");

-- CreateIndex
CREATE INDEX "LiveSession_status_idx" ON "LiveSession"("status");

-- CreateTable
CREATE TABLE "LiveParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "messagesJson" TEXT,
    "scoreJson" TEXT,
    "totalScore" REAL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "LiveParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LiveParticipant_sessionId_email_key" ON "LiveParticipant"("sessionId", "email");

-- CreateIndex
CREATE INDEX "LiveParticipant_sessionId_idx" ON "LiveParticipant"("sessionId");

-- CreateIndex
CREATE INDEX "LiveParticipant_email_idx" ON "LiveParticipant"("email");

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitBucket_key_key" ON "RateLimitBucket"("key");

-- CreateIndex
CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");
