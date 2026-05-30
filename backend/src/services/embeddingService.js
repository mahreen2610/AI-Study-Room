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
      path: '/hf-inference/models/sentence-transformers/all-mpnet-base-v2/pipeline/feature-extraction',
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
          
          if (result && result.error) {
            reject(new Error(`Hugging Face API returned error: ${result.error}`));
            return;
          }

          if (Array.isArray(result)) {
            // Case 1: 1D array of numbers [0.1, 0.2, ...]
            if (typeof result[0] === 'number') {
              if (result.length === 768) {
                resolve(result);
                return;
              }
              reject(new Error(`Expected 768 dimensions in 1D array, but got ${result.length}`));
              return;
            }

            // Case 2: 2D array [[0.1, 0.2, ...]]
            if (Array.isArray(result[0]) && typeof result[0][0] === 'number') {
              const vector = result[0];
              if (vector.length === 768) {
                resolve(vector);
                return;
              }
              reject(new Error(`Expected 768 dimensions in 2D array's first row, but got ${vector.length}`));
              return;
            }

            // Case 3: 3D array [[[0.1, 0.2, ...], [0.3, 0.4, ...], ...]]
            // Indicates token-level feature extraction. We apply Mean Pooling.
            if (Array.isArray(result[0]) && Array.isArray(result[0][0]) && typeof result[0][0][0] === 'number') {
              const tokens = result[0]; // array of token vectors
              const tokenCount = tokens.length;
              if (tokenCount === 0) {
                reject(new Error('Hugging Face API returned an empty token sequence'));
                return;
              }

              const dim = tokens[0].length;
              if (dim !== 768) {
                reject(new Error(`Expected 768-dimensional token vectors, but got ${dim}`));
                return;
              }

              // Compute mean pooled vector
              const pooled = new Array(dim).fill(0);
              for (let i = 0; i < tokenCount; i++) {
                for (let j = 0; j < dim; j++) {
                  pooled[j] += tokens[i][j];
                }
              }
              for (let j = 0; j < dim; j++) {
                pooled[j] /= tokenCount;
              }

              resolve(pooled);
              return;
            }

            reject(new Error('Unexpected array nesting structure from Hugging Face response'));
          } else {
            reject(new Error('Failed to retrieve embedding values from Hugging Face API response (not an array)'));
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



