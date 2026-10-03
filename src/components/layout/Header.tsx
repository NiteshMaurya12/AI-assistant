import React from 'react';
import { AssistantToolMode } from '../../types';
import {
  Menu,
  Radio,
  Brain,
  CheckSquare,
  FileText,
  SlidersHorizontal,
  Trash2,
  Share2,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeToolMode: AssistantToolMode;
  onSelectToolMode: (mode: AssistantToolMode) => void;
  onOpenVoiceModal: () => void;
  onOpenModal: (modal: 'memory' | 'tasks' | 'document' | 'image' | 'calculator' | 'settings') => void;
  onClearChat: () => void;
  taskCount?: number;
  memoryCount?: number;
  conversationTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  activeToolMode,
  onSelectToolMode,
  onOpenVoiceModal,
  onOpenModal,
  onClearChat,
  taskCount = 0,
  memoryCount = 0,
  conversationTitle = 'New Conversation',
}) => {
  const modes: Array<{ id: AssistantToolMode; label: string }> = [
    { id: 'auto', label: 'All-in-One' },
    { id: 'search', label: 'Web Search' },
    { id: 'code', label: 'Coding' },
    { id: 'document', label: 'Doc RAG' },
    { id: 'calculator', label: 'Calculator' },
    { id: 'image', label: 'Image Gen' },
  ];

  const handleExportChat = () => {
    window.open('/api/settings/export', '_blank');
  };

  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
      {/* Left: Sidebar Toggle & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm text-neutral-200 truncate max-w-[180px] sm:max-w-xs">
            {conversationTitle}
          </span>
          <span className="hidden sm:inline-block text-neutral-600">·</span>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Center: Mode Selector Tabs (Hidden on small mobile) */}
      <div className="hidden md:flex items-center gap-1 p-1 bg-neutral-900/90 rounded-xl border border-neutral-800">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelectToolMode(mode.id)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              activeToolMode === mode.id
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Right: Quick Tool Modal Triggers */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Voice OS Trigger */}
        <button
          onClick={onOpenVoiceModal}
          title="Launch Live Voice Assistant"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition"
        >
          <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="hidden sm:inline">Voice</span>
        </button>

        {/* Tasks Badge */}
        <button
          onClick={() => onOpenModal('tasks')}
          title="Tasks & Reminders"
          className="relative p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
        >
          <CheckSquare className="w-4 h-4" />
          {taskCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500/90 text-white text-[10px] font-bold flex items-center justify-center">
              {taskCount}
            </span>
          )}
        </button>

        {/* AI Memory Badge */}
        <button
          onClick={() => onOpenModal('memory')}
          title="AI Memory & Preferences"
          className="relative p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
        >
          <Brain className="w-4 h-4" />
          {memoryCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500/90 text-white text-[10px] font-bold flex items-center justify-center">
              {memoryCount}
            </span>
          )}
        </button>

        {/* Document Knowledge Base */}
        <button
          onClick={() => onOpenModal('document')}
          title="Document RAG Studio"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Export Backup */}
        <button
          onClick={handleExportChat}
          title="Export Workspace JSON Backup"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition hidden sm:block"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Clear Chat */}
        <button
          onClick={onClearChat}
          title="Clear current messages"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={() => onOpenModal('settings')}
          title="Settings & Personalization"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition ml-1"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
