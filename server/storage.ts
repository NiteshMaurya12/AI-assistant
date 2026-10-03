import fs from 'fs';
import path from 'path';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolUsed?: string;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  codeSnippet?: { language: string; code: string };
  audioUrl?: string;
  images?: string[];
  files?: Array<{ name: string; type: string; size: number }>;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  messages: Message[];
}

export interface MemoryItem {
  id: string;
  category: 'preference' | 'context' | 'goal' | 'fact';
  content: string;
  createdAt: number;
  enabled: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: number;
}

export interface UserSettings {
  userName: string;
  persona: 'helpful' | 'expert' | 'concise' | 'creative' | 'technical';
  language: string;
  voiceName: 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';
  autoWebSearch: boolean;
  codeExecutionAuto: boolean;
  speechRate: number;
  customInstructions: string;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  docName: string;
  text: string;
  index: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const STORAGE_FILE = path.join(DATA_DIR, 'assistant_store.json');

interface AppData {
  conversations: Record<string, Conversation>;
  memories: MemoryItem[];
  tasks: TaskItem[];
  settings: UserSettings;
  documents: Record<string, { id: string; name: string; type: string; size: number; chunks: DocumentChunk[]; uploadedAt: number }>;
}

const defaultSettings: UserSettings = {
  userName: 'Nitesh',
  persona: 'helpful',
  language: 'English',
  voiceName: 'Kore',
  autoWebSearch: true,
  codeExecutionAuto: true,
  speechRate: 1.0,
  customInstructions: 'Be insightful, precise, structured with markdown, and use tool capabilities whenever helpful.',
};

const initialMemories: MemoryItem[] = [
  {
    id: 'mem-1',
    category: 'preference',
    content: 'Prefers modern clean code architectures with clear separation of concerns.',
    createdAt: Date.now() - 86400000,
    enabled: true,
  },
  {
    id: 'mem-2',
    category: 'goal',
    content: 'Building an all-in-one personal AI assistant and productivity workspace.',
    createdAt: Date.now() - 43200000,
    enabled: true,
  },
];

const initialTasks: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Review system architecture and test voice conversation',
    priority: 'high',
    completed: false,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    createdAt: Date.now(),
  },
  {
    id: 'task-2',
    title: 'Analyze project documents with RAG pipeline',
    priority: 'medium',
    completed: false,
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    createdAt: Date.now(),
  },
];

let appData: AppData = {
  conversations: {},
  memories: initialMemories,
  tasks: initialTasks,
  settings: defaultSettings,
  documents: {},
};

// Load data safely
try {
  if (fs.existsSync(STORAGE_FILE)) {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    appData = {
      conversations: parsed.conversations || {},
      memories: parsed.memories?.length ? parsed.memories : initialMemories,
      tasks: parsed.tasks?.length ? parsed.tasks : initialTasks,
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      documents: parsed.documents || {},
    };
  }
} catch (e) {
  console.warn('Could not read existing storage file, using in-memory baseline', e);
}

export function saveStorage() {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(appData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write to storage file', err);
  }
}

export const Storage = {
  // Conversations
  getAllConversations(): Conversation[] {
    return Object.values(appData.conversations).sort((a, b) => b.updatedAt - a.updatedAt);
  },
  getConversation(id: string): Conversation | undefined {
    return appData.conversations[id];
  },
  saveConversation(conv: Conversation): void {
    appData.conversations[conv.id] = conv;
    saveStorage();
  },
  deleteConversation(id: string): boolean {
    if (appData.conversations[id]) {
      delete appData.conversations[id];
      saveStorage();
      return true;
    }
    return false;
  },

  // Memories
  getMemories(): MemoryItem[] {
    return appData.memories;
  },
  getActiveMemories(): string[] {
    return appData.memories.filter((m) => m.enabled).map((m) => `[${m.category.toUpperCase()}] ${m.content}`);
  },
  addMemory(category: MemoryItem['category'], content: string): MemoryItem {
    const item: MemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category,
      content,
      createdAt: Date.now(),
      enabled: true,
    };
    appData.memories.unshift(item);
    saveStorage();
    return item;
  },
  toggleMemory(id: string): boolean {
    const item = appData.memories.find((m) => m.id === id);
    if (item) {
      item.enabled = !item.enabled;
      saveStorage();
      return true;
    }
    return false;
  },
  deleteMemory(id: string): boolean {
    const len = appData.memories.length;
    appData.memories = appData.memories.filter((m) => m.id !== id);
    if (appData.memories.length !== len) {
      saveStorage();
      return true;
    }
    return false;
  },

  // Tasks
  getTasks(): TaskItem[] {
    return appData.tasks.sort((a, b) => (a.completed === b.completed ? b.createdAt - a.createdAt : a.completed ? 1 : -1));
  },
  addTask(title: string, priority: 'low' | 'medium' | 'high' = 'medium', dueDate?: string, description?: string): TaskItem {
    const item: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      description,
      dueDate,
      priority,
      completed: false,
      createdAt: Date.now(),
    };
    appData.tasks.unshift(item);
    saveStorage();
    return item;
  },
  updateTask(id: string, updates: Partial<TaskItem>): TaskItem | null {
    const task = appData.tasks.find((t) => t.id === id);
    if (task) {
      Object.assign(task, updates);
      saveStorage();
      return task;
    }
    return null;
  },
  deleteTask(id: string): boolean {
    const len = appData.tasks.length;
    appData.tasks = appData.tasks.filter((t) => t.id !== id);
    if (appData.tasks.length !== len) {
      saveStorage();
      return true;
    }
    return false;
  },

  // Settings
  getSettings(): UserSettings {
    return appData.settings;
  },
  updateSettings(settings: Partial<UserSettings>): UserSettings {
    appData.settings = { ...appData.settings, ...settings };
    saveStorage();
    return appData.settings;
  },

  // Documents for RAG
  addDocument(id: string, name: string, type: string, size: number, chunks: DocumentChunk[]) {
    appData.documents[id] = { id, name, type, size, chunks, uploadedAt: Date.now() };
    saveStorage();
  },
  getDocuments() {
    return Object.values(appData.documents);
  },
  deleteDocument(id: string) {
    if (appData.documents[id]) {
      delete appData.documents[id];
      saveStorage();
      return true;
    }
    return false;
  },
  getAllDocumentChunks(): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    for (const doc of Object.values(appData.documents)) {
      chunks.push(...doc.chunks);
    }
    return chunks;
  },
};
