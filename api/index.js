const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

console.log('Starting serverless-safe mediach API...');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// List of fallback Cobalt API instances
const COBALT_INSTANCES = [
  'https://nuko-c.meowing.de',
  'https://cobaltapi.squair.xyz',
  'https://fox.kittycat.boo',
  'https://dog.kittycat.boo',
  'https://api.dl.woof.monster',
  'https://cobaltapi.kittycat.boo',
  'https://api.qwkuns.me',
  'https://api.cobalt.tools'
];

// Helper to make a Cobalt request with fallbacks
async function fetchFromCobalt(url, options = {}) {
  let lastError = null;
  const isAudio = !!options.isAudioOnly;
  const requestBody = {
    url,
    downloadMode: isAudio ? 'audio' : 'auto',
    ...(isAudio ? {
      audioFormat: options.aFormat === 'm4a' ? 'best' : (options.aFormat || 'mp3'),
      audioBitrate: '320'
    } : {
      videoQuality: options.vQuality || '720'
    })
  };

  for (const instance of COBALT_INSTANCES) {
    try {
      const response = await axios.post(`${instance}/`, requestBody, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.status !== 'error') {
        return response.data;
      } else {
        lastError = response.data?.error?.code || 'Error response';
      }
    } catch (err) {
      lastError = err.message;
    }
  }
  throw new Error(`All download mirrors failed. Reason: ${lastError}`);
}

// Basic endpoint
app.get('/', (req, res) => {
  res.send('mediach Serverless API is running');
});

// Endpoint to get video info (Vercel-compatible oEmbed)
app.get('/info', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isDailymotion = url.includes('dailymotion.com') || url.includes('dai.ly');
  const isVimeo = url.includes('vimeo.com');
  const isSoundCloud = url.includes('soundcloud.com');
  const isTikTok = url.includes('tiktok.com');

  let oembedUrl = '';
  let source = 'Online Media';

  if (isYouTube) {
    oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    source = 'YouTube';
  } else if (isDailymotion) {
    oembedUrl = `https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(url)}&format=json`;
    source = 'Dailymotion';
  } else if (isVimeo) {
    oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
    source = 'Vimeo';
  } else if (isTikTok) {
    oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    source = 'TikTok';
  } else if (isSoundCloud) {
    oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    source = 'SoundCloud';
  }

  try {
    let title = 'Celestial Media File';
    let author = 'Unknown Space Explorer';
    let thumbnail = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop';

    if (oembedUrl) {
      try {
        const response = await axios.get(oembedUrl, { timeout: 8000 });
        title = response.data.title || title;
        author = response.data.author_name || author;
        thumbnail = response.data.thumbnail_url || thumbnail;
      } catch (e) {
        console.warn('oEmbed failed, sending generic metadata');
      }
    } else {
      try {
        const urlObj = new URL(url);
        source = urlObj.hostname.replace('www.', '');
        source = source.charAt(0).toUpperCase() + source.slice(1);
      } catch (e) {}
    }

    res.json({
      title,
      author,
      thumbnail,
      source,
      formats: [
        { quality: '1080p Full HD', container: 'mp4', format_id: '1080', type: 'video' },
        { quality: '720p HD', container: 'mp4', format_id: '720', type: 'video' },
        { quality: '480p SD', container: 'mp4', format_id: '485', type: 'video' },
        { quality: '360p Mobile', container: 'mp4', format_id: '360', type: 'video' },
        { quality: 'MP3 Audio Only', container: 'mp3', format_id: 'mp3', type: 'audio' }
      ]
    });
  } catch (error) {
    console.error('Info fetching error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve media metadata' });
  }
});

// Endpoint to download (Redirects to Cobalt CDN to bypass Vercel 4.5MB payload limit)
app.get('/download', async (req, res) => {
  const { url, format_id } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const isAudio = format_id === 'mp3' || format_id === 'm4a' || format_id === 'wav';
    const options = isAudio 
      ? { isAudioOnly: true, aFormat: format_id || 'mp3' } 
      : { vQuality: format_id || '720', isAudioOnly: false };

    const data = await fetchFromCobalt(url, options);

    if (data.status === 'redirect' || data.status === 'tunnel') {
      console.log(`Redirecting download for ${url} to ${data.url}`);
      return res.redirect(data.url);
    } else {
      return res.status(500).json({ error: 'Download mirror returned invalid response' });
    }
  } catch (error) {
    console.error('Download error:', error.message);
    res.status(500).json({ error: 'Failed to process download link' });
  }
});

// Endpoint to stream (Redirects to Cobalt CDN to avoid proxying through Vercel)
app.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const data = await fetchFromCobalt(url, {
      vQuality: '720',
      isAudioOnly: false
    });

    if (data.status === 'redirect' || data.status === 'tunnel') {
      console.log(`Redirecting stream for ${url} to ${data.url}`);
      return res.redirect(data.url);
    } else {
      return res.status(500).json({ error: 'Stream mirror returned invalid response' });
    }
  } catch (error) {
    console.error('Streaming error:', error.message);
    res.status(500).json({ error: 'Failed to initialize stream' });
  }
});

app.listen(PORT, () => {
  console.log(`Vercel-compatible backend server is running on http://localhost:${PORT}`);
});
