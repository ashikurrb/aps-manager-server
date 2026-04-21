/*
  Warnings:

  - You are about to drop the column `price` on the `OrderItems` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `OrderItems` table. All the data in the column will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `productName` to the `OrderItems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rate` to the `OrderItems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `OrderItems` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_PAID', 'PARTIALLY_PAID', 'COMPLETELY_PAID');

-- DropForeignKey
ALTER TABLE "OrderItems" DROP CONSTRAINT "OrderItems_productId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_updatedById_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "dueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_PAID';

-- AlterTable
ALTER TABLE "OrderItems" DROP COLUMN "price",
DROP COLUMN "productId",
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "rate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "Product";
