const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('CRITICAL: GEMINI_API_KEY is missing from environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

/**
 * Generates a 768-dimensional vector embedding for the given text using Google Gemini gemini-embedding-2.
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} The embedding vector array.
 */
async function getEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent({
      content: { parts: [{ text: text }] },
      outputDimensionality: 768
    });
    
    if (result && result.embedding && result.embedding.values) {
      return result.embedding.values;
    } else {
      throw new Error('Failed to retrieve embedding values from Gemini API response');
    }
  } catch (error) {
    console.error('[EmbeddingService] Error generating embedding:', error.message);
    throw error;
  }
}

module.exports = { getEmbedding };
