import express from "express";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

const imagesDir = path.join(process.cwd(), "images");

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

async function saveImage(imageUrl: string, id: string) {
  const res = await fetch(imageUrl, {
    headers: {
      Authorisation: "",
    },
  });
  const buffer = Buffer.from(await res.arrayBuffer());

  const filePath = path.join(imagesDir, `${id}.png`);
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

const router = express.Router();

const imagesMap = new Map<string, string>();

router.get("/generate/:prompt", async (req, res) => {
  const { API_KEY, API_URL } = process.env;

  if (!API_KEY) {
    return res
      .status(500)
      .json({ error: "Requied environment variables not found!" });
  }

  const { prompt } = req.params;

  if (!prompt) {
    return res
      .status(400)
      .json({ success: false, message: "Prompt is required" });
  }

  const clearPrompt = prompt.replace(" ", "-");
  const BASE_URL = `https://gen.pollinations.ai/image/${clearPrompt}?seed=${Math.floor(Math.random() * 10000).toString()}&key=${API_KEY}&model=flux&width=512&512`;
  const imageId = nanoid();
  await saveImage(BASE_URL, imageId);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Generated Image</title>
        <meta property="og:image" content="${BASE_URL}" />
      </head>
      <body style="background:#0000;color:white;text-align:center;">
        <h1>${clearPrompt}</h1>
        <img src="${BASE_URL}" alt="Generated image" style="max-width:90%;border-radius:12px;" />
      </body>
    </html>
  `;

  imagesMap.set(imageId, htmlContent);

  return res.status(200).redirect(`${API_URL}/image/view/${imageId}`);
});

router.get("/view-image/:id.png", (req, res) => {
  const filePath = path.join(process.cwd(), "images", `${req.params.id}.png`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Not found");
  }

  res.sendFile(filePath);
});

router.get("/view/:id", (req, res) => {
  const { API_URL } = process.env;

  const imageUrl = `${API_URL}/image/view-image/${req.params.id}.png??seed=${Math.floor(Math.random() * 10000).toString()}`;

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Generated Image</title>

        <!-- Open Graph -->
        <meta property="og:type" content="website" />
        <meta property="og:title" content="AI Generated Image" />
        <meta property="og:description" content="Generated just for you" />
        <meta property="og:image" content="${imageUrl}" />

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${imageUrl}" />
      </head>

      <body>
        <img src="${imageUrl}" />
      </body>
    </html>
  `);
});

export default router;
