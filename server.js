const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Fetch video info
app.post('/api/fetch', async (req, res) => {
  const url = req.body.url;
  if (!url || !ytdl.validateURL(url)) return res.status(400).json({ error: 'Invalid YouTube URL' });

  try {
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const resolutions = formats.map(f => ({
      itag: f.itag,
      label: f.qualityLabel || 'Unknown',
      size: f.contentLength ? `${(f.contentLength / 1024 / 1024).toFixed(2)} MB` : 'Unknown'
    }));

    res.json({
      thumbnail: info.videoDetails.thumbnails.pop().url,
      resolutions
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not fetch video info' });
  }
});

// Download video
app.get('/api/download', (req, res) => {
  const { url, quality } = req.query;
  if (!url || !ytdl.validateURL(url)) return res.status(400).send('Invalid URL');

  ytdl.getInfo(url).then(info => {
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
    ytdl(url, { quality }).pipe(res);
  }).catch(err => {
    console.error(err);
    res.status(500).send('Download failed');
  });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
