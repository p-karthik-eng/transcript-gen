import express from "express";
import bodyParser from "body-parser";
import { YoutubeTranscript } from "youtube-transcript";

const app = express();
app.use(bodyParser.json());

// Serve static files (HTML)
app.use(express.static("public"));

// Transcript API
app.post("/api/get-transcript", async (req, res) => {
  const { videoUrl } = req.body;
  if (!videoUrl) return res.status(400).json({ error: "Video URL required" });

  const videoIdMatch = videoUrl.match(/v=([a-zA-Z0-9_-]{11})/);
  if (!videoIdMatch) return res.status(400).json({ error: "Invalid YouTube URL" });

  const videoId = videoIdMatch[1];

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    res.json({ transcript });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transcript", details: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
