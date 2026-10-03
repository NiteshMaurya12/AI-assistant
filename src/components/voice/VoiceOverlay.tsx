import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Radio,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Api } from '../../services/api';

interface VoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNewVoiceMessage: (userText: string, assistantResponse: string) => void;
  conversationId?: string;
  voiceName: string;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({
  isOpen,
  onClose,
  onNewVoiceMessage,
  conversationId,
  voiceName = 'Kore',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(voiceName);

  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) {
      stopAll();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognition.onend = () => {
        setIsListening(false);
        // If user said something, send to AI automatically
        if (transcript.trim()) {
          processVoiceQuery(transcript.trim());
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      startListening();
    }
  }, [isOpen]);

  const startListening = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsSpeaking(false);
    }
    setTranscript('');
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const stopAll = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setIsListening(false);
    setIsProcessing(false);
    setIsSpeaking(false);
  };

  const processVoiceQuery = async (queryText: string) => {
    setIsProcessing(true);
    try {
      // 1. Send query to AI Orchestrator with speakResponse flag
      const result = await Api.sendMessage({
        prompt: queryText,
        conversationId,
        speakResponse: true,
      });

      const responseText = result.message.content;
      setLastResponse(responseText);

      // Report to parent to sync with main chat
      onNewVoiceMessage(queryText, responseText);

      // 2. Play audio response
      if (result.message.audioUrl) {
        playAudio(result.message.audioUrl);
      } else {
        // Fallback: browser speech synthesis if audioUrl wasn't generated
        playBrowserSpeech(responseText);
      }
    } catch (err: any) {
      console.error('Voice processing failed:', err);
      setLastResponse('I encountered an error processing your voice command. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (url: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    setIsSpeaking(true);

    audio.onended = () => {
      setIsSpeaking(false);
    };
    audio.onerror = () => {
      setIsSpeaking(false);
    };
    audio.play().catch(() => setIsSpeaking(false));
  };

  const playBrowserSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.slice(0, 400));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-xl flex flex-col justify-between p-6 sm:p-10 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Aether Voice Assistant</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                {selectedVoice} (24kHz)
              </span>
            </div>
            <div className="text-xs text-neutral-400">Natural bidirectional speech interaction</div>
          </div>
        </div>

        {/* Voice Selector & Close Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">
            <Settings className="w-3.5 h-3.5" />
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-transparent text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="Kore" className="bg-neutral-900 text-neutral-100">Kore (Balanced &amp; Articulate)</option>
              <option value="Puck" className="bg-neutral-900 text-neutral-100">Puck (Expressive &amp; Bright)</option>
              <option value="Fenrir" className="bg-neutral-900 text-neutral-100">Fenrir (Deep &amp; Resonant)</option>
              <option value="Zephyr" className="bg-neutral-900 text-neutral-100">Zephyr (Warm &amp; Natural)</option>
              <option value="Charon" className="bg-neutral-900 text-neutral-100">Charon (Authoritative)</option>
            </select>
          </div>

          <button
            onClick={() => {
              stopAll();
              onClose();
            }}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Central Visualizer & Conversation Display */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full mx-auto my-6 text-center">
        {/* Pulsing Visual Wave Sphere */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Animated concentric rings */}
          <div
            className={`absolute w-56 h-56 rounded-full border border-indigo-500/20 transition-all duration-700 ${
              isListening ? 'scale-110 opacity-80 animate-ping' : isSpeaking ? 'scale-105 opacity-60' : 'scale-90 opacity-20'
            }`}
          />
          <div
            className={`absolute w-44 h-44 rounded-full border border-violet-500/30 transition-all duration-500 ${
              isListening ? 'scale-105 opacity-90' : isSpeaking ? 'scale-110 opacity-70 animate-pulse' : 'scale-95 opacity-30'
            }`}
          />

          {/* Central orb */}
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
              isListening
                ? 'bg-gradient-to-tr from-red-600 to-amber-500 shadow-red-500/40 scale-105'
                : isProcessing
                ? 'bg-gradient-to-tr from-amber-500 to-indigo-600 shadow-amber-500/40 animate-spin'
                : isSpeaking
                ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-indigo-500/50 scale-105'
                : 'bg-gradient-to-tr from-neutral-800 to-neutral-700 shadow-black'
            }`}
          >
            {isProcessing ? (
              <Sparkles className="w-12 h-12 text-white animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="w-12 h-12 text-white animate-bounce" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </div>
        </div>

        {/* Live Status Tag */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isListening
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : isProcessing
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : isSpeaking
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isListening
                  ? 'bg-red-400 animate-ping'
                  : isProcessing
                  ? 'bg-amber-400 animate-spin'
                  : isSpeaking
                  ? 'bg-indigo-400 animate-pulse'
                  : 'bg-neutral-500'
              }`}
            />
            {isListening
              ? 'Listening to your voice...'
              : isProcessing
              ? 'Synthesizing knowledge...'
              : isSpeaking
              ? 'Speaking response...'
              : 'Tap microphone to speak'}
          </span>
        </div>

        {/* Live Transcript / Response Text */}
        <div className="w-full min-h-[90px] px-6 py-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md">
          {transcript ? (
            <p className="text-lg text-neutral-100 font-medium">"{transcript}"</p>
          ) : lastResponse ? (
            <p className="text-sm text-neutral-300 line-clamp-3 leading-relaxed">
              {lastResponse.replace(/[#*_`]/g, '')}
            </p>
          ) : (
            <p className="text-neutral-500 text-sm italic">
              "Tell me the latest breakthroughs in renewable energy..." or "Create a workout routine..."
            </p>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="max-w-md w-full mx-auto flex items-center justify-center gap-6">
        {/* Toggle Listening Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-medium text-sm transition-all shadow-lg ${
            isListening
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          <span>{isListening ? 'Stop Listening' : 'Speak to Aether'}</span>
        </button>

        {/* Interrupt / Stop Speaking Button */}
        {isSpeaking && (
          <button
            onClick={() => {
              if (audioPlayerRef.current) audioPlayerRef.current.pause();
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              setIsSpeaking(false);
            }}
            className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-sm transition"
          >
            <VolumeX className="w-4 h-4 text-red-400" />
            <span>Interrupt</span>
          </button>
        )}
      </div>
    </div>
  );
};
