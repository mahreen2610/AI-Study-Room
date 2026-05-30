require('dotenv').config();

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  console.warn('CRITICAL: GROQ_API_KEY is missing from environment variables.');
}

/**
 * Generates a generative model stream based on context, history, and a user question using Groq (llama-3.1-8b-instant).
 * Yields OpenAI chunks mapped to a standard Gemini chunk interface ({ text: () => chunk }) to prevent breaking controllers.
 * @param {string} context - The retrieved document chunks concatenated.
 * @param {Array} history - Array of last 6 messages. Format: { role: 'user'|'assistant', content: string }
 * @param {string} question - The user's query.
 * @returns {Promise<AsyncGenerator>} The async content stream.
 */
async function generateStream(context, history, question) {
  try {
    const systemPrompt = `You are a study assistant. Answer only based on the provided context. If the answer cannot be found or inferred from the provided context, state that you cannot answer based on the uploaded materials.

Context:
${context}`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Map history to OpenAI roles
    history.forEach((msg) => {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    // Append user question
    messages.push({
      role: 'user',
      content: question
    });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        temperature: 0.2,
        max_tokens: 2048,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errText}`);
    }

    // Generator function that yield chunks wrapped in a Gemini-like { text() } helper
    async function* makeOpenAIStreamGenerator() {
      const reader = response.body;
      const decoder = new TextDecoder();
      let buffer = '';

      for await (const chunk of reader) {
        buffer += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          if (cleanLine === 'data: [DONE]') continue;

          if (cleanLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(cleanLine.slice(6));
              const textChunk = data.choices?.[0]?.delta?.content || '';
              if (textChunk) {
                yield {
                  text: () => textChunk
                };
              }
            } catch (e) {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }
    }

    return makeOpenAIStreamGenerator();
  } catch (error) {
    console.error('Error generating AI stream (Groq):', error);
    throw error;
  }
}

module.exports = { generateStream };

