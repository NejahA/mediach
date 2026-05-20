const axios = require('axios');

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

const url = 'https://www.youtube.com/watch?v=BRiXDpj1X1A';

async function testAll() {
  console.log('Testing Cobalt mirrors from backend context...');
  const requestBody = {
    url,
    downloadMode: 'auto',
    videoQuality: '720'
  };

  for (const instance of COBALT_INSTANCES) {
    console.log(`\nTesting instance: ${instance}`);
    const start = Date.now();
    try {
      const res = await axios.post(`${instance}/`, requestBody, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 8000
      });
      console.log(`Status: ${res.status} (${Date.now() - start}ms)`);
      console.log('Response:', JSON.stringify(res.data).substring(0, 300));
    } catch (err) {
      console.log(`Failed: ${err.message} (${Date.now() - start}ms)`);
      if (err.response) {
        console.log('Error status:', err.response.status);
        console.log('Error response:', JSON.stringify(err.response.data));
      }
    }
  }
}

testAll();
