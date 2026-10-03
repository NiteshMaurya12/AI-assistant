import { Router } from 'express';
import { ai } from '../ai';

export const searchRouter = Router();

searchRouter.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Search the web and provide a comprehensive, objective, and timely answer for: "${query}". Include relevant facts, stats, and dates.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || 'No information retrieved.';
    const candidate = response.candidates?.[0];
    const grounding = candidate?.groundingMetadata;

    const sources: Array<{ title: string; url: string }> = [];
    if (grounding?.groundingChunks) {
      for (const chunk of grounding.groundingChunks) {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || new URL(chunk.web.uri).hostname,
            url: chunk.web.uri,
          });
        }
      }
    }

    const queries = grounding?.webSearchQueries || [query];

    return res.json({
      answer: text,
      sources,
      searchQueries: queries,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message || 'Web search failed' });
  }
});
