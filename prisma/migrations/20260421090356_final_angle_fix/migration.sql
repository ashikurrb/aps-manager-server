/*
  Warnings:
  - The `angle` column on the `OrderItems` table would be dropped and recreated. 
    This will work if there is no data in that column.
*/

-- 1. Drop the column if it exists as a single value
ALTER TABLE "OrderItems" DROP COLUMN IF EXISTS "angle";

-- 2. Add it back as an array
ALTER TABLE "OrderItems" ADD COLUMN "angle" "Angle"[] NOT NULL DEFAULT ARRAY[]::"Angle"[];