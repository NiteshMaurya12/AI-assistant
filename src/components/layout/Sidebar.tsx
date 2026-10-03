import React, { useState } from 'react';
import { Conversation, UserSettings } from '../../types';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Brain,
  CheckSquare,
  FileText,
  Sparkles,
  Calculator,
  SlidersHorizontal,
  ChevronLeft,
  Edit2,
  Check,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onUpdateConversation: (id: string, updates: { title?: string; pinned?: boolean }) => void;
  onOpenModal: (modal: 'memory' | 'tasks' | 'document' | 'image' | 'calculator' | 'settings') => void;
  settings: UserSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onUpdateConversation,
  onOpenModal,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedList = filtered.filter((c) => c.pinned);
  const recentList = filtered.filter((c) => !c.pinned);

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onUpdateConversation(id, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const togglePin = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateConversation(conv.id, { pinned: !conv.pinned });
  };

  const deleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 bg-neutral-950 border-r border-neutral-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-4 border-b border-neutral-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-white block">Aether AI</span>
                <span className="text-[10px] text-neutral-400 block -mt-0.5">Unified AI Workspace</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-white lg:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs border border-neutral-800 hover:border-neutral-700 transition shadow-sm group"
          >
            <Plus className="w-4 h-4 text-indigo-400 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Conversation</span>
          </button>

          {/* Search Box */}
          <div className="relative mt-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800/60 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
            />
          </div>
        </div>

        {/* Conversation List Scrollable */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Pinned section */}
          {pinnedList.length > 0 && (
            <div>
              <div className="px-2 mb-1.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                <Pin className="w-3 h-3 text-indigo-400" />
                <span>Pinned</span>
              </div>
              <div className="space-y-0.5">
                {pinnedList.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    active={activeConversationId === conv.id}
                    isEditing={editingId === conv.id}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onSelect={() => {
                      onSelectConversation(conv.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    onRename={(e) => startRename(conv, e)}
                    onSaveRename={(e) => saveRename(conv.id, e)}
                    onCancelRename={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                    onTogglePin={(e) => togglePin(conv, e)}
                    onDelete={(e) => deleteConv(conv.id, e)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent list */}
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Recent Conversations
            </div>
            {recentList.length === 0 && pinnedList.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-neutral-500 italic">
                No conversations found
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentList.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    active={activeConversationId === conv.id}
                    isEditing={editingId === conv.id}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onSelect={() => {
                      onSelectConversation(conv.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    onRename={(e) => startRename(conv, e)}
                    onSaveRename={(e) => saveRename(conv.id, e)}
                    onCancelRename={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                    onTogglePin={(e) => togglePin(conv, e)}
                    onDelete={(e) => deleteConv(conv.id, e)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tool Hub Navigation Links */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/60 space-y-1">
          <div className="px-2 mb-1 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
            AI Tool Hub
          </div>

          <button
            onClick={() => onOpenModal('tasks')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 transition"
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Tasks &amp; Reminders</span>
            </div>
            <span className="text-[10px] text-neutral-500">Scheduled</span>
          </button>

          <button
            onClick={() => onOpenModal('memory')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 transition"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Long-Term Memory</span>
            </div>
            <span className="text-[10px] text-neutral-500">Persistent</span>
          </button>

          <button
            onClick={() => onOpenModal('document')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 transition"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>Document Intelligence</span>
            </div>
            <span className="text-[10px] text-neutral-500">RAG</span>
          </button>

          <button
            onClick={() => onOpenModal('image')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Image Creation Studio</span>
            </div>
            <span className="text-[10px] text-neutral-500">Generative</span>
          </button>

          <button
            onClick={() => onOpenModal('calculator')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 transition"
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-blue-400" />
              <span>Math &amp; Statistics Engine</span>
            </div>
            <span className="text-[10px] text-neutral-500">Deterministic</span>
          </button>
        </div>

        {/* User Profile & Settings Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {settings.userName[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-neutral-200 block truncate">{settings.userName}</span>
              <span className="text-[10px] text-neutral-400 block capitalize">{settings.persona} persona</span>
            </div>
          </div>

          <button
            onClick={() => onOpenModal('settings')}
            title="Settings"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};

interface ItemProps {
  conv: Conversation;
  active: boolean;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (t: string) => void;
  onSelect: () => void;
  onRename: (e: React.MouseEvent) => void;
  onSaveRename: (e: React.MouseEvent) => void;
  onCancelRename: (e: React.MouseEvent) => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const ConversationItem: React.FC<ItemProps> = ({
  conv,
  active,
  isEditing,
  editTitle,
  setEditTitle,
  onSelect,
  onRename,
  onSaveRename,
  onCancelRename,
  onTogglePin,
  onDelete,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition ${
        active
          ? 'bg-neutral-900 text-white font-medium shadow-sm'
          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-indigo-400' : 'text-neutral-500'}`} />
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveRename(e as any);
              if (e.key === 'Escape') onCancelRename(e as any);
            }}
            autoFocus
            className="w-full bg-neutral-950 text-white px-1.5 py-0.5 rounded border border-neutral-700 text-xs focus:outline-none"
          />
        ) : (
          <span className="truncate">{conv.title}</span>
        )}
      </div>

      {/* Action Buttons on Hover or Edit */}
      {isEditing ? (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onSaveRename} className="p-0.5 text-emerald-400 hover:text-emerald-300">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={onCancelRename} className="p-0.5 text-neutral-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
          <button
            onClick={onTogglePin}
            title={conv.pinned ? 'Unpin' : 'Pin conversation'}
            className={`p-0.5 hover:text-white transition ${conv.pinned ? 'text-indigo-400' : 'text-neutral-500'}`}
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            onClick={onRename}
            title="Rename"
            className="p-0.5 text-neutral-500 hover:text-white transition"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            title="Delete conversation"
            className="p-0.5 text-neutral-500 hover:text-red-400 transition"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
