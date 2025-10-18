import express from "express";
import axios from "axios";
import { YoutubeTranscript } from "youtube-transcript";

const app = express();
app.use(express.json());

app.post("/api/get-transcript", async (req, res) => {
  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: "Missing YouTube video URL" });
  }

  try {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    // Try official YouTube transcript first
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      if (transcript && transcript.length > 0) {
        return res.status(200).json({ source: "youtube-transcript", transcript });
      }
    } catch (err) {
      console.warn("⚠️ youtube-transcript failed, trying backup API...");
    }

    // Backup: Use YouTube internal API (unofficial)
    const response = await axios.post(
      "https://yt.lemnoslife.com/videos",
      { id: videoId },
      { headers: { "Content-Type": "application/json" } }
    );

    const captions = response.data?.items?.[0]?.captions?.[0]?.snippet?.textOriginal;
    if (!captions) {
      throw new Error("No transcript found (both methods failed)");
    }

    res.status(200).json({ source: "yt.lemnoslife", transcript: captions });

  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch transcript",
      details: error.message,
    });
  }
});

// Extract video ID from any YouTube URL
function extractVideoId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

app.get("/", (req, res) => {
  res.send("✅ YouTube Transcript Generator API is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
