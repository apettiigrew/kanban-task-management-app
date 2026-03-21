/*
  Warnings:

  - Added the required column `userId` to the `card_labels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `checklist_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `checklists` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `columns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `labels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."card_labels" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."cards" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."checklist_items" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."checklists" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."columns" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."labels" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."projects" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "card_labels_userId_idx" ON "public"."card_labels"("userId");

-- CreateIndex
CREATE INDEX "cards_userId_idx" ON "public"."cards"("userId");

-- CreateIndex
CREATE INDEX "checklist_items_userId_idx" ON "public"."checklist_items"("userId");

-- CreateIndex
CREATE INDEX "checklists_userId_idx" ON "public"."checklists"("userId");

-- CreateIndex
CREATE INDEX "columns_userId_idx" ON "public"."columns"("userId");

-- CreateIndex
CREATE INDEX "labels_userId_idx" ON "public"."labels"("userId");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "public"."projects"("userId");
