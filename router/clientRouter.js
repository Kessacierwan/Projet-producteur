const clientRouter = require("express").Router()
const {PrismaClient} = require("@prisma/client")
const hashPasswordExtension = require("../services/extensions/hashPasswordExtension")
const bcrypt = require("bcrypt")
const authguard = require("../services/authguard")
const prisma = new PrismaClient().$extends(hashPasswordExtension)



// récupérer la page addClient //
clientRouter.get("/addClient", (req,res)=>{
    res.render("pages/addClient.twig")
})

// récupérer la page loginClient //
clientRouter.get("/loginClient", (req,res)=>{
    res.render("pages/loginClient.twig")
})

 // envoyer les données du formulaire du client(inscription dans la DB client) // 
clientRouter.post("/addClient",async(req,res)=>{
    if (req.body.motDePasse === req.body.confirm_motDePasse) {

    try {
        const client = await prisma.client.create({
            data:{
                nom : req.body.nom,
                prenom : req.body.prenom,
                email : req.body.email,
                motDePasse : req.body.motDePasse,
                age : parseInt(req.body.age),
                sexe : req.body.sexe 

            }

        })
        res.redirect("/")
    } catch (error) {
        console.log(error)

        res.render("pages/addClient.twig")
    }}
})  

// déconnexion // 
clientRouter.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})


// connexion en tant que client // 
clientRouter.post("/loginClient", async (req, res) => {
    try {
        const client = await prisma.client.findUnique({
            where: { email: req.body.email }
        });

        if (!client) {
            throw { mail: "Connexion échouée : Adresse mail inexistante" };
        }

        const isPasswordValid = await bcrypt.compare(req.body.motDePasse, client.motDePasse);
        if (!isPasswordValid) {
            throw { password: "Connexion échouée : Mot de passe incorrect" };
        }

        // Stockage des informations en session
        req.session.client = {
            id: client.id,
            nom: client.nom,
            prenom: client.prenom,
            email: client.email
        };

        console.log("Connexion client réussie");
        res.redirect('/');

    } catch (error) {
        console.error("Erreur de connexion:", error);
        res.render("pages/loginClient.twig", { error });
    }
});

module.exports = clientRouter