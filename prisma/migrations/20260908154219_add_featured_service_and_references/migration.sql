-- AlterTable
ALTER TABLE "service_posts" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "references" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "references_pkey" PRIMARY KEY ("id")
);
