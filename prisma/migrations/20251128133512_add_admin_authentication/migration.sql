/*
  Warnings:

  - Added the required column `scannerId` to the `Invite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Invite" ADD COLUMN     "scannerId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Scanner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "pin" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "public"."Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_email_idx" ON "public"."Admin"("email");

-- CreateIndex
CREATE INDEX "Scanner_eventId_idx" ON "public"."Scanner"("eventId");

-- CreateIndex
CREATE INDEX "Scanner_phoneNumber_idx" ON "public"."Scanner"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Scanner_phoneNumber_eventId_key" ON "public"."Scanner"("phoneNumber", "eventId");

-- CreateIndex
CREATE INDEX "Invite_scannerId_idx" ON "public"."Invite"("scannerId");

-- AddForeignKey
ALTER TABLE "public"."Scanner" ADD CONSTRAINT "Scanner_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_scannerId_fkey" FOREIGN KEY ("scannerId") REFERENCES "public"."Scanner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
