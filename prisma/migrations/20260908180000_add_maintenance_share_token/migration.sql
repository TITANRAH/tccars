-- AlterTable
ALTER TABLE "maintenances" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "maintenances_shareToken_key" ON "maintenances"("shareToken");
