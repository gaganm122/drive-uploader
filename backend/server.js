import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("☁️ Cloudinary backend running");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
use_filename: true,
unique_filename: false,

    });

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      url: result.secure_url,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
