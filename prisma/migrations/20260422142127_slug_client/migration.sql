/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_slug_key" ON "Client"("slug");
