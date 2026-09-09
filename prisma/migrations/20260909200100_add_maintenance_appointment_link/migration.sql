-- AlterTable
ALTER TABLE "maintenances" ADD COLUMN "appointmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "maintenances_appointmentId_key" ON "maintenances"("appointmentId");

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
