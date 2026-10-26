const express = require("express");
const app = express();

require("dotenv/config");

const {PrismaPg} = require("@prisma/adapter-pg");
const {PrismaClient} = require("@prisma/client");
const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
const prisma = new PrismaClient({adapter});

app.use(express.json());


app.get("/health", (req, res)=>{
    res.json({"status": "ok"})
})

app.post('/users', async (req, res)=>{
    let {username, email, fullname, bio} = req.body;
    if(username.trim().length === 0 || email.trim().length === 0 || fullname.trim().length === 0){
        res.status.json({"error": "username, email and fullname are required"});
    }
    else{
        try{
            await prisma.user.create({
                data: {
                    username,
                    email,
                    fullname,
                    bio
                }
            })
        }
        catch(err){
            res.status(500).json({"error": err});
        }
    }
})


app.get('/users', async (req, res)=>{
    try{
        const users = await prisma.user.findMany();
        res.json(users);
    }
    catch(err){
        res.status(500).json(users);
    }
})

app.get('/users/:id', async (req, res)=>{
    try{
        const id = Number(req.params.id);
        const user = await prisma.user.findUnique({
            where: {id: id},
        });
        if(user !== null){
            res.json(user);
        }
        else{
            res.status(404).json({ "error": "User not found" });
        }
    }
    catch(err){
        res.status(500).json({"error": err});
    }
})

// app.patch('/users/:id', (req, res)=>{

// })


app.delete('/users/:id', async (req, res)=>{
    try{
        const id = Number(req.params.id);
        const deletedUser = await prisma.user.delete({
            where: {
               id : id,
            },
        });
    
        res.json(deletedUser)
    }
    catch(err){
        res.json({"error": err})
    }
})

app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})

