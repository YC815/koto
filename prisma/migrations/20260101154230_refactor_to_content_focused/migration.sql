/*
  Warnings:

  - You are about to drop the column `sentence` on the `Vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `target` on the `Vocabulary` table. All the data in the column will be lost.
  - Added the required column `content` to the `Vocabulary` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Vocabulary_target_idx";

-- AlterTable
ALTER TABLE "Vocabulary" DROP COLUMN "sentence",
DROP COLUMN "target",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "focusedTerm" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Vocabulary_content_idx" ON "Vocabulary"("content");

-- CreateIndex
CREATE INDEX "Vocabulary_focusedTerm_idx" ON "Vocabulary"("focusedTerm");
