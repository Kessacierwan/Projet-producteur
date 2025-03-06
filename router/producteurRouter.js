const producteurRouter = require("express").Router()
const {PrismaClient} = require("@prisma/client")
const hashPasswordExtension = require("../services/extensions/hashPasswordExtension")
const bcrypt = require("bcrypt")
const authguard = require("../services/authguard")
const prisma = new PrismaClient().$extends(hashPasswordExtension)
const multer = require('multer');
const csv = require('csv-parse');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const { parse } = require('csv-parse/sync');



// récupérer la page addProducteur //
producteurRouter.get("/addProducteur", (req,res)=>{
    res.render("pages/addProducteur.twig")
})

producteurRouter.get("/loginProducteur", (req,res)=>{
    res.render("pages/loginProducteur.twig")
})

 // envoyer les données du formulaire du producteur(inscription dans la DB producteur) // 
 producteurRouter.post("/addProducteur",upload.single('photo'),async(req,res)=>{
    if (req.body.motDePasse === req.body.confirm_motDePasse) {

    try {
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const producteur = await prisma.producteur.create({
            data:{
                entrepriseNom : req.body.entrepriseNom,
                nom : req.body.nom,
                prenom : req.body.prenom,
                email : req.body.email,
                motDePasse : req.body.motDePasse,
                age : parseInt(req.body.age),
                sexe : req.body.sexe,
                adresse : req.body.adresse,
                siret : req.body.siret,
                bio : req.body.bio,
                photoUrl : photoUrl


            }


        })
        res.redirect("/")
    } catch (error) {
        console.log(error)

        res.render("pages/addProducteur.twig")
    }}
})  


// connexion en tant que producteur // 
producteurRouter.post("/loginProducteur", async (req, res) => {
    try {
        const producteur = await prisma.producteur.findUnique({
            where: { email: req.body.email }

        })
        if (producteur) {

            if (await bcrypt.compare(req.body.motDePasse, producteur.motDePasse)) {
                req.session.producteur = producteur
                console.log("connexion producteur réussie")
                res.redirect('/')
            }
            else {
                throw { password: "Connexion échouée : Mot de passe incorrect" }
            }
        }
        else {
            throw {
                mail: "Connexion échouée : Adresse mail inexistante"
            }

        }
    } catch (error) {
        res.render("pages/loginProducteur.twig", {
            error
        })
    }
})


producteurRouter.get("/createStripeProducteur", authguard, async (req, res) => {

    res.render("pages/createStripeProducteur.twig");
})

// Import de fichier CSV // 

// Route pour gérer l'upload et le traitement d'un fichier CSV
producteurRouter.post('/uploadCsv', authguard, upload.single('csv_file'), async (req, res) => {
    // Vérifie si un fichier a été uploadé
    if (!req.file) {
        return res.status(400).send('Aucun fichier n\'a été uploadé.');
    }

    try {
        // Lit le contenu du fichier CSV
        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        // Parse le contenu CSV en un tableau d'objets
        const results = parse(fileContent, { columns: true, skip_empty_lines: true });

        // Récupère l'ID du producteur à partir de la session
        const producteurId = req.session.producteur.id;

        // Parcourt chaque ligne du fichier CSV
        for (let row of results) {
            // Recherche un produit existant par nom et producteur
            const existingProduit = await prisma.produit.findFirst({
                where: {
                    nom: row.NomProduit,
                    producteurId: producteurId

                }
            });

            if (existingProduit) {
                // Met à jour le produit existant
                await prisma.produit.update({
                    where: { id: existingProduit.id },
                    data: {
                        prix: parseFloat(row['Prix au kg (€)']),
                        quantite: parseFloat(row['Quantité Kg']),
                        details: row.Details || null,
                    }
                });
                console.log(`Produit ${existingProduit.nom} mis à jour pour le producteur ${producteurId}`);
            } else {
                // Crée un nouveau produit
                const newProduit = await prisma.produit.create({
                    data: {
                        nom: row.NomProduit,
                        prix: parseFloat(row['Prix au kg (€)']),
                        quantite: parseFloat(row['Quantité Kg']),
                        details: row.Details || null,
                        producteurId: producteurId 

                    }
                });
                console.log(`Nouveau produit ${newProduit.nom} créé et associé au producteur ${producteurId}`);
            }
        }

        // Redirige vers la page d'accueil après le traitement
        res.redirect('/');
    } catch (error) {
        // Gère les erreurs lors de l'importation
        console.error(error);
        res.status(500).send('Erreur lors de l\'importation des produits');
    }
});

// get la vue //
producteurRouter.get('/uploadCsv',authguard, (req, res) => {
    console.log("get page CSV activée")
    res.render('pages/uploadCsv.twig');
});
  



module.exports = producteurRouter