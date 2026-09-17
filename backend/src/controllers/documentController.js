const supabase = require('../services/supabaseService');
const pdfParse = require('pdf-parse');
const chunkText = require('../utils/chunkText');
const { getEmbedding } = require('../services/embeddingService');

/**
 * Handle document upload and kick off text extraction/embedding pipeline in background.
 */
async function uploadDocument(req, res, next) {
  const { roomId } = req.params;
  const userId = req.user.id;
  const file = req.file;

  console.log(`[Upload] Received document upload request for room: ${roomId}, user: ${userId}`);

  try {
    if (!file) {
      console.warn('[Upload] Upload failed: No file found in request');
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log(`[Upload] File details - Name: ${file.originalname}, Size: ${file.size} bytes, Mime: ${file.mimetype}`);

    if (file.mimetype !== 'application/pdf') {
      console.warn('[Upload] Upload failed: File is not a PDF');
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }

    // 1. Verify user is member of the room
    console.log('[Upload] Step 1: Checking room membership...');
    const { data: membership, error: membershipError } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError) {
      console.error('[Upload] Database membership check error:', membershipError);
      throw membershipError;
    }

    if (!membership) {
      console.warn(`[Upload] Access denied: User ${userId} is not a member of room ${roomId}`);
      return res.status(403).json({ error: 'You do not have access to this room' });
    }

    console.log('[Upload] Room membership verified. Role:', membership.role);

    // 2. Generate storage path
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `${roomId}/${Date.now()}_${cleanFileName}`;
    console.log(`[Upload] Target storage path: ${storagePath}`);

    // Create the document row in 'processing' status first
    console.log('[Upload] Step 2: Creating document row in database...');
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        room_id: roomId,
        uploaded_by: userId,
        name: file.originalname,
        storage_path: storagePath,
        status: 'processing'
      })
      .select()
      .single();

    if (docError) {
      console.error('[Upload] Database insert error for document row:', docError);
      throw docError;
    }

    // 3. Process the file (Upload, extract text, chunk, embed with Gemini)
    console.log(`[Upload] Step 3: Processing document ${document.id}...`);
    await processDocumentBackground(document.id, roomId, storagePath, file.buffer, file.mimetype);

    // Fetch updated document status
    const { data: updatedDoc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', document.id)
      .single();

    console.log(`[Upload] Document processing complete. Final status: ${updatedDoc ? updatedDoc.status : 'ready'}`);
    res.status(201).json(updatedDoc || document);
  } catch (error) {
    console.error('[Upload] Controller exception caught:', error);
    next(error);
  }
}

/**
 * Background processor for document ingestion.
 */
async function processDocumentBackground(docId, roomId, storagePath, buffer, mimetype) {
  console.log(`[BG-Process] [Doc ${docId}] Uploading file to Supabase Storage...`);
  try {
    // A. Upload file to Supabase Storage (bucket name: 'documents')
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: mimetype,
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
    }

    console.log(`[BG-Process] [Doc ${docId}] Upload complete. Parsing PDF text...`);

    // B. Extract text from PDF buffer using pdf-parse (handles both classic function and modern class versions)
    let text = '';
    try {
      console.log('[BG-Process] [Doc ' + docId + '] Checking pdf-parse library structure...');
      if (typeof pdfParse === 'function') {
        console.log('[BG-Process] [Doc ' + docId + '] Using classic pdf-parse function...');
        const parsedData = await pdfParse(buffer);
        text = parsedData.text;
      } else if (pdfParse && typeof pdfParse.PDFParse === 'function') {
        console.log('[BG-Process] [Doc ' + docId + '] Using modern class-based PDFParse...');
        const parser = new pdfParse.PDFParse({ data: buffer });
        const parsedData = await parser.getText();
        text = parsedData.text;
      } else {
        throw new Error('Unsupported pdf-parse library export structure (neither a function nor contains PDFParse constructor)');
      }
    } catch (parseErr) {
      throw new Error(`PDF parsing failed: ${parseErr.message}`);
    }

    console.log(`[BG-Process] [Doc ${docId}] Text parsed successfully. Extracted length: ${text ? text.length : 0} characters.`);

    if (!text || text.trim().length === 0) {
      throw new Error('PDF contains no readable text');
    }

    // C. Chunk text into segments (~500 words with ~50 words overlap)
    console.log(`[BG-Process] [Doc ${docId}] Chunking text...`);
    const chunks = chunkText(text, 500, 50);
    console.log(`[BG-Process] [Doc ${docId}] Text chunked into ${chunks.length} segments.`);
    if (chunks.length === 0) {
      throw new Error('Text could not be chunked');
    }

    // D. Generate embeddings and prepare chunks
    console.log(`[BG-Process] [Doc ${docId}] Requesting embeddings from Gemini...`);
    const chunksToInsert = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[BG-Process] [Doc ${docId}] Embedding chunk ${i + 1}/${chunks.length}...`);
      const embedding = await getEmbedding(chunk);

      chunksToInsert.push({
        document_id: docId,
        room_id: roomId,
        content: chunk,
        embedding: embedding,
        chunk_index: i
      });
    }

    console.log(`[BG-Process] [Doc ${docId}] Embeddings generated. Saving ${chunksToInsert.length} chunks to database...`);

    // E. Save chunks to database
    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert(chunksToInsert);

    if (insertError) {
      throw new Error(`Failed to save chunks: ${insertError.message}`);
    }

    console.log(`[BG-Process] [Doc ${docId}] Chunks saved. Setting status to 'ready'...`);

    // F. Update document status to 'ready'
    const { error: updateError } = await supabase
      .from('documents')
      .update({ status: 'ready' })
      .eq('id', docId);

    if (updateError) {
      throw updateError;
    }

    console.log(`[BG-Process] [Doc ${docId}] SUCCESS! Document fully indexed.`);

  } catch (error) {
    console.error(`[BG-Process] [Doc ${docId}] FAILED:`, error.message);

    // Update document status to 'failed'
    try {
      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', docId);
      console.log(`[BG-Process] [Doc ${docId}] Updated status to 'failed'.`);
    } catch (dbErr) {
      console.error(`[BG-Process] [Doc ${docId}] Failed to update status to failed:`, dbErr);
    }
  }
}

/**
 * List all documents in a room.
 */
async function listDocuments(req, res, next) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    console.log(`[Documents] Fetching documents list for room ${roomId}, requested by user ${userId}`);

    // Verify user is member of the room
    const { data: membership, error: membershipError } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError) {
      console.error('[Documents] Membership verification database error:', membershipError);
      throw membershipError;
    }

    if (!membership) {
      console.warn(`[Documents] Access denied: User ${userId} is not a member of room ${roomId}`);
      return res.status(403).json({ error: 'You do not have access to this room' });
    }

    // Fetch documents joining with profiles to get the username
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select(`
        id,
        name,
        storage_path,
        status,
        created_at,
        uploaded_by,
        profiles (
          username
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error('[Documents] Database error while fetching documents:', docsError);
      throw docsError;
    }

    // Format profiles
    const formattedDocs = documents.map(d => ({
      id: d.id,
      name: d.name,
      storage_path: d.storage_path,
      status: d.status,
      created_at: d.created_at,
      uploaded_by: d.uploaded_by,
      uploaded_by_username: d.profiles ? d.profiles.username : 'Unknown'
    }));

    console.log(`[Documents] Successfully retrieved ${formattedDocs.length} documents for room ${roomId}`);
    res.status(200).json(formattedDocs);
  } catch (error) {
    console.error('[Documents] Exception in listDocuments:', error);
    next(error);
  }
}

module.exports = {
  uploadDocument,
  listDocuments
};

