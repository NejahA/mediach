const express = require('express');

const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

const YTDLP_PATH = path.join(__dirname, 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');

console.log('Starting mediach API...');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Basic endpoint to check if server is running
app.get('/', (req, res) => {
  res.send('mediach API is running');
});

// Endpoint to get video info
app.get('/info', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  let cleanUrl = url;
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isDailymotion = url.includes('dailymotion.com') || url.includes('dai.ly');

  if (!isYouTube && !isDailymotion) {
    return res.status(400).json({ error: 'Only YouTube and Dailymotion links are supported.' });
  }

  if (isYouTube && cleanUrl.includes('v=')) {
    try {
      const match = cleanUrl.match(/[?&]v=([^&]+)/);
      if (match && match[1]) {
        cleanUrl = `https://www.youtube.com/watch?v=${match[1]}`;
      }
    } catch (e) {}
  }

  console.log('--- INFO REQUEST ---');
  console.log('URL:', cleanUrl);

  let outputData = '';
  let errorData = '';

  const ytProcess = spawn(YTDLP_PATH, [
    cleanUrl,
    '--dump-single-json',
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificate',
    '--no-check-formats',
    '--flat-playlist'
  ]);

  const timeoutId = setTimeout(() => {
    ytProcess.kill();
  }, 30000);

  ytProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  ytProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  ytProcess.on('close', (code) => {
    clearTimeout(timeoutId);
    if (code === 0) {
      try {
        const output = JSON.parse(outputData);
        console.log('Success:', output.title);
        res.json({
          title: output.title,
          author: output.uploader || output.uploader_id || 'Unknown',
          thumbnail: output.thumbnail,
          duration: output.duration,
          source: output.extractor_key,
          formats: output.formats
            .filter(f => f.vcodec !== 'none' && f.acodec !== 'none' && !f.url.includes('manifest') && !f.url.includes('m3u8'))
            .map(f => ({
              quality: f.format_note || f.resolution,
              container: f.ext,
              url: f.url,
              filesize: f.filesize || f.filesize_approx,
              format_id: f.format_id
            }))
        });
      } catch (e) {
        console.error('Parse error:', e.message);
        res.status(500).json({ error: 'Failed to parse video info' });
      }
    } else {
      console.error('yt-dlp error:', errorData);
      res.status(500).json({ error: 'Failed to fetch video info. It might be private or region-restricted.' });
    }
  });
});

// Endpoint to download (proxy the stream)
app.get('/download', async (req, res) => {
  const { url, format_id } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log(`Starting download for ${url} with format ${format_id}`);
    
    // Get info first to get the title
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noPlaylist: true,
    });

    const title = output.title.replace(/[^\w\s]/gi, '');
    const format = output.formats.find(f => f.format_id === format_id) || { ext: 'mp4' };
    const extension = format.ext || 'mp4';

    res.header('Content-Disposition', `attachment; filename="${title}.${extension}"`);

    // Use spawn to pipe yt-dlp stdout directly to res
    const ytProcess = spawn(YTDLP_PATH, [
      url,
      '-f', format_id || 'best',
      '-o', '-', // Output to stdout
      '--no-playlist',
      '--no-warnings',
      '--no-check-certificate'
    ]);

    ytProcess.stdout.pipe(res);

    ytProcess.stderr.on('data', (data) => {
      // console.log(`yt-dlp stderr: ${data}`);
    });

    ytProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`yt-dlp process exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download video' });
        }
      }
    });

    req.on('close', () => {
      ytProcess.kill();
    });

  } catch (error) {
    console.error('Error downloading:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download video' });
    }
  }
});

// Endpoint to stream media (proxy to bypass CORS and handle seeking)
app.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const response = await axios({
      method: 'get',
      url: url,
      headers: headers,
      responseType: 'stream'
    });

    res.set(response.headers);
    response.data.pipe(res);
  } catch (error) {
    console.error('Streaming error:', error.message);
    res.status(500).json({ error: 'Failed to stream media' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
