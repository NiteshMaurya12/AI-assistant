import React, { useRef, useState, useEffect } from 'react';
import { AssistantToolMode } from '../../types';
import {
  Send,
  Square,
  Mic,
  MicOff,
  Paperclip,
  Image as ImageIcon,
  X,
  Compass,
  Code2,
  FileText,
  Calculator,
  Languages,
  Sparkles,
  Globe,
  Radio,
} from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (params: {
    prompt: string;
    forceTool?: AssistantToolMode;
    images?: string[];
    files?: Array<{ name: string; type: string; size: number; content?: string }>;
  }) => void;
  isLoading: boolean;
  onStop?: () => void;
  onOpenVoiceModal: () => void;
  currentToolMode: AssistantToolMode;
  onSelectToolMode: (mode: AssistantToolMode) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  isLoading,
  onStop,
  onOpenVoiceModal,
  currentToolMode,
  onSelectToolMode,
}) => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<Array<{ name: string; type: string; size: number; content?: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [toolMenuOpen, setToolMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Initialize browser speech recognition for mic input
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  const toggleMic = () => {
    if (!speechRecognitionRef.current) {
      // Fallback: Open immersive voice mode directly
      onOpenVoiceModal();
      return;
    }

    if (isRecording) {
      speechRecognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsRecording(true);
      } catch {
        onOpenVoiceModal();
      }
    }
  };

  // Adjust textarea height automatically
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!prompt.trim() && images.length === 0 && files.length === 0) || isLoading) return;

    if (isRecording && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsRecording(false);
    }

    onSendMessage({
      prompt: prompt.trim() || 'Analyze attached assets.',
      forceTool: currentToolMode !== 'auto' ? currentToolMode : undefined,
      images: images.length ? images : undefined,
      files: files.length ? files : undefined,
    });

    setPrompt('');
    setImages([]);
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || 'text/plain',
            size: file.size,
            content,
          },
        ]);
      };
      // Read text content
      reader.readAsText(file);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const toolIcons: Record<AssistantToolMode, React.ReactNode> = {
    auto: <Compass className="w-3.5 h-3.5" />,
    search: <Globe className="w-3.5 h-3.5 text-blue-400" />,
    code: <Code2 className="w-3.5 h-3.5 text-emerald-400" />,
    document: <FileText className="w-3.5 h-3.5 text-amber-400" />,
    image: <Sparkles className="w-3.5 h-3.5 text-pink-400" />,
    calculator: <Calculator className="w-3.5 h-3.5 text-indigo-400" />,
    voice: <Radio className="w-3.5 h-3.5 text-purple-400" />,
    translate: <Languages className="w-3.5 h-3.5 text-teal-400" />,
  };

  const toolLabels: Record<AssistantToolMode, string> = {
    auto: 'Auto Orchestrator',
    search: 'Web Search',
    code: 'Code Engine',
    document: 'Document RAG',
    image: 'Image Engine',
    calculator: 'Calculator',
    voice: 'Voice Mode',
    translate: 'Translation',
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Attached Media Previews */}
      {(images.length > 0 || files.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
          {images.map((img, i) => (
            <div key={i} className="relative group/preview rounded-lg overflow-hidden border border-neutral-700">
              <img src={img} alt="Preview" className="h-14 w-14 object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute top-0.5 right-0.5 bg-neutral-950/80 hover:bg-red-950 text-white rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800/80 border border-neutral-700 text-xs text-neutral-200"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="hover:text-red-400 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative rounded-2xl bg-neutral-900 border border-neutral-800 focus-within:border-neutral-700 shadow-xl transition-all">
        {/* Active Tool Badge / Selector */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1 border-b border-neutral-800/50">
          <div className="relative">
            <button
              type="button"
              onClick={() => setToolMenuOpen(!toolMenuOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 transition"
            >
              {toolIcons[currentToolMode]}
              <span>{toolLabels[currentToolMode]}</span>
              <span className="text-[10px] text-neutral-500">▼</span>
            </button>

            {/* Tool Mode Dropdown */}
            {toolMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-48 rounded-xl bg-neutral-900 border border-neutral-700/80 shadow-2xl py-1 z-30">
                {(Object.keys(toolLabels) as AssistantToolMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      onSelectToolMode(mode);
                      setToolMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-neutral-800 transition ${
                      currentToolMode === mode ? 'text-indigo-400 font-semibold bg-neutral-800/40' : 'text-neutral-300'
                    }`}
                  >
                    {toolIcons[mode]}
                    <span>{toolLabels[mode]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Voice Hub Launch Button */}
          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition px-2 py-0.5 rounded hover:bg-indigo-950/40"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Voice OS Mode</span>
          </button>
        </div>

        {/* Text Input Area */}
        <div className="p-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              currentToolMode === 'search'
                ? 'Ask anything to search the live web with citations...'
                : currentToolMode === 'code'
                ? 'Describe a program, ask to debug, explain or convert code...'
                : currentToolMode === 'document'
                ? 'Ask a question grounded in your uploaded documents...'
                : currentToolMode === 'calculator'
                ? 'Enter math equation or conversion (e.g. sqrt(144) * 5 or 25km to miles)...'
                : currentToolMode === 'image'
                ? 'Describe the image you want to generate...'
                : 'Ask anything, manage tasks, solve math, analyze files, or speak...'
            }
            className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none resize-none max-h-44 min-h-[38px] leading-relaxed"
          />
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".txt,.pdf,.csv,.json,.md,.docx,.ts,.js,.py"
              className="hidden"
            />
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageChange}
              multiple
              accept="image/*"
              className="hidden"
            />

            {/* Attach Document */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach document (PDF, TXT, CSV, JSON, Code)"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Attach Image */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              title="Attach image for vision understanding"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Speech to Text Microphone */}
            <button
              type="button"
              onClick={toggleMic}
              title={isRecording ? 'Stop listening' : 'Push to talk (Speech-to-Text)'}
              className={`p-1.5 rounded-lg transition ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {isRecording && (
              <span className="text-xs text-red-400 font-medium animate-pulse ml-1">
                Listening...
              </span>
            )}
          </div>

          {/* Right Action: Send or Stop */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!prompt.trim() && images.length === 0 && files.length === 0}
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-2 mt-1.5 text-[11px] text-neutral-500">
        <span>Aether AI unified workspace · Real-time search &amp; tools</span>
        <span>Enter to send · Shift + Enter for new line</span>
      </div>
    </div>
  );
};
