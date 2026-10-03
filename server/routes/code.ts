import { Router } from 'express';
import { ai } from '../ai';

export const codeRouter = Router();

codeRouter.post('/assist', async (req, res) => {
  try {
    const { action = 'generate', language = 'python', prompt, code } = req.body;
    if (!prompt && !code) {
      return res.status(400).json({ error: 'Prompt or code is required' });
    }

    let systemInstruction = `You are a Principal Software Engineer and Staff Architect.
Always write clean, idiomatic, typed, well-commented, and production-ready code.
Format your response with proper Markdown code blocks including language tags (e.g. \`\`\`${language}).
Include an explanation of:
- Time & Space complexity (if algorithmic)
- Architecture decisions
- Edge cases handled`;

    let userPrompt = '';
    if (action === 'generate') {
      userPrompt = `Generate a high quality implementation in ${language} for the following requirement:
${prompt}`;
    } else if (action === 'debug') {
      userPrompt = `Debug and fix the following ${language} code.
Code:
\`\`\`${language}
${code}
\`\`\`
Issue / Error details:
${prompt || 'Find all potential bugs, logical errors, edge case failures, and performance bottlenecks, and provide the corrected code.'}`;
    } else if (action === 'explain') {
      userPrompt = `Explain how this ${language} code works in clear, structured steps:
\`\`\`${language}
${code}
\`\`\``;
    } else if (action === 'optimize') {
      userPrompt = `Optimize and refactor this ${language} code for maximum performance, readability, and modern idioms:
\`\`\`${language}
${code}
\`\`\`
Goals: ${prompt || 'Improve runtime speed and memory efficiency.'}`;
    } else if (action === 'convert') {
      const { targetLanguage = 'typescript' } = req.body;
      userPrompt = `Convert this code from ${language} into idiomatic ${targetLanguage}:
\`\`\`${language}
${code}
\`\`\``;
    } else {
      userPrompt = `${prompt}\n\`\`\`${language}\n${code || ''}\n\`\`\``;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
      },
    });

    const text = response.text || '';
    const codeMatch = text.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/);

    return res.json({
      response: text,
      extractedCode: codeMatch ? codeMatch[2].trim() : undefined,
      extractedLanguage: codeMatch ? codeMatch[1] : language,
    });
  } catch (err: any) {
    console.error('Code assistant error:', err);
    res.status(500).json({ error: err.message || 'Code assistant operation failed' });
  }
});
