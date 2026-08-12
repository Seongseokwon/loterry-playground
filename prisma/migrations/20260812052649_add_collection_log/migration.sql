-- CreateTable
CREATE TABLE "collection_logs" (
    "id" BIGSERIAL NOT NULL,
    "round" INTEGER,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collection_logs_createdAt_idx" ON "collection_logs"("createdAt");
