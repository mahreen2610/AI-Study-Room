const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('CRITICAL: GEMINI_API_KEY is missing from environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

/**
 * Generates a generative model stream based on context, history, and a user question using Google Gemini.
 * @param {string} context - The retrieved document chunks concatenated.
 * @param {Array} history - Array of last 6 messages. Format: { role: 'user'|'assistant', content: string }
 * @param {string} question - The user's query.
 * @returns {Promise<AsyncGenerator>} The async content stream.
 */
async function generateStream(context, history, question) {
  try {
    const systemInstruction = `You are a study assistant. Answer only based on the provided context. If the answer cannot be found or inferred from the provided context, state that you cannot answer based on the uploaded materials.

Context:
${context}`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      systemInstruction: systemInstruction
    });

    // Map history to Gemini's chat format
    // Format: { role: 'user'|'model', parts: [{ text: string }] }
    const contents = [];
    history.forEach((msg) => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });

    // Append user question
    contents.push({
      role: 'user',
      parts: [{ text: question }]
    });

    // Call generateContentStream
    const result = await model.generateContentStream({
      contents: contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    });

    return result.stream;
  } catch (error) {
    console.error('Error generating AI stream (Gemini):', error);
    throw error;
  }
}

module.exports = { generateStream };
