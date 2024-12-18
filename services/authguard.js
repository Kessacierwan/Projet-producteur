// Importation de la classe PrismaClient depuis le package @prisma/client
const { PrismaClient } = require("@prisma/client");

// Création d'une instance de PrismaClient pour interagir avec la base de données
const prisma = new PrismaClient();

// Définition d'une fonction asynchrone authguard qui prend req, res et next comme paramètres
const authguard = async (req, res, next) => {
    try {
        // Détermination du type d'utilisateur basé sur la session : 'client' ou 'producteur'
        let userType = req.session.client ? 'client' : req.session.producteur ? 'producteur' : null;

        // Si aucun type d'utilisateur n'est trouvé, une erreur est lancée
        if (!userType) {
            throw { authgard: "aucun utilisateur connecté" };
        }

        // Recherche de l'utilisateur dans la base de données en fonction de son type
        const user = userType === 'client'
            ? await prisma.client.findUnique({ where: { email: req.session.client.email } }) // Recherche d'un client par email
            : await prisma.producteur.findUnique({ where: { email: req.session.producteur.email } }); // Recherche d'un producteur par email

        // Si l'utilisateur est trouvé, on passe à la prochaine fonction middleware
        if (user) {
            return next();
        }

        // Si l'utilisateur n'est pas trouvé, une erreur est lancée
        throw { authgard: `${userType} non connecté` };
        
    } catch (error) {
        // Affichage de l'erreur dans la console pour le débogage
        console.error(error); // Pour le débogage
        // Redirection vers la page d'accueil ou une page d'erreur spécifique
        res.redirect("/"); // Vous pouvez également rediriger vers une page d'erreur spécifique
    }
};

// Exportation de la fonction authguard pour pouvoir l'utiliser dans d'autres fichiers
module.exports = authguard;