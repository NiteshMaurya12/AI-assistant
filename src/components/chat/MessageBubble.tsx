import React, { useState } from 'react';
import { Message } from '../../types';
import { marked } from 'marked';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Globe,
  ExternalLink,
  Code2,
  Play,
  RotateCcw,
  Sparkles,
  User,
  FileText,
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  onSpeak?: (text: string) => void;
  isPlayingAudio?: boolean;
  onStopAudio?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRegenerate,
  onSpeak,
  isPlayingAudio = false,
  onStopAudio,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [codeOutput, setCodeOutput] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const runCodeInSandbox = (code: string, lang: string) => {
    if (['javascript', 'js', 'typescript', 'ts'].includes(lang.toLowerCase())) {
      try {
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => {
          logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
        };
        const func = new Function(code);
        const ret = func();
        console.log = originalLog;
        setCodeOutput(logs.length ? logs.join('\n') : ret !== undefined ? String(ret) : 'Execution complete (no output)');
      } catch (err: any) {
        setCodeOutput(`Execution Error: ${err.message}`);
      }
    } else {
      setCodeOutput(`Sandbox execution is simulated for ${lang}.\nReady for integration into your runtime environment.`);
    }
  };

  // Render markdown safely
  const renderMarkdown = (text: string) => {
    try {
      const rawHtml = marked.parse(text, { breaks: true, gfm: true }) as string;
      return { __html: rawHtml };
    } catch {
      return { __html: text };
    }
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`group flex gap-3.5 my-5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar Icon */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-sm font-semibold ${
          isUser
            ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
            : 'bg-indigo-600/90 text-white shadow-indigo-500/20'
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-neutral-300" /> : <Sparkles className="w-4 h-4 text-white" />}
      </div>

      {/* Message Content Container */}
      <div className={`max-w-[85%] md:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* User uploaded files & images preview */}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="Uploaded"
                className="max-h-48 max-w-xs object-cover rounded-xl border border-neutral-800 shadow-md"
              />
            ))}
          </div>
        )}

        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium truncate max-w-[140px]">{file.name}</span>
                <span className="text-neutral-500 text-[10px]">({Math.round(file.size / 1024)} KB)</span>
              </div>
            ))}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-3 shadow-md text-[14.5px] leading-relaxed ${
            isUser
              ? 'bg-neutral-800/90 text-neutral-100 border border-neutral-700/60 rounded-tr-sm'
              : 'bg-neutral-900/90 text-neutral-200 border border-neutral-800/80 rounded-tl-sm'
          }`}
        >
          {/* Tool banner if specialized tool was executed */}
          {!isUser && message.toolUsed && message.toolUsed !== 'chat' && (
            <div className="flex items-center gap-1.5 mb-2.5 text-xs text-indigo-300 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>
                {message.toolUsed === 'search' && 'Live Web Search Grounding'}
                {message.toolUsed === 'calculator' && 'Deterministic Math Engine'}
                {message.toolUsed === 'document' && 'Document RAG Retrieval'}
                {message.toolUsed === 'code' && 'Architectural Code Assistant'}
                {message.toolUsed === 'image' && 'Visual Intelligence Engine'}
                {message.toolUsed === 'tasks' && 'Task & Reminder Scheduled'}
                {message.toolUsed === 'memory' && 'Personal Memory Updated'}
              </span>
            </div>
          )}

          {/* Text Body */}
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div
              className="prose-dark max-w-none break-words"
              dangerouslySetInnerHTML={renderMarkdown(message.content)}
            />
          )}

          {/* Sources Grounding Card if present */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-neutral-800/80">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 mb-2">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Verified Sources &amp; Grounding</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/60 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white transition group/link"
                  >
                    <span className="truncate pr-2 font-medium">{src.title}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-500 group-hover/link:text-indigo-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Code Runner if code snippet was extracted */}
          {message.codeSnippet && (
            <div className="mt-3.5 pt-3 border-t border-neutral-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sandbox Runner ({message.codeSnippet.language})</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(message.codeSnippet!.code)}
                    className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                  >
                    {codeCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{codeCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => runCodeInSandbox(message.codeSnippet!.code, message.codeSnippet!.language)}
                    className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 text-xs font-medium flex items-center gap-1 border border-emerald-500/30 transition"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run</span>
                  </button>
                </div>
              </div>
              {codeOutput && (
                <div className="mt-2 p-2.5 rounded-lg bg-neutral-950 font-mono text-xs text-neutral-300 border border-neutral-800 whitespace-pre-wrap">
                  {codeOutput}
                </div>
              )}
            </div>
          )}

          {/* Audio waveform / playback indicator if audio playing for this message */}
          {isPlayingAudio && (
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300">
              <div className="flex items-center gap-1 h-4">
                <span className="soundwave-bar w-1 bg-indigo-400 rounded-full" />
                <span className="soundwave-bar w-1 bg-indigo-400 rounded-full" />
                <span className="soundwave-bar w-1 bg-indigo-400 rounded-full" />
                <span className="soundwave-bar w-1 bg-indigo-400 rounded-full" />
                <span className="soundwave-bar w-1 bg-indigo-400 rounded-full" />
              </div>
              <span>Speaking response...</span>
              <button
                onClick={onStopAudio}
                className="ml-auto text-indigo-300 hover:text-indigo-100 flex items-center gap-1 text-[11px]"
              >
                <VolumeX className="w-3.5 h-3.5" /> Stop
              </button>
            </div>
          )}
        </div>

        {/* Message Meta & Actions Toolbar */}
        <div className={`flex items-center gap-2 mt-1.5 px-1 text-[11px] text-neutral-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span>{formattedTime}</span>

          {!isUser && (
            <>
              <button
                onClick={handleCopy}
                title="Copy response"
                className="hover:text-neutral-300 transition p-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>

              {onSpeak && (
                <button
                  onClick={() => (isPlayingAudio && onStopAudio ? onStopAudio() : onSpeak(message.content))}
                  title={isPlayingAudio ? 'Stop speaking' : 'Read aloud with AI voice'}
                  className="hover:text-neutral-300 transition p-1"
                >
                  {isPlayingAudio ? <VolumeX className="w-3 h-3 text-indigo-400" /> : <Volume2 className="w-3 h-3" />}
                </button>
              )}

              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  title="Regenerate response"
                  className="hover:text-neutral-300 transition p-1"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
