/*
  Warnings:

  - Made the column `createdById` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedById` on table `Client` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_updatedById_fkey";

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "createdById" SET NOT NULL,
ALTER COLUMN "updatedById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
