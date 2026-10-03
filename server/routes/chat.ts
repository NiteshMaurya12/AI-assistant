import { Router } from 'express';
import { orchestrateUserQuery } from '../orchestrator';
import { Storage, Conversation, Message } from '../storage';
import { ai } from '../ai';

export const chatRouter = Router();

// Main conversational AI route
chatRouter.post('/', async (req, res) => {
  try {
    const {
      prompt,
      conversationId,
      forceTool,
      images = [],
      docContext,
      speakResponse = false,
      files = [],
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get or initialize conversation
    let conv: Conversation | undefined;
    let activeId = conversationId;

    if (activeId) {
      conv = Storage.getConversation(activeId);
    }

    if (!conv) {
      activeId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      conv = {
        id: activeId,
        title: prompt.slice(0, 40).replace(/[\n\r]/g, ' ') || 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
    }

    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
      images: images.length ? images : undefined,
      files: files.length ? files : undefined,
    };
    conv.messages.push(userMsg);

    // Call orchestrator
    const result = await orchestrateUserQuery({
      prompt,
      history: conv.messages.slice(-8),
      forceTool,
      images,
      docContext,
    });

    let audioUrl: string | undefined;

    // If voice playback is requested, synthesize TTS via gemini-3.8-flash-lite-tts
    if (speakResponse && result.content) {
      try {
        const cleanSpeakText = result.content
          .replace(/```[\s\S]*?```/g, ' [code block] ')
          .replace(/[#*_`]/g, '')
          .slice(0, 600)
          .trim();

        if (cleanSpeakText) {
          const settings = Storage.getSettings();
          const ttsResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [
              {
                role: 'user',
                parts: [{ text: cleanSpeakText }],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: settings.voiceName || 'Kore' },
                },
              },
            },
          });
          const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            audioUrl = `data:audio/wav;base64,${base64Audio}`;
          }
        }
      } catch (ttsErr) {
        console.warn('Optional TTS generation skipped:', ttsErr);
      }
    }

    // Add assistant message
    const assistantMsg: Message = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: result.content,
      timestamp: Date.now(),
      toolUsed: result.toolUsed,
      sources: result.sources,
      codeSnippet: result.codeSnippet,
      audioUrl: audioUrl || result.audioUrl,
    };

    conv.messages.push(assistantMsg);
    conv.updatedAt = Date.now();

    // Auto title update if it's the first message and still default
    if (conv.messages.length === 2 && conv.title === 'New Conversation') {
      conv.title = prompt.slice(0, 36).trim();
    }

    Storage.saveConversation(conv);

    return res.json({
      conversationId: conv.id,
      message: assistantMsg,
      toolUsed: result.toolUsed,
      sources: result.sources,
      createdTask: result.createdTask,
      createdMemory: result.createdMemory,
      calculationResult: result.calculationResult,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Internal chat orchestration error' });
  }
});

// Conversation management routes
chatRouter.get('/conversations', (_req, res) => {
  res.json(Storage.getAllConversations());
});

chatRouter.get('/conversations/:id', (req, res) => {
  const conv = Storage.getConversation(req.params.id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json(conv);
});

chatRouter.put('/conversations/:id', (req, res) => {
  const conv = Storage.getConversation(req.params.id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  const { title, pinned } = req.body;
  if (title !== undefined) conv.title = title;
  if (pinned !== undefined) conv.pinned = pinned;
  conv.updatedAt = Date.now();
  Storage.saveConversation(conv);
  res.json(conv);
});

chatRouter.delete('/conversations/:id', (req, res) => {
  const deleted = Storage.deleteConversation(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json({ success: true });
});

chatRouter.delete('/conversations', (_req, res) => {
  const all = Storage.getAllConversations();
  for (const c of all) {
    Storage.deleteConversation(c.id);
  }
  res.json({ success: true, count: all.length });
});
