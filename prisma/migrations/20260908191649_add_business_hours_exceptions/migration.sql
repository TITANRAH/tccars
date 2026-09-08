-- CreateTable
CREATE TABLE "business_hours_exceptions" (
    "date" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT,
    "closeTime" TEXT,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_hours_exceptions_pkey" PRIMARY KEY ("date")
);
