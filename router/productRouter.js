const productRouter = require("express").Router()
const { PrismaClient } = require("@prisma/client")
const authguard = require("../services/authguard")
const prisma = new PrismaClient()



//récupérer la vue manageProduct // 
productRouter.get("/manageProduct", authguard, async (req, res) => {
    const produitsDuProducteur = await prisma.producteur.findUnique({
        where: {
            id: req.session.producteur.id
        },
        include: {
            produits: true,
        },
    });

    const producteur = await prisma.producteur.findMany({
        where: {
            id: parseInt(req.session.producteur.id)
        },
    });
    res.render("pages/manageProduct.twig", {
        producteur : producteur, 
        produitsDuProducteur: produitsDuProducteur,
        produits: produitsDuProducteur.produits // Ajoutez cette ligne pour passer les produits
    });
})


// CRUD gestion produits // 

// Ajouter un produit  // 
productRouter.post("/addProduct", async (req, res) => {
    try {

        const produits = await prisma.produit.create({
            data: {
                nom: req.body.nom,
                prix: parseFloat(req.body.prix),
                quantite: parseFloat(req.body.quantite),
                details : req.body.details,
                producteurs: { // Utiliser connect pour lier le produit au producteur
                    connect: { id: req.session.producteur.id } // Assurez-vous d'utiliser l'ID du producteur
                }
            }
        });

        res.redirect("/"); // Rediriger après l'ajout
    } catch (error) {
        console.log(error);
        res.render("pages/manageProduct.twig",
            { produits: produits }
        ); 
    }
});

// supprimer un produit //

productRouter.get("/deleteProduct/:id", authguard, async (req, res) => {
    try {
        const deleteProduct = await prisma.produit.delete({
            where: {
                id: parseInt(req.params.id)
            }
        })
        res.redirect("/")
    } catch (error) {
        console.log(error)
        res.redirect("/")
    }

})


// modifier un produit // 

// get le produit a modifier //
productRouter.get("/modifyProduct/:id", authguard, async (req, res) => {
    res.render("pages/manageProduct.twig", {
        producteur: req.session.producteur,
        produit: await prisma.produit.findUnique({
            where: {
                id: parseInt(req.params.id)
            }
        })
    });
});

// post de la modif du produit // 

productRouter.post("/modifyProduct/:id",authguard,async (req,res)=>{
    try {
        const modifyProduct = await prisma.produit.update({
            where : {
                id : parseInt (req.params.id)
            },
            data:{
                nom : req.body.nom,
                prix : parseFloat(req.body.prix),
                quantite : parseFloat (req.body.quantite),
                details : req.body.details
            }
        })
        res.redirect ('/')
    } catch (error) {
        console.log(error)
        res.redirect('/')
    }
})

// Route GET des produits du producteur :id // 
productRouter.get('/boutique/:id',authguard, async (req, res) => {
    const producteurId = parseInt(req.params.id);
    
    try {
        const producteur = await prisma.producteur.findUnique({
            where: { id: producteurId },
            include: { produits: true }
        });
        
        if (!producteur) {
            return res.status(404).send('Producteur non trouvé');
        }
        
        res.render('pages/shop.twig', { producteur, produits: producteur.produits });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur serveur');
    }
});





module.exports = productRouter
