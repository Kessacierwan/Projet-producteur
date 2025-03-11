const express = require("express")
const session = require('express-session')
const dashBoardRouter = require("./router/dashBoardRouter")
const clientRouter = require("./router/clientRouter")
const producteurRouter = require("./router/producteurRouter")
const productRouter = require("./router/productRouter")
const panierRouter = require("./router/panierRouter")
const paiementRouter = require("./router/paiementRouter")
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const secretKeyExpress = process.env.secretKeyExpress
const app = express()

app.use(express.json())

app.use(express.static("./public"))
app.use(express.urlencoded({extended: true}))
app.use('/uploads', express.static('uploads'));

// Configuration de la session
app.use(session({
    secret: secretKeyExpress,
    resave: true,
    saveUninitialized: true,
    
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


app.listen(4013, () => {
    console.log("Connecté sur le port 4013")
})