import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs-extra";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));

app.use(express.json());

const upload = multer({ dest: "uploads/" });

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const TOKEN_PATH = "token.json";

/* ---------------- Load token if exists ---------------- */
if (fs.existsSync(TOKEN_PATH)) {
  try {
    const token = fs.readJsonSync(TOKEN_PATH);
    oAuth2Client.setCredentials(token);
    console.log("✅ Token loaded");
  } catch (err) {
    console.log("⚠️ Token file invalid, resetting...");
    fs.writeJsonSync(TOKEN_PATH, {});
  }
}

/* ---------------- Home route ---------------- */
app.get("/", (req, res) => {
  res.send(`<a href="/auth">Connect Google Drive</a>`);
});

/* ---------------- OAuth login ---------------- */
app.get("/auth", (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    prompt: "consent"
  });
  res.redirect(url);
});

/* ---------------- OAuth callback ---------------- */
app.get("/oauth2callback", async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    fs.writeJsonSync(TOKEN_PATH, tokens);

    res.send("✅ Google Drive connected successfully. You can close this tab.");
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).send("Authentication failed");
  }
});

/* ---------------- Upload endpoint ---------------- */
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!fs.existsSync(TOKEN_PATH)) {
      return res.status(401).json({
        success: false,
        message: "Google Drive not connected"
      });
    }

    const drive = google.drive({
      version: "v3",
      auth: oAuth2Client
    });

    const fileMetadata = {
      name: req.file.originalname,
      parents: [process.env.DRIVE_FOLDER_ID]   // specific folder
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path)
    };

    await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id"
    });

    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: "File uploaded to Google Drive"
    });

  } catch (err) {
    console.error("Upload error:", err);

    res.status(500).json({
      success: false,
      message: "Upload failed"
    });
  }
});

/* ---------------- Start server ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
