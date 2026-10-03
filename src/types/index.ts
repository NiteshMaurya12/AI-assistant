export interface SourceReference {
  title: string;
  url: string;
  snippet?: string;
}

export interface CodeSnippet {
  language: string;
  code: string;
}

export interface MessageFile {
  name: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolUsed?: string;
  sources?: SourceReference[];
  codeSnippet?: CodeSnippet;
  audioUrl?: string;
  images?: string[];
  files?: MessageFile[];
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

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  size: number;
  chunks: Array<{ id: string; docId: string; docName: string; text: string; index: number }>;
  uploadedAt: number;
}

export type AssistantToolMode =
  | 'auto'
  | 'search'
  | 'code'
  | 'document'
  | 'image'
  | 'calculator'
  | 'voice'
  | 'translate';
