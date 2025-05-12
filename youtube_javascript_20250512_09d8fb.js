const express = require('express');
const cors = require('cors');
const axios = require('axios');
const ytdl = require('youtube-dl-exec');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting (100 requests per hour per IP)
const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60 * 60
});

// Middleware for rate limiting
const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => next())
    .catch(() => res.status(429).send('Too Many Requests'));
};

// Get video info endpoint
app.post('/api/video-info', rateLimiterMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    const info = await ytdl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true
    });

    const formats = info.formats
      .filter(f => f.filesize && f.width)
      .map(f => ({
        quality: f.format_note || f.quality,
        format: f.ext,
        filesize: (f.filesize / (1024 * 1024)).toFixed(1) + 'MB',
        url: f.url
      }));

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration_string,
      formats
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid URL or video unavailable' });
  }
});

// Download endpoint
app.get('/download', rateLimiterMiddleware, async (req, res) => {
  try {
    const { url, quality } = req.query;
    const info = await ytdl(url, { dumpSingleJson: true });
    
    const format = info.formats.find(f => 
      (f.format_note === quality || f.quality === quality) && f.ext === 'mp4'
    );

    if (!format) throw new Error('Format not available');
    
    res.header('Content-Disposition', `attachment; filename="${info.title}.mp4"`);
    res.header('Content-Type', 'video/mp4');
    
    axios.get(format.url, { responseType: 'stream' })
      .then(response => response.data.pipe(res));
    
  } catch (error) {
    res.status(400).send('Download failed: ' + error.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));