const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Search YouTube
app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
    const r = await yts(q);
    const videos = r.videos.slice(0, 20).map(v => ({
      id: v.videoId,
      title: v.title,
      artist: v.author.name,
      artwork: v.thumbnail,
      duration: v.seconds * 1000, 
      url: v.url
    }));
    
    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

// Stream MP3
app.get('/download/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    res.header('Content-Disposition', `attachment; filename="${videoId}.mp3"`);
    res.header('Content-Type', 'audio/mpeg');
    
    ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
      .pipe(res);
      
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to download audio track');
  }
});

app.listen(PORT, () => {
  console.log(`Music YouTube Backend running on http://localhost:${PORT}`);
});
