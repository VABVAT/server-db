const express = require("express");
const  cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json()); // Middleware to parse JSON data

// 🟢 API Route: Get all users
app.post("/userCheck", async (req, res) => {
    if(!req.body.key || !req.body.id) return res.status(400).json({error: "Bad request"})
    const key = String(req.body.key)
    const hid = String(req.body.id)
    // if(!key || !hid) return res.status(400).json({error: "Bad request"})
    const user = await prisma.user.findUnique({
        where: {key: key}
    })
    if(!user){
        return res.status(400).json({error: "Key does not exist"})
    }
    if(user){
        console.log(user.hardwareId)
        if(user.hardwareId == "not-defined"){
            await prisma.user.update({
                where: {key: key},
                data: {hardwareId: hid}
            })
            return res.status(200).json({success: "welcome"})
        }else{
            if(user.hardwareId == hid){
                return res.status(200).json({success: "welcomef"})
            }else{
                return res.status(400).json({error: "restriction"})
            }
        }
    }
});

// 🚀 Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
