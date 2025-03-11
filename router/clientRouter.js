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
 clientRouter.post("/addClient", async (req, res) => {
    const { nom, prenom, email, motDePasse, confirm_motDePasse, age, sexe } = req.body;
  
    // Définition des regex
    const nomRegex = /^[A-Za-zÀ-ÿ0-9,&\.\:\-#\?\/!\(\)']+$/;
    const prenomRegex = /^[A-Za-zÀ-ÿ0-9,&\.\:\-#\?\/!\(\)']+$/;
    const emailRegex = /^[A-Za-zÀ-ÿ0-9,&\.\@\:\-#\?\/!\(\)']+$/;
    const motDePasseRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*\-_²]).{8,}$/;
    const ageRegex = /^[0-9]{1,2}$/;
  
    const errors = [];
  
    // Validation des champs

    // return booléan true si valide, false si invalide.
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
  
    if (errors.length > 0) {
      return res.render("pages/addClient.twig", { errors });
    }
  
    try {
        const client = await prisma.client.create({
            data: { // Création d'un nouveau client avec les données du formulaire
                nom,
                prenom,
                email,
                motDePasse,
                age: parseInt(age),
                sexe
            }
        });
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.render("pages/addClient.twig", { errors: ["Une erreur est survenue lors de l'inscription."] });
    }
});


// déconnexion // 
clientRouter.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})


// Définition d'une route POST pour la connexion des clients
clientRouter.post("/loginClient", async (req, res) => {
    try {
        // Recherche d'un client dans la base de données avec l'email fourni
        const client = await prisma.client.findUnique({
            where: { email: req.body.email }
        });

        // Si aucun client n'est trouvé, on lance une erreur
        if (!client) {
            throw { mail: "Connexion échouée : Adresse mail inexistante" };
        }

        // Vérification du mot de passe fourni avec celui stocké en base de données
        const isPasswordValid = await bcrypt.compare(req.body.motDePasse, client.motDePasse);
        // Si le mot de passe est incorrect, on lance une erreur
        if (!isPasswordValid) {
            throw { password: "Connexion échouée : Mot de passe incorrect" };
        }

        // Si l'authentification est réussie, on stocke les informations du client en session
        req.session.client = {
            id: client.id,
            nom: client.nom,
            prenom: client.prenom,
            email: client.email
        };

        // Log de succès dans la console
        console.log("Connexion client réussie");
        // Redirection vers la page d'accueil
        res.redirect('/');

    } catch (error) {
        // En cas d'erreur, on l'affiche dans la console
        console.error("Erreur de connexion:", error);
        // Et on renvoie la page de connexion avec l'erreur
        res.render("pages/loginClient.twig", { error });
    }
});


module.exports = clientRouter