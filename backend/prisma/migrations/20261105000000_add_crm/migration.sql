ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';
CREATE TABLE "Customer" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "company" TEXT,
  "phone" TEXT,
  "wechat" TEXT,
  "source" TEXT,
  "status" TEXT NOT NULL DEFAULT 'LEAD',
  "notes" TEXT,
  "nextFollowUpAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "ownerId" INTEGER NOT NULL,
  CONSTRAINT "Customer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "FollowUp" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "content" TEXT NOT NULL,
  "followedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nextFollowUpAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "customerId" INTEGER NOT NULL,
  CONSTRAINT "FollowUp_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Customer_ownerId_createdAt_idx" ON "Customer"("ownerId", "createdAt");
CREATE INDEX "Customer_ownerId_nextFollowUpAt_idx" ON "Customer"("ownerId", "nextFollowUpAt");
CREATE INDEX "FollowUp_customerId_followedAt_idx" ON "FollowUp"("customerId", "followedAt");
