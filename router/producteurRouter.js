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
 producteurRouter.post("/addProducteur", upload.single('photo'), async (req, res) => {
    const {
        entrepriseNom,
        nom,
        prenom,
        email,
        motDePasse,
        confirm_motDePasse,
        age,
        sexe,
        adresse,
        siret,
        bio
    } = req.body;

    // Définition des regex
    const entrepriseNomRegex = /^[A-Za-zÀ-ÿ0-9,&\.\:\-#\?\/!\(\)']+$/;
    const nomRegex = /^[A-Za-zÀ-ÿ0-9,&\.\:\-#\?\/!\(\)']+$/;
    const prenomRegex = /^[A-Za-zÀ-ÿ0-9,&\.\:\-#\?\/!\(\)']+$/;
    const emailRegex = /^[A-Za-zÀ-ÿ0-9,&\.\@\:\-#\?\/!\(\)']+$/;
    const motDePasseRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*\-_²]).{8,}$/;
    const ageRegex = /^[0-9]{1,2}$/;
    const siretRegex = /^\d{14}$/; // SIRET doit contenir exactement 14 chiffres

    const errors = [];

    // Validation des champs
    if (!entrepriseNomRegex.test(entrepriseNom)) {
        errors.push("Le format du nom de l'entreprise est invalide.");
    }
    if (!nomRegex.test(nom)) {
        errors.push("Le format du nom est invalide.");
    }
    if (!prenomRegex.test(prenom)) {
        errors.push("Le format du prénom est invalide.");
    }
    if (!emailRegex.test(email)) {
        errors.push("Le format de l'email est invalide.");
    }
    if (!motDePasseRegex.test(motDePasse)) {
        errors.push("Le mot de passe ne respecte pas les critères de sécurité.");
    }
    if (motDePasse !== confirm_motDePasse) {
        errors.push("Les mots de passe ne correspondent pas.");
    }
    if (!ageRegex.test(age)) {
        errors.push("L'âge doit être un nombre entre 1 et 99.");
    }
    if (!siretRegex.test(siret)) {
        errors.push("Le numéro SIRET doit contenir exactement 14 chiffres.");
    }

    // Si des erreurs sont présentes, afficher la vue avec les erreurs
    if (errors.length > 0) {
        return res.render("pages/addProducteur.twig", { errors });
    }

    try {
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const producteur = await prisma.producteur.create({
            data: {
                entrepriseNom,
                nom,
                prenom,
                email,
                motDePasse,
                age: parseInt(age),
                sexe,
                adresse,
                siret,
                bio,
                photoUrl
            }
        });

        res.redirect("/");
    } catch (error) {
        errors.push(errors);
        res.render("pages/addProducteur.twig", { errors : errors });
    }
});



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