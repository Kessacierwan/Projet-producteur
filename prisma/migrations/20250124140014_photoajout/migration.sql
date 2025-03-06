/*
  Warnings:

  - A unique constraint covering the columns `[entrepriseNom]` on the table `Producteur` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `producteur` ADD COLUMN `photoUrl` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Producteur_entrepriseNom_key` ON `Producteur`(`entrepriseNom`);
