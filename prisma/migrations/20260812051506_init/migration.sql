-- CreateTable
CREATE TABLE "draws" (
    "round" INTEGER NOT NULL,
    "drawDate" DATE NOT NULL,
    "numbers" INTEGER[],
    "bonus" INTEGER NOT NULL,
    "totalSell" BIGINT,
    "firstWinAmt" BIGINT,
    "firstWinners" INTEGER,
    "sumValue" INTEGER NOT NULL,
    "oddCount" INTEGER NOT NULL,
    "lowCount" INTEGER NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draws_pkey" PRIMARY KEY ("round")
);

-- CreateTable
CREATE TABLE "number_stats" (
    "number" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "lastSeenRound" INTEGER NOT NULL,
    "gap" INTEGER NOT NULL,
    "countRecent10" INTEGER NOT NULL,
    "countRecent50" INTEGER NOT NULL,
    "countRecent100" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "number_stats_pkey" PRIMARY KEY ("number")
);

-- CreateIndex
CREATE INDEX "draws_drawDate_idx" ON "draws"("drawDate");
