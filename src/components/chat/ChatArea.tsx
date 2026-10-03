import React, { useEffect, useRef } from 'react';
import { Message, AssistantToolMode } from '../../types';
import { MessageBubble } from './MessageBubble';
import {
  Sparkles,
  Globe,
  Code2,
  FileText,
  Calculator,
  Calendar,
  Layers,
} from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSelectPrompt: (prompt: string, mode?: AssistantToolMode) => void;
  onRegenerate: () => void;
  onSpeak: (text: string) => void;
  currentPlayingAudioId: string | null;
  onStopAudio: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  onSelectPrompt,
  onRegenerate,
  onSpeak,
  currentPlayingAudioId,
  onStopAudio,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickStarters = [
    {
      title: 'Current Web Research',
      desc: 'Latest breakthrough AI models and benchmarks',
      icon: <Globe className="w-4 h-4 text-blue-400" />,
      prompt: 'What are the latest breakthrough AI models and benchmarks released recently? Provide sources.',
      mode: 'search' as AssistantToolMode,
    },
    {
      title: 'Full-Stack Architecture',
      desc: 'Build a production-grade async service with tests',
      icon: <Code2 className="w-4 h-4 text-emerald-400" />,
      prompt: 'Design a clean Python service architecture with dependency injection, async I/O, and unit tests.',
      mode: 'code' as AssistantToolMode,
    },
    {
      title: 'Deterministic Math & Stats',
      desc: 'Calculate complex expressions and standard deviation',
      icon: <Calculator className="w-4 h-4 text-indigo-400" />,
      prompt: 'Calculate: sqrt(256) * 14.5 + (1200 / 3) and convert 150 km to miles.',
      mode: 'calculator' as AssistantToolMode,
    },
    {
      title: 'Task & Memory Extraction',
      desc: 'Organize reminders and preserve user context',
      icon: <Calendar className="w-4 h-4 text-amber-400" />,
      prompt: 'Remind me tomorrow at 9 AM to review the system integration tests and deployment pipeline.',
      mode: 'auto' as AssistantToolMode,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
      <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-between">
        {/* Empty State Welcome Hub */}
        {messages.length === 0 ? (
          <div className="my-auto py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-5">
              <Sparkles className="w-7 h-7 text-white" />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
              Aether Unified AI Assistant
            </h1>
            <p className="text-neutral-400 text-sm md:text-base max-w-lg mb-8 leading-relaxed">
              Your conversational intelligence system with grounded web search, document RAG,
              voice interaction, code intelligence, and automated task execution.
            </p>

            {/* Feature quick starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
              {quickStarters.map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectPrompt(starter.prompt, starter.mode)}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl bg-neutral-900/70 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 transition shadow-sm group"
                >
                  <div className="p-2 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 transition shrink-0">
                    {starter.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-neutral-200 group-hover:text-white transition">
                      {starter.title}
                    </div>
                    <div className="text-[12px] text-neutral-400 mt-0.5 line-clamp-1">
                      {starter.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Deterministic Tools</span>
              </span>
              <span>·</span>
              <span>Gemini 3.8 Intelligence</span>
              <span>·</span>
              <span>Real-time Voice TTS</span>
            </div>
          </div>
        ) : (
          /* Message List */
          <div className="flex flex-col">
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id || index}
                message={msg}
                onRegenerate={index === messages.length - 1 && msg.role === 'assistant' ? onRegenerate : undefined}
                onSpeak={onSpeak}
                isPlayingAudio={currentPlayingAudioId === msg.id}
                onStopAudio={onStopAudio}
              />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 my-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/90 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                  <Sparkles className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 rounded-tl-sm flex items-center gap-2 text-sm text-neutral-300">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-neutral-400 ml-1">Orchestrating AI capabilities...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
