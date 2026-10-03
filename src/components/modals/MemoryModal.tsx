import React, { useState, useEffect } from 'react';
import { MemoryItem } from '../../types';
import { Api } from '../../services/api';
import { Brain, Plus, Trash2, X, Check, ToggleLeft, ToggleRight, Info } from 'lucide-react';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryUpdated: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  onMemoryUpdated,
}) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('preference');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const data = await Api.getMemories();
      setMemories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      await Api.addMemory(newCategory, newContent.trim());
      setNewContent('');
      await loadMemories();
      onMemoryUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await Api.toggleMemory(id);
      setMemories((prev) =>
        prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
      );
      onMemoryUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await Api.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
      onMemoryUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const filteredMemories = memories.filter((m) =>
    activeFilter === 'all' ? true : m.category === activeFilter
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">AI Long-Term Memory</h2>
              <p className="text-xs text-neutral-400">
                User context &amp; preferences automatically injected into future conversations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Info Banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs text-neutral-400 leading-relaxed">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Aether remembers relevant facts, preferences, and objectives when you say{' '}
              <span className="text-neutral-200 italic font-mono">"Remember that..."</span> in chat, or
              you can manually add, edit, or disable them below.
            </span>
          </div>

          {/* Add New Memory Form */}
          <form onSubmit={handleAdd} className="space-y-3 p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div className="text-xs font-semibold text-neutral-300">Add New Memory Entry</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 focus:outline-none"
              >
                <option value="preference">Preference</option>
                <option value="goal">Goal / Objective</option>
                <option value="context">Ongoing Context</option>
                <option value="fact">Personal Fact</option>
              </select>
              <input
                type="text"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="e.g. Always write code with TypeScript strict types..."
                className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!newContent.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </form>

          {/* Filter Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-xs">
              {['all', 'preference', 'goal', 'context', 'fact'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize transition ${
                    activeFilter === cat
                      ? 'bg-neutral-800 text-white font-medium'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span className="text-xs text-neutral-500">
              {filteredMemories.length} {filteredMemories.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Memory List */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-6 text-xs text-neutral-500">Loading memories...</div>
            ) : filteredMemories.length === 0 ? (
              <div className="text-center py-8 text-xs text-neutral-500 italic">
                No memories found in this category.
              </div>
            ) : (
              filteredMemories.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start justify-between p-3 rounded-xl border transition ${
                    m.enabled
                      ? 'bg-neutral-900/90 border-neutral-800'
                      : 'bg-neutral-950/40 border-neutral-900 opacity-60'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                        {m.category}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed">{m.content}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <button
                      onClick={() => handleToggle(m.id)}
                      title={m.enabled ? 'Disable memory' : 'Enable memory'}
                      className="p-1 text-neutral-400 hover:text-neutral-200"
                    >
                      {m.enabled ? (
                        <ToggleRight className="w-5 h-5 text-indigo-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-neutral-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      title="Delete memory"
                      className="p-1 text-neutral-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
