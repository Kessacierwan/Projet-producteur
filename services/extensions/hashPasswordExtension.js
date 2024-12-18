const { Prisma } = require("@prisma/client")
const bcrypt = require ("bcrypt")

module.exports = Prisma.defineExtension({
    query:{
        client:{
            create: async({args, query})=>{
                try {
                    const hash = await bcrypt.hash(args.data.motDePasse, 10)
                    args.data.motDePasse = hash;
                    return query(args)
                    
                } catch (error) {
                    throw error
                    
                }
            }
        },
        producteur:{
            create: async({args, query})=>{
                try {
                    const hash = await bcrypt.hash(args.data.motDePasse, 10)
                    args.data.motDePasse = hash;
                    return query(args)
                    
                } catch (error) {
                    throw error
                    
                }
            }
        }
    }
}) 