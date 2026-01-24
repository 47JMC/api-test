import express from "express";
import router from "./routes/image.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/image", router);

const PORT = process.env.PORT || 4000;
const API_URL = process.env.API_URL || "http://localhost";

app.listen(PORT, () => {
  console.log(`Server is running on http://${API_URL}:${PORT}`);
});
