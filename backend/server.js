import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer temp storage
const upload = multer({ dest: "uploads/" });

// Health check
app.get("/", (req, res) => {
  res.send("☁️ Cloudinary backend running");
});

// Upload route
app.post("/upload", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "raw",          // IMPORTANT for documents
        use_filename: true,
        unique_filename: false,
      });

      // Remove temp file
      fs.unlinkSync(req.file.path);

      return res.json({
        success: true,
        url: result.secure_url,
        filename: result.original_filename,
        type: result.resource_type,
      });

    } catch (error) {
      console.error("Upload error:", error);

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
