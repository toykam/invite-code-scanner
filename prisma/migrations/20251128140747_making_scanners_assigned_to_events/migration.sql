/*
  Warnings:

  - You are about to drop the column `eventId` on the `Scanner` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phoneNumber]` on the table `Scanner` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Scanner" DROP CONSTRAINT "Scanner_eventId_fkey";

-- DropIndex
DROP INDEX "Scanner_eventId_idx";

-- DropIndex
DROP INDEX "Scanner_phoneNumber_eventId_key";

-- AlterTable
ALTER TABLE "Scanner" DROP COLUMN "eventId";

-- CreateTable
CREATE TABLE "ScannerAssignment" (
    "id" TEXT NOT NULL,
    "scannerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScannerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScannerAssignment_scannerId_idx" ON "ScannerAssignment"("scannerId");

-- CreateIndex
CREATE INDEX "ScannerAssignment_eventId_idx" ON "ScannerAssignment"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ScannerAssignment_scannerId_eventId_key" ON "ScannerAssignment"("scannerId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Scanner_phoneNumber_key" ON "Scanner"("phoneNumber");

-- AddForeignKey
ALTER TABLE "ScannerAssignment" ADD CONSTRAINT "ScannerAssignment_scannerId_fkey" FOREIGN KEY ("scannerId") REFERENCES "Scanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannerAssignment" ADD CONSTRAINT "ScannerAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
