-- AlterTable
ALTER TABLE "maintenances" ADD COLUMN     "additionalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "folio" SERIAL NOT NULL,
ADD COLUMN     "mileage" INTEGER,
ADD COLUMN     "nextServiceMileage" INTEGER;
