const express = require("express")
const session = require('express-session')
const dashBoardRouter = require("./router/dashBoardRouter")
const clientRouter = require("./router/clientRouter")
const producteurRouter = require("./router/producteurRouter")
const productRouter = require("./router/productRouter")
const panierRouter = require("./router/panierRouter")
const paiementRouter = require("./router/paiementRouter")
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const app = express()

app.use(express.json())

app.use(express.static("./public"))
app.use(express.urlencoded({extended: true}))

// Configuration de la session
app.use(session({
    secret: "kmr%2p~V3-s]RM3%#J-q6UM2=rW5yC88",
    resave: true,
    saveUninitialized: true,
    // Ajoutez éventuellement d'autres options de configuration ici
}))

// Middleware pour rendre la session client disponible partout
app.use((req, res, next) => {
    res.locals.client = req.session.client || null;
    res.locals.totalQty = req.session.totalQty || 0;

    next();
});



// Routes
app.use(dashBoardRouter)
app.use(producteurRouter)
app.use(clientRouter)
app.use(productRouter)
app.use(panierRouter)
app.use(paiementRouter)


app.listen(3000, () => {
    console.log("Connecté sur le port 3000")
})