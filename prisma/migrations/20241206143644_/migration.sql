/*
  Warnings:

  - A unique constraint covering the columns `[siret]` on the table `Producteur` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Producteur_siret_key` ON `Producteur`(`siret`);
