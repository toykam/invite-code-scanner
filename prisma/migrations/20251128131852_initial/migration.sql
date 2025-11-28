/*
  Warnings:

  - A unique constraint covering the columns `[inviteQrCode,eventId]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventId` to the `Invite` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Invite_inviteQrCode_key";

-- AlterTable
ALTER TABLE "public"."Invite" ADD COLUMN     "eventId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "codePrefix" TEXT NOT NULL,
    "attendantCodePattern" TEXT NOT NULL,
    "driverCodePattern" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "public"."Event"("slug");

-- CreateIndex
CREATE INDEX "Event_slug_idx" ON "public"."Event"("slug");

-- CreateIndex
CREATE INDEX "Event_isActive_idx" ON "public"."Event"("isActive");

-- CreateIndex
CREATE INDEX "Invite_eventId_idx" ON "public"."Invite"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_inviteQrCode_eventId_key" ON "public"."Invite"("inviteQrCode", "eventId");

-- AddForeignKey
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
