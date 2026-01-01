-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "sentence" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vocabulary_target_idx" ON "Vocabulary"("target");

-- CreateIndex
CREATE INDEX "Vocabulary_createdAt_idx" ON "Vocabulary"("createdAt" DESC);
