const dashBoardRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const hashPasswordExtension = require("../services/extensions/hashPasswordExtension");
const bcrypt = require("bcrypt");
const authguard = require("../services/authguard");
const prisma = new PrismaClient().$extends(hashPasswordExtension);

// calculer le total des articles dans le panier

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

// Récupérer la page dashBoard et ses informations
dashBoardRouter.get("/", async (req, res) => {
    // Vérifier si un client est en session
    if (!req.session.client && !req.session.producteur) {
        // Si aucun client n'est en session, rediriger vers la page de connexion, ne pas effectuer la suite
        return res.redirect("/accueil");
    }

    if (req.session.client) {
        let producteurs;
        let totalQty = 0;

        try {
            const client = await prisma.client.findMany({
                where: {
                    id: parseInt(req.session.client.id)
                }
            });

            producteurs = await prisma.producteur.findMany({
                select: {
                    id: true,
                    adresse: true,
                    nom: true,
                    bio: true,
                    photoUrl: true // Assurez-vous que ce champ est inclus

                }
            });

            totalQty = await compterElementsPanier(req.session.client.id);

            // mise a jour de la session avec la nouvelle totalQty
            req.session.totalQty = totalQty;

        } catch (error) {
            console.log(error);
        }

        res.render("pages/dashBoard.twig", {
            client: req.session.client,
            producteurs: producteurs,
            totalQty: totalQty
        });
    } else {
        try {
            const producteur = await prisma.producteur.findMany({
                where: {
                    id: parseInt(req.session.producteur.id)
                },
                include: {
                    produits: true
                }
            });

            const produitsDuProducteur = await prisma.producteur.findUnique({
                where: {
                    id: req.session.producteur.id
                },
                include: {
                    produits: true,
                },
            });

            res.render("pages/dashBoard.twig", {
                producteur: req.session.producteur,
                produitsDuProducteur: produitsDuProducteur,
                produits: produitsDuProducteur.produits
            });

        } catch (error) {
            console.log(error);
        }
    }
});

dashBoardRouter.get("/accueil", (req,res)=>{
    res.render("pages/accueil.twig")
})

module.exports = dashBoardRouter