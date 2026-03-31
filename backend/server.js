require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const yts = require('yt-search');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 📦 MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Master Database'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 👤 User Schema
const userSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  avatar: String,
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// ---------------------------------------------------------
// 🔐 AUTH & GLOBAL SYNC ROUTES
// ---------------------------------------------------------

// Register or Sync User (Global Login)
app.post('/api/auth/sync', async (req, res) => {
  try {
    const { id, name, email, avatar } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      user.lastActive = new Date();
      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      await user.save();
    } else {
      user = new User({
        id: id || Date.now().toString(),
        name,
        email: email.toLowerCase(),
        avatar
      });
      await user.save();
    }
    
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Heartbeat (Update "Online Now" status)
app.post('/api/auth/heartbeat', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send();
    
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { lastActive: new Date() }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).send();
  }
});

// ---------------------------------------------------------
// 👑 ADMIN COMMAND CENTER (ROOT ONLY)
// ---------------------------------------------------------

const adminAuth = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  if (secret === process.env.ADMIN_SECRET) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Admin access only' });
  }
};

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const now = new Date();
    
    // Online in last 5 minutes
    const onlineNow = await User.countDocuments({
      lastActive: { $gt: new Date(now.getTime() - 5 * 60 * 1000) }
    });
    
    // Active in last 24 hours
    const activeToday = await User.countDocuments({
      lastActive: { $gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    });
    
    // New users today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const joinedToday = await User.countDocuments({
      createdAt: { $gt: startOfToday }
    });
    
    res.json({ totalUsers, onlineNow, activeToday, joinedToday });
  } catch (err) {
    res.status(500).json({ error: 'Stats failed' });
  }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().sort({ lastActive: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'User list failed' });
  }
});

// ---------------------------------------------------------
// 🎶 MUSIC ROUTES (EXISTING)
// ---------------------------------------------------------

app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    const r = await yts(q);
    const videos = r.videos.slice(0, 20).map(v => ({
      id: v.videoId,
      title: v.title, artist: v.author.name,
      artwork: v.thumbnail, duration: v.seconds * 1000, url: v.url
    }));
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

app.get('/download/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    res.header('Content-Disposition', `attachment; filename="${videoId}.mp3"`);
    res.header('Content-Type', 'audio/mpeg');
    ytdl(url, { filter: 'audioonly', quality: 'highestaudio' }).pipe(res);
  } catch (error) {
    res.status(500).send('Download failed');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Rimuru Master Backend running on port ${PORT}`);
});
