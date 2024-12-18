/*
  Warnings:

  - You are about to alter the column `total` on the `commande` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE `commande` MODIFY `total` DECIMAL(10, 2) NOT NULL;
