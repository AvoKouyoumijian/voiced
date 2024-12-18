import express from "express";
import config from "./config.json";
import path from "path";
import { voicePdf, voiceWebPage } from "./voiced";
import fileUpload from "express-fileupload";

// Set up web app
const app = express();

// Add middleware to give acess to frontend to user
app.use(express.static(path.join(__dirname, "public")));
// Add middleware to parse JSON
app.use(express.json());

// add the functionality to upload files form frontend
app.use(fileUpload());

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || "127.0.0.1";

// Start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/index.html"));
});

app.post("/api/link/voice", (req, res) => {
  try {
    const link = req.body.link;
    console.log(link);
    if (!link.includes("https://")) throw new Error("Invalid URL");
    voiceWebPage(link, res);
    const headers = {
      "Content-Type": "audio/mp3",
    };
    res.writeHead(200, headers);
  } catch (err) {
    if (err.message.includes("Invalid URL")) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.post("/api/pdf/voice", (req, res) => {
  try {
    const file = req.files?.pdfFile;
    voicePdf(file, res);
    const headers = {
      "Content-Type": "audio/mp3",
    };
    res.writeHead(200, headers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  return;
});

// For coverage, handle Ctrl+C gracefully
process.on("SIGINT", () => {
  server.close(() => {
    console.log("Shutting down server gracefully.");
    process.exit();
  });
});
