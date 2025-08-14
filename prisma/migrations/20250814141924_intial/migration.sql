-- CreateTable
CREATE TABLE "public"."Invite" (
    "id" TEXT NOT NULL,
    "inviteQrCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_inviteQrCode_key" ON "public"."Invite"("inviteQrCode");

-- CreateIndex
CREATE INDEX "Invite_inviteQrCode_idx" ON "public"."Invite"("inviteQrCode");
