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

// Endpoint to download (Serves a client-side download bridge page to bypass Cobalt IP-locking and Vercel size caps)
app.get('/download', (req, res) => {
  const { url, format_id } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preparing Download - Mediach</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #020617;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    .container {
      text-align: center;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(51, 65, 85, 0.5);
      padding: 2.5rem;
      border-radius: 1.5rem;
      backdrop-filter: blur(16px);
      max-width: 420px;
      width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      position: relative;
      z-index: 10;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(139, 92, 246, 0.1);
      border-left-color: #8b5cf6;
      border-radius: 50%;
      margin: 0 auto 1.5rem;
      animation: spin 1s linear infinite;
    }
    h2 {
      margin: 0 0 0.5rem;
      font-size: 1.6rem;
      font-weight: 800;
      background: linear-gradient(to right, #a78bfa, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.025em;
    }
    p {
      color: #94a3b8;
      font-size: 0.95rem;
      margin: 0 0 1.25rem;
      line-height: 1.5;
    }
    .status {
      font-size: 0.8rem;
      color: #64748b;
      font-family: monospace;
      background: rgba(0, 0, 0, 0.3);
      padding: 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      word-break: break-all;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .glow {
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      filter: blur(40px);
      z-index: 1;
    }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="container">
    <div class="spinner" id="spinner"></div>
    <h2 id="title">Securing Tunnel</h2>
    <p id="desc">Establishing direct connection to Celestial download mirrors from your device...</p>
    <div class="status" id="status">Initializing handshake...</div>
  </div>

  <script>
    const targetUrl = ${JSON.stringify(url)};
    const formatId = ${JSON.stringify(format_id)};
    
    const COBALT_INSTANCES = [
      'https://cobaltapi.squair.xyz',
      'https://fox.kittycat.boo',
      'https://dog.kittycat.boo',
      'https://api.dl.woof.monster',
      'https://cobaltapi.kittycat.boo'
    ];

    async function startDownload() {
      const statusEl = document.getElementById('status');
      const titleEl = document.getElementById('title');
      const descEl = document.getElementById('desc');
      const spinnerEl = document.getElementById('spinner');

      const isAudio = formatId === 'mp3' || formatId === 'm4a' || formatId === 'wav';
      const requestBody = {
        url: targetUrl,
        downloadMode: isAudio ? 'audio' : 'auto',
        ...(isAudio ? {
          audioFormat: formatId === 'm4a' ? 'best' : (formatId || 'mp3'),
          audioBitrate: '320'
        } : {
          videoQuality: formatId || '720'
        })
      };

      let instances = [...COBALT_INSTANCES];
      try {
        statusEl.innerText = 'Resolving global active mirrors...';
        const directoryRes = await fetch('https://cobalt.directory/api/working?type=api');
        const dirData = await directoryRes.json();
        if (dirData && dirData.data) {
          const ytApis = dirData.data.youtube || [];
          const scApis = dirData.data.soundcloud || [];
          const merged = Array.from(new Set([...ytApis, ...scApis, ...COBALT_INSTANCES]));
          if (merged.length > 0) {
            instances = merged;
          }
        }
      } catch(e) {
        console.warn('Failed to load online mirrors, using defaults');
      }

      let lastError = 'No responsive mirrors found';
      for (const instance of instances) {
        try {
          const hostname = new URL(instance).hostname;
          statusEl.innerText = 'Querying mirror: ' + hostname;
          
          const response = await fetch(instance + '/', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            lastError = errData.error?.code || 'HTTP ' + response.status;
            continue;
          }

          const data = await response.json();
          if (data && data.url) {
            statusEl.innerText = 'Tunnel resolved via ' + hostname;
            titleEl.innerText = 'Download Initialized';
            descEl.innerText = 'Your media download has started. You can now close this tab.';
            spinnerEl.style.display = 'none';

            // Trigger file download
            const a = document.createElement('a');
            a.href = data.url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
          } else {
            lastError = data.error?.code || 'Invalid response from mirror';
          }
        } catch (err) {
          lastError = err.message;
        }
      }

      titleEl.innerText = 'Tunnel Resolution Failed';
      descEl.innerText = 'Unable to establish download session through the mirror pipelines.';
      statusEl.innerText = 'Error details: ' + lastError;
      spinnerEl.style.borderLeftColor = '#ef4444';
      spinnerEl.style.animation = 'none';
    }

    window.onload = startDownload;
  </script>
</body>
</html>`);
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
