const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is missing from environment variables.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testEmbedding() {
  console.log('Testing text-embedding-004...');
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const text = 'Hello world, this is a test of the Gemini embedding service.';
  
  const result = await model.embedContent(text);
  const embedding = result.embedding.values;
  
  console.log('Embedding values type:', typeof embedding);
  console.log('Is array:', Array.isArray(embedding));
  console.log('Dimension length:', embedding.length);
  console.log('Sample values:', embedding.slice(0, 5));
}

async function testGeneration() {
  console.log('\nTesting gemini-1.5-flash text generation...');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent('Explain RAG in one sentence.');
  console.log('AI Response:', result.response.text());
}

async function main() {
  await testEmbedding();
  await testGeneration();
}

main().catch(console.error);
