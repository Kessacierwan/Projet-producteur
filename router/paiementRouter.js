const paiementRouter = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const authguard = require("../services/authguard");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

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


// route de paiement // 
paiementRouter.post("/create-payment-intent", authguard, async (req, res) => {
    const clientId = req.session.client.id;

    try {
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }

        if (!client.stripeCustomerId) {
            // si pas de client, le créer // 
            const stripeCustomer = await stripe.customers.create({
                email: client.email,
                name: `${client.nom} ${client.prenom}`,
            });
            // mise a jour de l'id du client dans la DB // 
            await prisma.client.update({
                where: { id: clientId },
                data: { stripeCustomerId: stripeCustomer.id }
            });
        }

        const montantTotal = await calculerMontantTotal(clientId);
        const amountInCents = Math.round(montantTotal * 100);

        if (isNaN(amountInCents) || amountInCents <= 0) {
            return res.status(400).json({ error: 'Montant invalide' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'eur',
            customer: client.stripeCustomerId,
            payment_method_types: ['card'],
            description: 'Paiement pour commande',
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Erreur lors de la création du PaymentIntent:', error);
        res.status(500).json({ error: error.message });
    }
});

paiementRouter.post("/confirm-payment", authguard, async (req, res) => {
    const clientId = req.session.client.id;
    const { paymentIntentId } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Le paiement n\'a pas été confirmé par Stripe' });
        }

        await prisma.$transaction(async (prisma) => {
            await prisma.client.update({
                where: { id: clientId },
                data: { isActive: true }
            });

            await prisma.commande.updateMany({
                where: { 
                    clientId: clientId,
                    statue: "en attente"
                },
                data: { statue: "payée" }
            });
        });

        res.json({ success: true, message: 'Paiement confirmé et données mises à jour' });
    } catch (error) {
        console.error('Erreur lors de la confirmation du paiement:', error);
        res.status(500).json({ error: error.message });
    }
});

paiementRouter.get("/confirmation", authguard, (req, res) => {
    res.render("pages/confirmation.twig");
});



paiementRouter.post('/api/create-stripe-account', authguard, async (req, res) => {
    try {
        const producteur = req.session.producteur.id;
        if (!producteur) {
            return res.status(401).json({ error: 'Non autorisé' });
        }

        const account = await stripe.accounts.create({
            type: 'express',
            country: 'FR',
            email: req.session.producteur.email,
            capabilities: {
                card_payments: {requested: true},
                transfers: {requested: true},
            },
        });

        await prisma.producteur.update({
            where: { id: producteur },
            data: { stripeAccountId: account.id },
        });

        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `https://${process.env.BASE_URL}/stripe/refresh`,
            return_url: `https://${process.env.BASE_URL}/stripe/return`, // cette ligne ne fonctionne pas // 
            type: 'account_onboarding',
        });

        res.json({ accountLink: accountLink.url });
    } catch (error) {
        console.error('Erreur lors de la création du compte Stripe:', error);
        res.status(500).json({ error: 'Erreur lors de la création du compte Stripe' });
    }
});


module.exports = paiementRouter;