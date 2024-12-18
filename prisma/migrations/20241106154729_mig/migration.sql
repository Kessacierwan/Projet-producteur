/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `client` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `stripeCustomerId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Client_stripeCustomerId_key` ON `Client`(`stripeCustomerId`);
