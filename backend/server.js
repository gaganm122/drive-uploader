import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import https from "https";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// -------------------------------
// Cloudinary Configuration
// -------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// -------------------------------
// Multer Configuration
// -------------------------------
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// -------------------------------
// Health Check
// -------------------------------
app.get("/", (req, res) => {
  res.send("✅ Cloudinary Backend Running");
});

// -------------------------------
// Upload Route
// -------------------------------
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file selected",
      });
    }

    // Allowed file types
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        success: false,
        error: "Invalid file type.",
      });
    }

    // Detect image
    const isImage = req.file.mimetype.startsWith("image/");

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: isImage ? "image" : "raw",
      use_filename: true,
      unique_filename: false,
      filename_override: req.file.originalname,
    });

    // Delete temporary file
    fs.unlinkSync(req.file.path);

    // Force original filename when downloading
    const downloadUrl =
      result.secure_url +
      "?fl_attachment=" +
      encodeURIComponent(req.file.originalname);

    res.json({
      success: true,
      url: downloadUrl,
      filename: req.file.originalname,
      type: result.resource_type,
    });
  } catch (error) {
    console.error(error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// -------------------------------
// Invalid Routes
// -------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});
// -------------------------------
// Download Route
// -------------------------------
app.get("/download", (req, res) => {

    const { url, filename } = req.query;

    if (!url || !filename) {
        return res.status(400).json({
            success: false,
            error: "Missing parameters"
        });
    }

    https.get(url, (cloudinaryRes) => {

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );

        res.setHeader(
            "Content-Type",
            cloudinaryRes.headers["content-type"] ||
            "application/octet-stream"
        );

        cloudinaryRes.pipe(res);

    }).on("error", (err) => {

        res.status(500).json({
            success: false,
            error: err.message
        });

    });

});
// -------------------------------
// Start Server
// -------------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});