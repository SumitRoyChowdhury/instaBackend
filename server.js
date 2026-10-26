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
        res.status(400).json({"error": "username, email and fullname are required"});
        return
    }
    else{
        try{
            await prisma.user.create({
                data: {
                    username: username,
                    email: email,
                    fullname: fullname,
                    bio: bio
                }
            })
            res.status(201).json();
        }
        catch(err){
            res.status(500).json({"error": "Internal server error"});
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

app.patch("/users/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  const data = {};
  for (const field of ["fullname", "bio", "isPrivate"]) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      data[field] = req.body[field];
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }

    console.error(error);
    return res.status(500).json({ error: "Failed to update user" });
  }
});


app.delete('/users/:id', async (req, res)=>{
    try{
        const id = Number(req.params.id);
        await prisma.user.delete({
            where: {
               id : id,
            },
        });
        res.status(204).json();
    }
    catch(err){
        res.status(404).json({ "error": "User not found" })
    }
})



app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})

