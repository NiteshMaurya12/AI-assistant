import { Router } from 'express';
import { ai } from '../ai';
import { Storage, DocumentChunk } from '../storage';

export const documentRouter = Router();

// Chunk text into overlapping passages
function chunkDocumentText(text: string, chunkSize = 1200, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    if (end === text.length) break;
    i += chunkSize - overlap;
  }
  return chunks.length ? chunks : [text];
}

// Retrieve top relevant chunks for a question
function retrieveTopChunks(query: string, chunks: DocumentChunk[], topK = 4): DocumentChunk[] {
  const queryTerms = query.toLowerCase().split(/\W+/).filter(Boolean);
  if (!queryTerms.length) return chunks.slice(0, topK);

  const scored = chunks.map((chunk) => {
    const textLower = chunk.text.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (textLower.includes(term)) {
        score += 1;
        // Count occurrences
        const matches = (textLower.match(new RegExp(term, 'g')) || []).length;
        score += Math.min(matches * 0.2, 2);
      }
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.chunk);
}

// Upload & ingest document
documentRouter.post('/upload', (req, res) => {
  try {
    const { name, type, content, size } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'Document name and content are required' });
    }

    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const rawChunks = chunkDocumentText(content);
    const docChunks: DocumentChunk[] = rawChunks.map((text, index) => ({
      id: `${docId}-chunk-${index}`,
      docId,
      docName: name,
      text,
      index,
    }));

    Storage.addDocument(docId, name, type || 'text/plain', size || content.length, docChunks);

    return res.json({
      success: true,
      document: {
        id: docId,
        name,
        type: type || 'text/plain',
        size: size || content.length,
        chunkCount: docChunks.length,
      },
    });
  } catch (err: any) {
    console.error('Doc upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to ingest document' });
  }
});

// List all ingested documents
documentRouter.get('/list', (_req, res) => {
  res.json(Storage.getDocuments());
});

// Delete document
documentRouter.delete('/:id', (req, res) => {
  const deleted = Storage.deleteDocument(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Document not found' });
  res.json({ success: true });
});

// Query documents (RAG Q&A)
documentRouter.post('/query', async (req, res) => {
  try {
    const { query, docId } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    let allChunks = Storage.getAllDocumentChunks();
    if (docId) {
      allChunks = allChunks.filter((c) => c.docId === docId);
    }

    if (allChunks.length === 0) {
      return res.status(400).json({ error: 'No documents currently available in knowledge base.' });
    }

    const relevant = retrieveTopChunks(query, allChunks, 5);
    const context = relevant.map((c) => `--- [Document: ${c.docName} (Section ${c.index + 1})] ---\n${c.text}`).join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an expert Document Intelligence and RAG assistant.
Answer the user's question accurately using ONLY the provided document context below. If the answer is not mentioned in the document, state clearly that it is not covered.

CONTEXT:
${context}

QUESTION:
${query}`,
    });

    return res.json({
      answer: response.text || 'No answer generated.',
      usedChunks: relevant.map((c) => ({
        docName: c.docName,
        index: c.index,
        preview: c.text.slice(0, 140) + '...',
      })),
    });
  } catch (err: any) {
    console.error('Doc query error:', err);
    res.status(500).json({ error: err.message || 'Failed to query document' });
  }
});

// Auto-summarize document
documentRouter.post('/summarize', async (req, res) => {
  try {
    const { docId } = req.body;
    const docs = Storage.getDocuments();
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const fullText = doc.chunks.map((c) => c.text).join('\n\n').slice(0, 20000);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Provide an executive summary of this document: "${doc.name}".
Include:
1. Core Topic & Purpose
2. Key Findings & Bullet Points
3. Actionable Takeaways or Data Highlights

DOCUMENT TEXT:
${fullText}`,
    });

    return res.json({ summary: response.text || '' });
  } catch (err: any) {
    console.error('Doc summarize error:', err);
    res.status(500).json({ error: err.message || 'Failed to summarize document' });
  }
});
