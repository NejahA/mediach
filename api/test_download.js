const axios = require('axios');

async function testDownload() {
  const instance = 'https://cobaltapi.squair.xyz';
  const url = 'https://www.youtube.com/watch?v=BRiXDpj1X1A';
  
  console.log(`Requesting Cobalt API from ${instance}...`);
  try {
    const res = await axios.post(`${instance}/`, {
      url,
      downloadMode: 'auto',
      videoQuality: '720'
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('API Status:', res.status);
    console.log('API Response:', res.data);

    if (res.data && res.data.url) {
      const tunnelUrl = res.data.url;
      console.log(`\nAttempting download from tunnel: ${tunnelUrl}`);
      
      const start = Date.now();
      const downloadRes = await axios.get(tunnelUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        responseType: 'stream',
        timeout: 10000
      });

      console.log(`Download Response Status: ${downloadRes.status}`);
      console.log('Download Headers:', downloadRes.headers);
      
      let bytesCount = 0;
      downloadRes.data.on('data', (chunk) => {
        bytesCount += chunk.length;
        if (bytesCount > 1000) {
          console.log(`Successfully received stream data! Read ${bytesCount} bytes so far.`);
          downloadRes.data.destroy(); // stop download
        }
      });

      downloadRes.data.on('end', () => {
        console.log(`Stream ended. Total bytes read: ${bytesCount}`);
      });
    }
  } catch (err) {
    console.error('Test failed:', err.message);
    if (err.response) {
      console.error('Error status:', err.response.status);
      console.error('Error data:', err.response.data);
    }
  }
}

testDownload();
