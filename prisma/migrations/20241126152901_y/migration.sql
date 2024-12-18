/*
  Warnings:

  - You are about to alter the column `prix` on the `produit` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(5,2)`.
  - You are about to alter the column `quantite` on the `produit` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(5,2)`.

*/
-- AlterTable
ALTER TABLE `produit` MODIFY `prix` DECIMAL(5, 2) NOT NULL,
    MODIFY `quantite` DECIMAL(5, 2) NOT NULL;
