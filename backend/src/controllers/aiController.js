const supabase = require('../services/supabaseService');
const { getEmbedding } = require('../services/embeddingService');
const { generateStream } = require('../services/geminiService');

/**
 * Send user query, run semantic search against document chunks, and stream Gemini response using SSE.
 */
async function chatWithAI(req, res, next) {
  try {
    const { roomId } = req.params;
    const { question } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // 1. Verify membership
    const { data: membership, error: membershipError } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'You do not have access to this room' });
    }

    // 2. Generate question embedding
    let questionEmbedding;
    try {
      questionEmbedding = await getEmbedding(question);
    } catch (embedError) {
      return res.status(500).json({ error: 'Failed to generate question embedding: ' + embedError.message });
    }

    // 3. Search document chunks using Supabase match_chunks function
    const { data: matchedChunks, error: matchError } = await supabase.rpc('match_chunks', {
      query_embedding: questionEmbedding,
      match_threshold: 0.1, // Generous threshold to match topics
      match_count: 5,
      p_room_id: roomId
    });

    if (matchError) {
      console.error('Error matching chunks:', matchError);
    }

    // 4. Construct context string
    let context = '';
    if (matchedChunks && matchedChunks.length > 0) {
      context = matchedChunks
        .map((c, idx) => `[Document Excerpt ${idx + 1}]:\n${c.content}`)
        .join('\n\n');
    } else {
      context = 'No relevant study materials/documents were found in this study room. Tell the user they need to upload study PDFs first to get custom context.';
    }

    // 5. Get last 6 messages from ai_messages for this room
    const { data: rawHistory, error: historyError } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(6);

    if (historyError) {
      console.error('Error fetching AI history:', historyError);
    }

    // Reverse history to make it chronological
    const history = rawHistory ? [...rawHistory].reverse() : [];

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 6. Generate the Gemini completion stream
    let aiStream;
    try {
      aiStream = await generateStream(context, history, question);
    } catch (streamError) {
      res.write(`data: ${JSON.stringify({ error: 'Gemini service failed to initialize: ' + streamError.message })}\n\n`);
      res.end();
      return;
    }

    // Iterate through chunks and stream back to frontend
    let fullResponse = '';
    try {
      for await (const chunk of aiStream) {
        const textChunk = chunk.text();
        fullResponse += textChunk;
        
        // Write SSE packet
        res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
      }
    } catch (chunkError) {
      console.error('Error during streaming chunks:', chunkError);
      res.write(`data: ${JSON.stringify({ error: 'Streaming interrupted: ' + chunkError.message })}\n\n`);
      res.end();
      return;
    }

    // 7. Save user query and full assistant response to the database
    // Execute these in background
    const saveMessages = async () => {
      try {
        await supabase.from('ai_messages').insert([
          { room_id: roomId, user_id: userId, role: 'user', content: question },
          { room_id: roomId, user_id: userId, role: 'assistant', content: fullResponse }
        ]);
      } catch (saveError) {
        console.error('Error saving AI messages to database:', saveError);
      }
    };
    saveMessages();

    // Signal completion to frontend
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    next(error);
  }
}

/**
 * Fetch all AI chat history for a specific room.
 */
async function getAIHistory(req, res, next) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Verify membership
    const { data: membership, error: membershipError } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'You do not have access to this room' });
    }

    // Fetch AI messages ordered chronologically
    const { data: messages, error: messagesError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  chatWithAI,
  getAIHistory
};
