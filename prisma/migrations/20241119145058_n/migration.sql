/*
  Warnings:

  - You are about to drop the column `nom_produit` on the `commande` table. All the data in the column will be lost.
  - Added the required column `total` to the `Commande` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `commande` DROP COLUMN `nom_produit`,
    ADD COLUMN `total` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `produit` ADD COLUMN `details` VARCHAR(191) NULL;
