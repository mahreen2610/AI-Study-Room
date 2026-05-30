require('dotenv').config();

const hfToken = process.env.HF_TOKEN;
if (!hfToken) {
  console.warn('CRITICAL: HF_TOKEN is missing from environment variables.');
}

/**
 * Generates a 768-dimensional vector embedding for the given text using Hugging Face all-mpnet-base-v2.
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} The embedding vector array.
 */
async function getEmbedding(text) {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-mpnet-base-v2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    if (Array.isArray(result)) {
      return result;
    } else {
      throw new Error('Failed to retrieve embedding values from Hugging Face API response');
    }
  } catch (error) {
    console.error('Error in getEmbedding (Hugging Face):', error);
    throw error;
  }
}

module.exports = { getEmbedding };

