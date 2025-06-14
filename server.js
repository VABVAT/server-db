const express = require("express");
const  cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const OpenAI = require("openai");
const app = express();
const prisma = new PrismaClient();
const { differenceInHours } = require('date-fns');
const axios = require('axios');


app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


const openai = new OpenAI({
  apiKey: process.env.GPT_KEY
});

app.get("/", (req, res) => {
    res.send("Welcome to the Cracked-code API!");
}
)

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

async function generateCode(prompt){
    const defaultPrompt = process.env.DEEPSEEK_DEFAULT;
    prompt = (prompt == null || prompt.trim() == '') ? "" : prompt;
  try {
          const response = await openai.chat.completions.create(
              {
                  model: 'o3-mini', // Specify the R1 model
                  messages: [
                      { role: 'user', content:  String(defaultPrompt) + " " + prompt}
                  ],
                  store:true,
              },
          );
        // let buffer = ""
        //   mainWindow.webContents.send("superresponse", response.choices[0].message.content);
        // const formattedContent = formatCodeBlocks(response.choices[0].message.content);
        const respo = response.choices[0].message.content
        const rrr = await openai.chat.completions.create(
            {
                model: 'gpt-4o', // Specify the R1 model
                messages: [
                    { role: 'user', content:  "seperate the code part and other part in this response, wrap C++ code in ``` for easy formatting, DO NOT MODIFY THE LOGIC" + " \n" + respo}
                ],
                store:true
            },
        );
        // console.log("Response:", rrr.choices[0].message.content);  
        return rrr.choices[0].message.content;

        } catch (error) {
            return "Error";
            // mainWindow.webContents.send("superresponse", "ERROR");
    }  
}

app.post("/reasongpt", async (req, res) => {
    const authReq = req.body.auth;
    const user = await prisma.user.findUnique({
        where: {hardwareId: authReq}
    })
    if(!user) return res.status(400).json({response: "Invalid hardware ID or request limit reached"});
    // TOdo
    const now = new Date();
    const hoursSinceLastReset = differenceInHours(now, user.lastResetAt);

    if (hoursSinceLastReset >= 24) {
        await prisma.user.update({
            where: { hardwareId: authReq },
            data: {
                Usage: 0,
                lastResetAt: now
            }
        });
        user.Usage = 0; // update local variable for next check
    }

    if(user.Usage > 40) return res.status(400).json({response: "Usage limit reached for this day"});
    
    await prisma.user.update({
        where: { hardwareId: authReq },
        data: { Usage: { increment: 1 } }
    });
   
    const defaultPrompt = req.body.prompt;
    const answer = await generateCode(defaultPrompt);
    return res.status(200).json({response: answer});

    
})

async function sendImagesToGpt4(imageCache) {
    const imageMessages = imageCache.map((base64Image) => ({
      type: "image_url",
      image_url: { url: `data:image/png;base64,${base64Image}` }
    }));
    const defaultPrompt = process.env.IMAGE_DEFAULT_PROMPT
    // Construct API request with multiple images
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: String(defaultPrompt) },
              ...imageMessages, // ✅ Dynamically add images
            ],
          },
        ],
        max_tokens: 3000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GPT_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content;
}

app.post("/gpt4", async (req, res) => {
    const authReq = req.body.auth;
        const user = await prisma.user.findUnique({
        where: {hardwareId: authReq}
    })
    if(!user) return res.status(400).json({response: "Invalid hardware ID or request limit reached"});
    // TOdo
    const now = new Date();
    const hoursSinceLastReset = differenceInHours(now, user.lastResetAt);

    if (hoursSinceLastReset >= 24) {
        await prisma.user.update({
            where: { hardwareId: authReq },
            data: {
                Usage: 0,
                lastResetAt: now
            }
        });
        user.Usage = 0; // update local variable for next check
    }

    if(user.Usage > 40) return res.status(400).json({response: "Usage limit reached for this day"});
    
    await prisma.user.update({
        where: { hardwareId: authReq },
        data: { Usage: { increment: 1 } }
    });
    const images = req.body.images;
    const repson = await sendImagesToGpt4(images);
    res.status(200).json({response: repson});

})

// 🚀 Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

