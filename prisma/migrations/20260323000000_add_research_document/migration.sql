-- CreateTable
CREATE TABLE "ResearchDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "contentJson" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResearchDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ResearchDocument_projectId_idx" ON "ResearchDocument"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchDocument_projectId_order_key" ON "ResearchDocument"("projectId", "order");
