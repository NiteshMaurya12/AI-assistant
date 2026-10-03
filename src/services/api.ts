import { Conversation, Message, MemoryItem, TaskItem, UserSettings, DocumentItem } from '../types';

export const Api = {
  // Chat & AI Orchestration
  async sendMessage(params: {
    prompt: string;
    conversationId?: string;
    forceTool?: string;
    images?: string[];
    docContext?: string;
    speakResponse?: boolean;
    files?: Array<{ name: string; type: string; size: number }>;
  }): Promise<{
    conversationId: string;
    message: Message;
    toolUsed?: string;
    sources?: any[];
    createdTask?: TaskItem;
    createdMemory?: MemoryItem;
    calculationResult?: any;
  }> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to process message' }));
      throw new Error(err.error || 'Server error');
    }
    return res.json();
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch('/api/chat/conversations');
    if (!res.ok) throw new Error('Failed to load conversations');
    return res.json();
  },

  async getConversation(id: string): Promise<Conversation> {
    const res = await fetch(`/api/chat/conversations/${id}`);
    if (!res.ok) throw new Error('Conversation not found');
    return res.json();
  },

  async updateConversation(id: string, updates: { title?: string; pinned?: boolean }): Promise<Conversation> {
    const res = await fetch(`/api/chat/conversations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete conversation');
  },

  async clearAllConversations(): Promise<void> {
    const res = await fetch('/api/chat/conversations', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear conversations');
  },

  // Voice & TTS
  async synthesizeTTS(text: string, voiceName?: string): Promise<{ audioUrl: string; voice: string }> {
    const res = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName }),
    });
    if (!res.ok) throw new Error('Failed to synthesize speech');
    return res.json();
  },

  async transcribeAudio(audioData: string, mimeType?: string): Promise<{ text: string }> {
    const res = await fetch('/api/voice/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioData, mimeType }),
    });
    if (!res.ok) throw new Error('Transcription failed');
    return res.json();
  },

  // Web Search Grounding
  async searchWeb(query: string): Promise<{ answer: string; sources: any[]; searchQueries: string[] }> {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  // Documents & RAG
  async uploadDocument(data: { name: string; type: string; content: string; size?: number }): Promise<any> {
    const res = await fetch('/api/document/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Document ingestion failed');
    return res.json();
  },

  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch('/api/document/list');
    if (!res.ok) throw new Error('Failed to list documents');
    return res.json();
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`/api/document/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  async queryDocument(query: string, docId?: string): Promise<{ answer: string; usedChunks: any[] }> {
    const res = await fetch('/api/document/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, docId }),
    });
    if (!res.ok) throw new Error('Document Q&A query failed');
    return res.json();
  },

  async summarizeDocument(docId: string): Promise<{ summary: string }> {
    const res = await fetch('/api/document/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId }),
    });
    if (!res.ok) throw new Error('Failed to summarize document');
    return res.json();
  },

  // Code Assistant
  async codeAssist(params: {
    action: 'generate' | 'debug' | 'explain' | 'optimize' | 'convert';
    language: string;
    prompt?: string;
    code?: string;
    targetLanguage?: string;
  }): Promise<{ response: string; extractedCode?: string; extractedLanguage?: string }> {
    const res = await fetch('/api/code/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Code assistant failed');
    return res.json();
  },

  // Image Generation & Vision
  async generateImage(params: { prompt: string; aspectRatio?: string; style?: string }): Promise<{
    imageUrl: string;
    prompt: string;
    aspectRatio?: string;
  }> {
    const res = await fetch('/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Image generation failed');
    return res.json();
  },

  async analyzeImage(imageBase64: string, prompt?: string): Promise<{ analysis: string }> {
    const res = await fetch('/api/image/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, prompt }),
    });
    if (!res.ok) throw new Error('Image analysis failed');
    return res.json();
  },

  // Calculator
  async evaluateMath(expression: string): Promise<any> {
    const res = await fetch('/api/calculator/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression }),
    });
    if (!res.ok) throw new Error('Math evaluation failed');
    return res.json();
  },

  async calculateStats(numbers: number[]): Promise<any> {
    const res = await fetch('/api/calculator/statistics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numbers }),
    });
    if (!res.ok) throw new Error('Statistics calculation failed');
    return res.json();
  },

  // Memories
  async getMemories(): Promise<MemoryItem[]> {
    const res = await fetch('/api/memory');
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  },

  async addMemory(category: MemoryItem['category'], content: string): Promise<MemoryItem> {
    const res = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, content }),
    });
    if (!res.ok) throw new Error('Failed to save memory');
    return res.json();
  },

  async toggleMemory(id: string): Promise<void> {
    const res = await fetch(`/api/memory/${id}/toggle`, { method: 'PUT' });
    if (!res.ok) throw new Error('Failed to toggle memory');
  },

  async deleteMemory(id: string): Promise<void> {
    const res = await fetch(`/api/memory/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete memory');
  },

  // Tasks
  async getTasks(): Promise<TaskItem[]> {
    const res = await fetch('/api/tasks');
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async addTask(data: { title: string; priority?: string; dueDate?: string; description?: string }): Promise<TaskItem> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add task');
    return res.json();
  },

  async updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  // Settings
  async getSettings(): Promise<UserSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },
};
