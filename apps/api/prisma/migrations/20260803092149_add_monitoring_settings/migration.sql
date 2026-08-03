-- CreateEnum
CREATE TYPE "KeywordRuleType" AS ENUM ('INCLUDE', 'EXCLUDE');

-- CreateTable
CREATE TABLE "MonitoredChat" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "title" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordRule" (
    "id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "type" "KeywordRuleType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitoredChat_identifier_key" ON "MonitoredChat"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordRule_type_phrase_key" ON "KeywordRule"("type", "phrase");
