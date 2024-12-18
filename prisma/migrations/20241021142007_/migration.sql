-- CreateTable
CREATE TABLE `Client` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `motDePasse` VARCHAR(191) NOT NULL,
    `age` INTEGER NOT NULL,
    `sexe` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Client_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commande` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom_produit` VARCHAR(191) NOT NULL,
    `quantite` INTEGER NOT NULL,
    `total` INTEGER NOT NULL,
    `statue` VARCHAR(191) NOT NULL,
    `clientId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Producteur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entrepriseNom` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `motDePasse` VARCHAR(191) NOT NULL,
    `age` INTEGER NOT NULL,
    `sexe` VARCHAR(191) NOT NULL,
    `siret` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Producteur_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Produit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `prix` INTEGER NOT NULL,
    `quantite` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ProduitCommande` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ProduitCommande_AB_unique`(`A`, `B`),
    INDEX `_ProduitCommande_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ProduitProducteur` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ProduitProducteur_AB_unique`(`A`, `B`),
    INDEX `_ProduitProducteur_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Commande` ADD CONSTRAINT `Commande_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProduitCommande` ADD CONSTRAINT `_ProduitCommande_A_fkey` FOREIGN KEY (`A`) REFERENCES `Commande`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProduitCommande` ADD CONSTRAINT `_ProduitCommande_B_fkey` FOREIGN KEY (`B`) REFERENCES `Produit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProduitProducteur` ADD CONSTRAINT `_ProduitProducteur_A_fkey` FOREIGN KEY (`A`) REFERENCES `Producteur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ProduitProducteur` ADD CONSTRAINT `_ProduitProducteur_B_fkey` FOREIGN KEY (`B`) REFERENCES `Produit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
