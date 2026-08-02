-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'REVIEWED', 'CONTACTED', 'DISMISSED');

-- AlterTable
ALTER TABLE "Channel"
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Channel" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Message"
ADD COLUMN "senderId" BIGINT,
ADD COLUMN "senderUsername" TEXT;

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "matchedKeywords" TEXT[],
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notifiedAt" TIMESTAMP(3),
    "notificationError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_messageId_key" ON "Lead"("messageId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_messageId_fkey"
FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
