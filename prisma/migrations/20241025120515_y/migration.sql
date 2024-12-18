/*
  Warnings:

  - Added the required column `adresse` to the `Producteur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `producteur` ADD COLUMN `adresse` VARCHAR(191) NOT NULL;
