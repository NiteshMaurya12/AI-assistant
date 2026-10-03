import React, { useState } from 'react';
import { UserSettings } from '../../types';
import { Api } from '../../services/api';
import { SlidersHorizontal, Volume2, Download, Trash2, X, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onClearAllConversations: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearAllConversations,
}) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await Api.updateSettings(formData);
      onUpdateSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const testVoice = async () => {
    if (isPlayingTestVoice) return;
    setIsPlayingTestVoice(true);
    try {
      const res = await Api.synthesizeTTS(
        `Hello! I am your Aether AI assistant speaking in ${formData.voiceName} voice. How can I assist you today?`,
        formData.voiceName
      );
      if (res.audioUrl) {
        const audio = new Audio(res.audioUrl);
        audio.onended = () => setIsPlayingTestVoice(false);
        audio.onerror = () => setIsPlayingTestVoice(false);
        audio.play().catch(() => setIsPlayingTestVoice(false));
      } else {
        setIsPlayingTestVoice(false);
      }
    } catch {
      setIsPlayingTestVoice(false);
    }
  };

  const handleExport = () => {
    window.open('/api/settings/export', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-800 text-neutral-300 border border-neutral-700">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Settings &amp; Personalization</h2>
              <p className="text-xs text-neutral-400">
                Configure AI personas, voice synthesis, languages, and workspace preferences
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

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* User Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Your Name</label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Persona Style */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              AI Persona &amp; Response Style
            </label>
            <select
              value={formData.persona}
              onChange={(e) => setFormData({ ...formData, persona: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="helpful">Helpful &amp; Articulate (Balanced)</option>
              <option value="expert">Senior Expert (Rigorous, deep, technical)</option>
              <option value="concise">Concise &amp; Crisp (Direct, minimal fluff)</option>
              <option value="creative">Creative &amp; Engaging (Storytelling, evocative)</option>
              <option value="technical">Engineering &amp; Code Architect (Deep precision)</option>
            </select>
          </div>

          {/* Voice Model & Test */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-neutral-300">
                Voice Model Persona (Gemini 3.8 TTS)
              </label>
              <button
                type="button"
                onClick={testVoice}
                disabled={isPlayingTestVoice}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isPlayingTestVoice ? 'Playing sample...' : 'Test Voice'}</span>
              </button>
            </div>
            <select
              value={formData.voiceName}
              onChange={(e) => setFormData({ ...formData, voiceName: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="Kore">Kore - Balanced, warm, and articulate</option>
              <option value="Puck">Puck - Upbeat, youthful, and expressive</option>
              <option value="Fenrir">Fenrir - Resonant, calm, and baritone</option>
              <option value="Zephyr">Zephyr - Natural, gentle, and conversational</option>
              <option value="Charon">Charon - Authoritative, deep, and measured</option>
            </select>
          </div>

          {/* Primary Language */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Primary Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
              <option value="German">German (Deutsch)</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Hinglish (Hindi in Latin script)</option>
              <option value="Japanese">Japanese (日本語)</option>
              <option value="Chinese">Chinese (Mandarin)</option>
              <option value="Arabic">Arabic (العربية)</option>
            </select>
          </div>

          {/* Web Search Grounding Auto */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div>
              <div className="text-xs font-semibold text-neutral-200">Auto Live Web Grounding</div>
              <div className="text-[11px] text-neutral-500">
                Automatically retrieve Google Search sources for current events &amp; facts
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.autoWebSearch}
              onChange={(e) => setFormData({ ...formData, autoWebSearch: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Custom Directives */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Custom Directives &amp; Instructions
            </label>
            <textarea
              rows={2}
              value={formData.customInstructions}
              onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
              placeholder="e.g. Always structure complex answers with bullet points and code examples."
              className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>

          {/* Data Management Actions */}
          <div className="pt-3 border-t border-neutral-800 space-y-2">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Workspace Data Management
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium transition"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export Full Backup JSON</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all conversation histories?')) {
                    onClearAllConversations();
                  }
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 text-xs text-red-300 font-medium transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Chats</span>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
