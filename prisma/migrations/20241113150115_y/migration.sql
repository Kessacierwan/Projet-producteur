/*
  Warnings:

  - You are about to drop the column `quantite` on the `commande` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `commande` table. All the data in the column will be lost.
  - You are about to drop the `_produitcommande` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_produitcommande` DROP FOREIGN KEY `_ProduitCommande_A_fkey`;

-- DropForeignKey
ALTER TABLE `_produitcommande` DROP FOREIGN KEY `_ProduitCommande_B_fkey`;

-- AlterTable
ALTER TABLE `commande` DROP COLUMN `quantite`,
    DROP COLUMN `total`;

-- DropTable
DROP TABLE `_produitcommande`;

-- CreateTable
CREATE TABLE `ProduitDansCommande` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quantite` INTEGER NOT NULL,
    `total` INTEGER NOT NULL,
    `idCommande` INTEGER NOT NULL,
    `idProduit` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProduitDansCommande` ADD CONSTRAINT `ProduitDansCommande_idCommande_fkey` FOREIGN KEY (`idCommande`) REFERENCES `Commande`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProduitDansCommande` ADD CONSTRAINT `ProduitDansCommande_idProduit_fkey` FOREIGN KEY (`idProduit`) REFERENCES `Produit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
