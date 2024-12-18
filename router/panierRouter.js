const panierRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const authguard = require("../services/authguard");
const prisma = new PrismaClient()

async function calculerMontantTotal(clientId) {
    try {
        const resultat = await prisma.commande.aggregate({
            where: {
                clientId: clientId,
                statue: "en attente" 
            },
            _sum: {
                total: true
            }
        });

        return resultat._sum.total || 0;
    } catch (error) {
        console.error("Erreur lors du calcul du montant total:", error);
        throw error;
    }
}

// compter les elements du panier //
async function compterElementsPanier(clientId) {
    try {
      const resultat = await prisma.produitDansCommande.findMany({
        where: {
          commande: {
            clientId: clientId,
            statue: "En attente"
          }
        },
        distinct: ['idProduit'],
        select: {
          idProduit: true
        }
      });
      return resultat.length;
    } catch (error) {
      console.error("Erreur lors du comptage des éléments uniques du panier:", error);
      return 0;
    }
  }
// CRUD PANIER // 


// afficher le panier // 

panierRouter.get("/panier", authguard, async (req, res) => {
    try {
        const clientId = req.session.client.id;
        const commandes = await prisma.commande.findMany({
            where: { clientId: clientId, statue: "En attente" },
            include: {
                produitsDansCommande: {
                    include: {
                        produit: true
                    }
                }
            }
        });
        const montantTotal = await calculerMontantTotal(clientId);
        const totalQty = await compterElementsPanier(clientId);

        res.render("pages/panier.twig", { 
            commandes: commandes,
            montantTotal: montantTotal,
             totalQty: totalQty ,
            stripePublicKey: process.env.STRIPE_PUBLIC_KEY 
        });
    } catch (error) {
        console.error('Erreur lors de l\'affichage du panier:', error);
        res.status(500).render('pages/panier.twig', { error: 'Erreur lors du chargement du panier' });
    }
});
// Ajouter au panier // 


panierRouter.post("/addPanier/:id", authguard, async (req, res) => {
    try {
        const produitId = parseInt(req.params.id);
        const quantite = parseInt(req.body.quantite) || 1;
        const clientId = req.session.client.id;

        // Vérifier si le produit existe
        const produit = await prisma.produit.findUnique({ where: { id: produitId } });
        if (!produit) {
            return res.status(404).json({ 
                success: false,
                error: "Produit non trouvé"
            });
        }

        // Vérifier si la quantité demandée est disponible
        if (produit.quantite < quantite) {
            return res.status(400).json({ 
                success: false,
                error: "Quantité demandée non disponible"
            });
        }

        // Vérifier si une commande en attente existe déjà pour ce client
        let commande = await prisma.commande.findFirst({
            where: {
                clientId: clientId,
                statue: "En attente"
            },
            include: {
                produitsDansCommande: true
            }
        });

        let quantiteAjoutee = quantite;

        if (commande) {
            // Vérifier si le produit est déjà dans la commande
            const produitExistant = commande.produitsDansCommande.find(p => p.idProduit === produitId);

            if (produitExistant) {
                // Mettre à jour la quantité et le total du produit existant
                await prisma.produitDansCommande.update({
                    where: { id: produitExistant.id },
                    data: {
                        quantite: produitExistant.quantite + quantite,
                        total: (produitExistant.quantite + quantite) * produit.prix
                    }
                });
            } else {
                // Ajouter un nouveau produit à la commande existante
                await prisma.produitDansCommande.create({
                    data: {
                        commande: { connect: { id: commande.id } },
                        produit: { connect: { id: produitId } },
                        quantite: quantite,
                        total: quantite * produit.prix
                    }
                });
            }

            // Mettre à jour le total de la commande
            commande = await prisma.commande.update({
                where: { id: commande.id },
                data: {
                    total: {
                        increment: quantite * produit.prix
                    }
                },
                include: {
                    produitsDansCommande: true
                }
            });
        } else {
            // Créer une nouvelle commande
            commande = await prisma.commande.create({
                data: {
                    statue: "En attente",
                    clientId: clientId,
                    total: produit.prix * quantite,
                    produitsDansCommande: {
                        create: {
                            produit: { connect: { id: produitId } },
                            quantite: quantite,
                            total: produit.prix * quantite
                        }
                    }
                },
                include: {
                    produitsDansCommande: true
                }
            });
        }

        // Mettre à jour la quantité disponible du produit
        const nouvelleQuantite = produit.quantite - quantiteAjoutee;
        await prisma.produit.update({
            where: { id: produitId },
            data: {
                quantite: {
                    decrement: quantiteAjoutee
                }
            }
        });

        // Calculer le total des quantités dans le panier
        const totalQty = commande.produitsDansCommande.reduce((sum, item) => sum + item.quantite, 0);

        // Mettre à jour totalQty dans la session
        req.session.totalQty = totalQty;

        // Récupérer les données nécessaires pour la page shop (si besoin)
        const produits = await prisma.produit.findMany();

        // Renvoyer une réponse JSON avec les données mises à jour
        res.json({
            success: true,
            message: "Produit ajouté au panier avec succès",
            panier: commande.produitsDansCommande,
            nouvelleQuantite,
            totalQty: totalQty // Ajout de totalQty dans la réponse
        });
    } catch (error) {
        console.error("Erreur lors de l'ajout au panier:", error);
        res.status(500).json({ 
            success: false,
            error: "Erreur serveur lors de l'ajout au panier"
        });
    }
});

panierRouter.get("/deleteProductFromPanier/:id", authguard, async (req, res) => {
    try {
        const produitDansCommandeId = parseInt(req.params.id);

        // Récupérer le ProduitDansCommande avec les informations du produit
        const produitDansCommande = await prisma.produitDansCommande.findUnique({
            where: { id: produitDansCommandeId },
            include: { 
                commande: true,
                produit: true // Inclure les informations du produit
            }
        });

        if (!produitDansCommande) {
            return res.status(404).redirect("/panier?error=Produit non trouvé dans le panier");
        }

        // Remettre en stock la quantité du produit
        await prisma.produit.update({
            where: { id: produitDansCommande.produit.id },
            data: {
                quantite: {
                    increment: produitDansCommande.quantite
                }
            }
        });

        // Supprimer le ProduitDansCommande
        await prisma.produitDansCommande.delete({
            where: { id: produitDansCommandeId }
        });

        // Mettre à jour le total de la commande
        await prisma.commande.update({
            where: { id: produitDansCommande.commande.id },
            data: {
                total: {
                    decrement: produitDansCommande.total
                }
            }
        });

        // Vérifier s'il reste des produits dans la commande
        const produitsRestants = await prisma.produitDansCommande.count({
            where: { idCommande: produitDansCommande.commande.id }
        });

        // Si la commande est vide, la supprimer
        if (produitsRestants === 0) {
            await prisma.commande.delete({
                where: { id: produitDansCommande.commande.id }
            });
        }

        // Rediriger vers la route du panier
        res.redirect("/panier");
    } catch (error) {
        console.error("Erreur lors de la suppression du produit du panier:", error);
        // En cas d'erreur, rediriger vers la route du panier avec un message d'erreur
        res.redirect("/panier?error=Erreur lors de la suppression du produit");
    }
});



module.exports = panierRouter