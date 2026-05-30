const https = require('https');
require('dotenv').config();

const hfToken = process.env.HF_TOKEN;
if (!hfToken) {
  console.warn('CRITICAL: HF_TOKEN is missing from environment variables.');
}

/**
 * Generates a 768-dimensional vector embedding for the given text using Hugging Face all-mpnet-base-v2.
 * Uses native https with family: 4 to resolve DNS using IPv4 on Render's virtual networks.
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} The embedding vector array.
 */
async function getEmbedding(text) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ inputs: text });
    
    const options = {
      hostname: 'router.huggingface.co',
      path: '/hf-inference/models/sentence-transformers/all-mpnet-base-v2',
      method: 'POST',
      family: 4, // Force IPv4 resolution to bypass DNS/IPv6 routing bugs on Render
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Hugging Face API error: ${res.statusCode} - ${data}`));
          return;
        }

        try {
          const result = JSON.parse(data);
          if (Array.isArray(result)) {
            resolve(result);
          } else {
            reject(new Error('Failed to retrieve embedding values from Hugging Face API response'));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Hugging Face response: ${e.message} - Response: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Hugging Face connection failed: ${e.message}`));
    });

    req.write(postData);
    req.end();
  });
}

module.exports = { getEmbedding };



