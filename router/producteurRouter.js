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
 producteurRouter.post("/addProducteur",async(req,res)=>{
    if (req.body.motDePasse === req.body.confirm_motDePasse) {

    try {
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
                bio : req.body.bio


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

producteurRouter.post('/uploadCsv', upload.single('csv_file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Aucun fichier n\'a été uploadé.');
    }

    try {
        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        const results = parse(fileContent, { columns: true, skip_empty_lines: true });

        const producteurId = req.session.producteur.id;

        for (let row of results) {
            const produit = await prisma.produit.upsert({
                where: {
                    id: parseInt(row.ID)
                },
                update: {
                    nom: row.NomProduit,
                    prix: parseFloat(row['Prix au kg (€)']),
                    quantite: parseFloat(row['Quantité Kg']),
                    details: row.Details || null,
                    producteurs: {
                        connect: { id: producteurId }
                    }
                },
                create: {
                    nom: row.NomProduit,
                    prix: parseFloat(row['Prix au kg (€)']),
                    quantite: parseFloat(row['Quantité Kg']),
                    details: row.Details || null,
                    producteurs: {
                        connect: { id: producteurId }
                    }
                },
                include: {
                    producteurs: true
                }
            });

            console.log(`Produit ${produit.nom} mis à jour/créé et associé au producteur ${producteurId}`);
        }

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur lors de l\'importation des produits');
    }
});

// get la vue //
producteurRouter.get('/uploadCsv', (req, res) => {
    console.log("get page CSV activée")
    res.render('pages/uploadCsv.twig');
});
  



module.exports = producteurRouter