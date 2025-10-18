import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());

// Serve frontend HTML
app.use(express.static(path.join(__dirname, "public")));

// Replace with your YouTube API key
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "YOUR_API_KEY_HERE";

// Helper: Extract video ID from URL
function getYouTubeVideoId(url) {
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Fetch transcript via YouTube Captions API
async function fetchTranscript(videoId) {
  // 1️⃣ Get captions list
  const captionsListUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}`;
  const captionsRes = await fetch(captionsListUrl);
  const captionsData = await captionsRes.json();

  if (!captionsData.items || captionsData.items.length === 0) {
    throw new Error("No captions found for this video");
  }

  // 2️⃣ Choose first available English caption (or fallback to any)
  const captionItem =
    captionsData.items.find(c => c.snippet.language === "en") || captionsData.items[0];

  const captionId = captionItem.id;

  // 3️⃣ Get caption content (API only returns SRT/TTML)
  const transcriptUrl = `https://www.googleapis.com/youtube/v3/captions/${captionId}?tfmt=txt&key=${YOUTUBE_API_KEY}`;
  const transcriptRes = await fetch(transcriptUrl);
  if (!transcriptRes.ok) throw new Error("Failed to fetch caption content");

  const transcriptText = await transcriptRes.text();
  return transcriptText;
}

// API Endpoint
app.post("/api/get-transcript", async (req, res) => {
  const { videoUrl } = req.body;
  if (!videoUrl) return res.status(400).json({ error: "Video URL required" });

  const videoId = getYouTubeVideoId(videoUrl);
  if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL" });

  try {
    const transcript = await fetchTranscript(videoId);
    res.json({ transcript });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transcript", details: err.message });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
