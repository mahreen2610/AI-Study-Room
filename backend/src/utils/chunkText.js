/**
 * Chunks a string of text into segments of approximate word size with overlap.
 * @param {string} text - The input text to chunk.
 * @param {number} chunkSize - Number of words per chunk (default 500).
 * @param {number} chunkOverlap - Number of overlapping words between consecutive chunks (default 50).
 * @returns {string[]} An array of text chunks.
 */
function chunkText(text, chunkSize = 500, chunkOverlap = 50) {
  if (!text || typeof text !== 'string') return [];

  // Normalize whitespace
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const words = cleanText.split(' ');

  if (words.length <= chunkSize) {
    return [cleanText];
  }

  const chunks = [];
  let index = 0;

  while (index < words.length) {
    const start = Math.max(0, index);
    const end = Math.min(words.length, start + chunkSize);
    
    const chunkWords = words.slice(start, end);
    chunks.push(chunkWords.join(' '));

    // If we've reached the end of the text, we are done
    if (end >= words.length) {
      break;
    }

    // Move index forward by chunk size minus overlap
    index += (chunkSize - chunkOverlap);

    // Guard against infinite loop
    if (chunkSize <= chunkOverlap) {
      break;
    }
  }

  return chunks;
}

module.exports = chunkText;
