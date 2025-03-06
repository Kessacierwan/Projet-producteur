/*
  Warnings:

  - You are about to drop the `_produitproducteur` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `producteurId` to the `Produit` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `_produitproducteur` DROP FOREIGN KEY `_ProduitProducteur_A_fkey`;

-- DropForeignKey
ALTER TABLE `_produitproducteur` DROP FOREIGN KEY `_ProduitProducteur_B_fkey`;

-- AlterTable
ALTER TABLE `produit` ADD COLUMN `producteurId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `_produitproducteur`;

-- AddForeignKey
ALTER TABLE `Produit` ADD CONSTRAINT `Produit_producteurId_fkey` FOREIGN KEY (`producteurId`) REFERENCES `Producteur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
