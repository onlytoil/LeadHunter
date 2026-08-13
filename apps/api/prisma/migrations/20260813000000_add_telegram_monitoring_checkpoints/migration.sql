CREATE TABLE "TelegramMonitoringCheckpoint" (
  "id" TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "telegramChatId" BIGINT NOT NULL,
  "lastMessageId" INTEGER NOT NULL,
  "lastMessageAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TelegramMonitoringCheckpoint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TelegramMonitoringCheckpoint_chatId_key"
ON "TelegramMonitoringCheckpoint"("chatId");

CREATE UNIQUE INDEX "TelegramMonitoringCheckpoint_telegramChatId_key"
ON "TelegramMonitoringCheckpoint"("telegramChatId");