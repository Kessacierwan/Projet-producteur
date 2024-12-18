/*
  Warnings:

  - You are about to alter the column `total` on the `produitdanscommande` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE `produitdanscommande` MODIFY `total` DECIMAL(10, 2) NOT NULL;
