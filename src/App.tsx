import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, AssistantToolMode, UserSettings } from './types';
import { Api } from './services/api';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ChatArea } from './components/chat/ChatArea';
import { InputArea } from './components/chat/InputArea';
import { VoiceOverlay } from './components/voice/VoiceOverlay';
import { MemoryModal } from './components/modals/MemoryModal';
import { TasksModal } from './components/modals/TasksModal';
import { DocumentModal } from './components/modals/DocumentModal';
import { ImageStudioModal } from './components/modals/ImageStudioModal';
import { CalculatorModal } from './components/modals/CalculatorModal';
import { SettingsModal } from './components/modals/SettingsModal';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeToolMode, setActiveToolMode] = useState<AssistantToolMode>('auto');

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'memory' | 'tasks' | 'document' | 'image' | 'calculator' | 'settings' | null
  >(null);
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);

  // Settings & metadata
  const [settings, setSettings] = useState<UserSettings>({
    userName: 'Nitesh',
    persona: 'helpful',
    language: 'English',
    voiceName: 'Kore',
    autoWebSearch: true,
    codeExecutionAuto: true,
    speechRate: 1.0,
    customInstructions: '',
  });

  const [taskCount, setTaskCount] = useState(0);
  const [memoryCount, setMemoryCount] = useState(0);

  // Audio playback state
  const [currentPlayingAudioId, setCurrentPlayingAudioId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Document context injected into next message
  const [pendingDocContext, setPendingDocContext] = useState<string | undefined>();

  // Abort controller for stopping generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [convs, userSettings, tasks, memories] = await Promise.all([
        Api.getConversations(),
        Api.getSettings(),
        Api.getTasks(),
        Api.getMemories(),
      ]);

      setConversations(convs);
      setSettings(userSettings);
      setTaskCount(tasks.filter((t) => !t.completed).length);
      setMemoryCount(memories.filter((m) => m.enabled).length);

      if (convs.length > 0) {
        selectConversation(convs[0].id);
      }
    } catch (err) {
      console.warn('Initial data load error:', err);
    }
  };

  const selectConversation = async (id: string) => {
    setActiveConversationId(id);
    stopAudio();
    try {
      const conv = await Api.getConversation(id);
      setMessages(conv.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(undefined);
    setMessages([]);
    stopAudio();
    setPendingDocContext(undefined);
  };

  const handleSendMessage = async (params: {
    prompt: string;
    forceTool?: AssistantToolMode;
    images?: string[];
    files?: Array<{ name: string; type: string; size: number; content?: string }>;
  }) => {
    stopAudio();
    setIsLoading(true);

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: params.prompt,
      timestamp: Date.now(),
      images: params.images,
      files: params.files?.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Ingest document content if files were attached directly to the message
      let docContext = pendingDocContext;
      if (params.files && params.files.length > 0) {
        const fileContents = params.files
          .filter((f) => f.content)
          .map((f) => `File [${f.name}]:\n${f.content?.slice(0, 3000)}`)
          .join('\n\n');
        if (fileContents) {
          docContext = docContext ? `${docContext}\n\n${fileContents}` : fileContents;
        }
      }

      const result = await Api.sendMessage({
        prompt: params.prompt,
        conversationId: activeConversationId,
        forceTool: params.forceTool,
        images: params.images,
        docContext,
        files: userMessage.files,
      });

      if (!activeConversationId) {
        setActiveConversationId(result.conversationId);
      }

      setMessages((prev) => [...prev, result.message]);
      setPendingDocContext(undefined);

      // Refresh conversations list to update titles/timestamps
      const updatedConvs = await Api.getConversations();
      setConversations(updatedConvs);

      // Refresh tasks and memories if modified
      if (result.createdTask) {
        const tasks = await Api.getTasks();
        setTaskCount(tasks.filter((t) => !t.completed).length);
      }
      if (result.createdMemory) {
        const memories = await Api.getMemories();
        setMemoryCount(memories.filter((m) => m.enabled).length);
      }
    } catch (err: any) {
      console.error('Send message error:', err);
      const errorMsg: Message = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `I ran into an issue connecting to the AI service: ${err.message || 'Please check your connection and configuration.'}`,
        timestamp: Date.now(),
        toolUsed: 'error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const handleRegenerate = () => {
    if (messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove last assistant message
      setMessages((prev) => prev.slice(0, -1));
      handleSendMessage({
        prompt: lastUserMsg.content,
        images: lastUserMsg.images,
        forceTool: activeToolMode !== 'auto' ? activeToolMode : undefined,
      });
    }
  };

  // Audio Playback
  const handleSpeak = async (text: string) => {
    stopAudio();
    try {
      const res = await Api.synthesizeTTS(text, settings.voiceName);
      if (res.audioUrl) {
        const audio = new Audio(res.audioUrl);
        currentAudioRef.current = audio;
        setCurrentPlayingAudioId(text.slice(0, 30));

        audio.onended = () => {
          setCurrentPlayingAudioId(null);
        };
        audio.onerror = () => {
          setCurrentPlayingAudioId(null);
        };
        await audio.play();
      }
    } catch {
      // Fallback: browser speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
        utterance.rate = settings.speechRate || 1.0;
        utterance.onend = () => setCurrentPlayingAudioId(null);
        setCurrentPlayingAudioId(text.slice(0, 30));
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentPlayingAudioId(null);
  };

  const handleClearChat = async () => {
    if (activeConversationId) {
      await Api.deleteConversation(activeConversationId);
      const remaining = conversations.filter((c) => c.id !== activeConversationId);
      setConversations(remaining);
      handleNewChat();
    } else {
      setMessages([]);
    }
  };

  const handleClearAllConversations = async () => {
    await Api.clearAllConversations();
    setConversations([]);
    handleNewChat();
  };

  const handleVoiceMessage = (userText: string, assistantResponse: string) => {
    const userMsg: Message = {
      id: `msg-${Date.now()}-voice-user`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };
    const assistantMsg: Message = {
      id: `msg-${Date.now()}-voice-assistant`,
      role: 'assistant',
      content: assistantResponse,
      timestamp: Date.now(),
      toolUsed: 'voice',
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 antialiased font-sans">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={async (id) => {
          await Api.deleteConversation(id);
          const remaining = conversations.filter((c) => c.id !== id);
          setConversations(remaining);
          if (activeConversationId === id) {
            handleNewChat();
          }
        }}
        onUpdateConversation={async (id, updates) => {
          await Api.updateConversation(id, updates);
          const updated = await Api.getConversations();
          setConversations(updated);
        }}
        onOpenModal={(modal) => setActiveModal(modal)}
        settings={settings}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Header Bar */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeToolMode={activeToolMode}
          onSelectToolMode={setActiveToolMode}
          onOpenVoiceModal={() => setVoiceOverlayOpen(true)}
          onOpenModal={(modal) => setActiveModal(modal)}
          onClearChat={handleClearChat}
          taskCount={taskCount}
          memoryCount={memoryCount}
          conversationTitle={activeConv?.title || 'New Conversation'}
        />

        {/* Central Chat Stream */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSelectPrompt={(prompt, mode) => {
            if (mode) setActiveToolMode(mode);
            handleSendMessage({ prompt, forceTool: mode });
          }}
          onRegenerate={handleRegenerate}
          onSpeak={handleSpeak}
          currentPlayingAudioId={currentPlayingAudioId}
          onStopAudio={stopAudio}
        />

        {/* Input Bar */}
        <InputArea
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onStop={handleStop}
          onOpenVoiceModal={() => setVoiceOverlayOpen(true)}
          currentToolMode={activeToolMode}
          onSelectToolMode={setActiveToolMode}
        />
      </div>

      {/* Immersive Voice OS Overlay */}
      <VoiceOverlay
        isOpen={voiceOverlayOpen}
        onClose={() => setVoiceOverlayOpen(false)}
        onNewVoiceMessage={handleVoiceMessage}
        conversationId={activeConversationId}
        voiceName={settings.voiceName}
      />

      {/* Modals */}
      <MemoryModal
        isOpen={activeModal === 'memory'}
        onClose={() => setActiveModal(null)}
        onMemoryUpdated={async () => {
          const memories = await Api.getMemories();
          setMemoryCount(memories.filter((m) => m.enabled).length);
        }}
      />

      <TasksModal
        isOpen={activeModal === 'tasks'}
        onClose={() => setActiveModal(null)}
        onTasksUpdated={async () => {
          const tasks = await Api.getTasks();
          setTaskCount(tasks.filter((t) => !t.completed).length);
        }}
      />

      <DocumentModal
        isOpen={activeModal === 'document'}
        onClose={() => setActiveModal(null)}
        onSelectContextForChat={(contextText, docName) => {
          setPendingDocContext(contextText);
          handleSendMessage({
            prompt: `I've attached document context from "${docName}". Please analyze it and summarize its critical findings.`,
            forceTool: 'document',
          });
        }}
      />

      <ImageStudioModal
        isOpen={activeModal === 'image'}
        onClose={() => setActiveModal(null)}
        onSendToChat={(imageUrl, prompt) => {
          handleSendMessage({
            prompt: `Here is the visual artwork generated for prompt: "${prompt}". What are its artistic and technical elements?`,
            images: [imageUrl],
            forceTool: 'image',
          });
        }}
      />

      <CalculatorModal
        isOpen={activeModal === 'calculator'}
        onClose={() => setActiveModal(null)}
        onSendResultToChat={(resultStr) => {
          handleSendMessage({
            prompt: `Please explain this calculation and its significance: ${resultStr}`,
            forceTool: 'calculator',
          });
        }}
      />

      <SettingsModal
        isOpen={activeModal === 'settings'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        onUpdateSettings={setSettings}
        onClearAllConversations={handleClearAllConversations}
      />
    </div>
  );
}
