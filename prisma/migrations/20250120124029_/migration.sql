-- DropForeignKey
ALTER TABLE `produitdanscommande` DROP FOREIGN KEY `ProduitDansCommande_idProduit_fkey`;

-- AddForeignKey
ALTER TABLE `ProduitDansCommande` ADD CONSTRAINT `ProduitDansCommande_idProduit_fkey` FOREIGN KEY (`idProduit`) REFERENCES `Produit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
