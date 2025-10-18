// index.js
import express from "express";
import bodyParser from "body-parser";
import { YoutubeTranscript } from "youtube-transcript";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());

// Serve frontend HTML page
app.use(express.static(path.join(__dirname, "public")));

// Function to extract YouTube video ID from various URL formats
function getYouTubeVideoId(url) {
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Transcript API
app.post("/api/get-transcript", async (req, res) => {
  const { videoUrl } = req.body;
  if (!videoUrl) return res.status(400).json({ error: "Video URL required" });

  const videoId = getYouTubeVideoId(videoUrl);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL" });

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    res.json({ transcript });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transcript", details: err.message });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
