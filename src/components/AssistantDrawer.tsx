import React, { useState, useEffect, useRef } from 'react';
import { ViewName, Persona, AppSettings } from '../types';
import { AssistantBrain, AssistantResponse } from '../services/assistantBrain';
import { VoiceManager } from '../services/voiceManager';
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  User,
  ShieldCheck,
  Zap,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona?: Persona | null;
  onNavigate: (view: ViewName) => void;
  settings: AppSettings;
  onUpdateSettings?: (newSettings: Partial<AppSettings>) => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  source?: 'demo' | 'ai' | 'fallback';
  fallbackNotice?: string;
  actionView?: ViewName;
  actionLabel?: string;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentPersona,
  onNavigate,
  settings,
  onUpdateSettings,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isGptEnabled = !!(settings.gpt?.enabled && settings.gpt?.apiKey?.trim());
  const readAloud = settings.readAloud ?? false;

  // Initialize initial message
  useEffect(() => {
    const greetingName = currentPersona?.name || 'Citizen';
    setMessages([
      {
        id: 'init-msg',
        sender: 'bot',
        text: `Namaste ${greetingName}! I am gpt Help, your EPFO intelligent citizen assistant powered by OpenAI. Ask any question about claim rejection, KYC mismatch, balance calculation, exit dates, or transfer in plain language.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'demo',
      },
    ]);
  }, [currentPersona?.id]);

  // Focus input and scroll on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 150);
    } else {
      VoiceManager.stopListening();
      VoiceManager.stopSpeaking();
    }
  }, [isOpen]);

  // Keyboard accessibility (Escape key to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleReadAloud = () => {
    const nextState = !readAloud;
    if (onUpdateSettings) {
      onUpdateSettings({ readAloud: nextState });
    }
    if (!nextState) {
      VoiceManager.stopSpeaking();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setVoiceNotice(null);
    setIsThinking(true);

    try {
      const assistantContext = {
        personaName: currentPersona?.name,
        uan: currentPersona?.uan,
        totalBalance: currentPersona?.balance?.total,
        serviceYears: currentPersona?.serviceDetails?.totalServiceYears,
        serviceMonths: currentPersona?.serviceDetails?.totalServiceMonths,
        failedKycChecks: currentPersona?.kycChecks?.filter(c => c.status === 'failed').map(c => `${c.name} (${c.exactReason || c.details})`),
        isBankMismatch: currentPersona?.kycChecks?.some(c => c.id === 'bank' && c.status === 'failed'),
        isDoeMissing: currentPersona?.kycChecks?.some(c => c.id === 'exit_date' && c.status === 'failed'),
      };

      const res: AssistantResponse = await AssistantBrain.processQuery(query, settings.gpt, assistantContext);

      setIsThinking(false);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: res.source,
        fallbackNotice: res.fallbackNotice,
        actionView: res.actionView,
        actionLabel: res.actionLabel,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Read aloud if enabled
      if (readAloud) {
        VoiceManager.speak(res.answer, settings.language);
      }

      // Auto navigate if it was an explicit voice navigation command
      if (res.autoNavigate && res.actionView) {
        setTimeout(() => {
          onNavigate(res.actionView!);
          onClose();
        }, 1200);
      }
    } catch {
      setIsThinking(false);
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'Assistant is temporarily unavailable. Showing demo answer: Use EPFO Claim to diagnose and resolve your EPFO issues.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'fallback',
        fallbackNotice: 'Switched to demo answers to save API usage.',
        actionView: 'claimDoctorView',
        actionLabel: 'Open EPFO Claim',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  const handleStartVoice = () => {
    setVoiceNotice(null);

    const active = VoiceManager.startListening(settings.language, {
      onStart: () => {
        setIsListening(true);
      },
      onResult: (transcript) => {
        setIsListening(false);
        setInputText(transcript);
        // Automatically send voice query for swift convenience
        handleSendMessage(transcript);
      },
      onError: (err) => {
        setIsListening(false);
        setVoiceNotice(err);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!active) {
      setIsListening(false);
    }
  };

  const handleStopVoice = () => {
    VoiceManager.stopListening();
    setIsListening(false);
  };

  const suggestedChips = [
    'Why was my claim rejected?',
    'What is KYC mismatch?',
    'What is EPS service?',
    'How do I transfer PF?',
    'How long does PF withdrawal take?',
    'Check my claim readiness',
    'Open EPFO claim',
    'Calculate PF amount',
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-drawer-title"
    >
      <div
        className={`bg-white w-full ${
          isExpanded ? 'sm:max-w-2xl h-[92vh]' : 'sm:max-w-md sm:h-[620px] h-[85vh]'
        } rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200`}
      >
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="assistant-drawer-title" className="text-base font-extrabold tracking-tight">
                  gpt Help
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                    isGptEnabled
                      ? 'bg-purple-900/80 text-purple-200 border border-purple-700'
                      : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  {isGptEnabled ? 'GPT Assist Mode' : 'Local Demo Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">EPFO Voice & Intelligent Rules Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Read Aloud Audio Toggle */}
            <button
              onClick={handleToggleReadAloud}
              className={`p-2 rounded-xl text-xs transition-colors ${
                readAloud
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={readAloud ? 'Audio readout enabled' : 'Enable audio readout'}
              aria-label="Toggle Read Answers Aloud"
            >
              {readAloud ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Expand / Minimize button for desktop */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:inline-flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors"
              title={isExpanded ? 'Minimize drawer' : 'Expand drawer'}
              aria-label="Toggle drawer size"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              id="btn-close-assistant-drawer"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors"
              title="Close Assistant (Esc)"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggested Question Chips Area */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mr-1">
              Ask:
            </span>
            {suggestedChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="text-[11px] bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 shadow-2xs transition-all whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-100/60 text-xs" aria-live="polite">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'bot' && (
                <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-700 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                }`}
              >
                <div>{msg.text}</div>

                {/* Source Badge */}
                {msg.sender === 'bot' && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        msg.source === 'ai'
                          ? 'bg-purple-100 text-purple-800'
                          : msg.source === 'fallback'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {msg.source === 'ai'
                        ? 'AI answer'
                        : msg.source === 'fallback'
                        ? 'Fallback answer'
                        : 'Demo answer'}
                    </span>
                    <span className="text-slate-400">{msg.timestamp}</span>
                  </div>
                )}

                {/* Fallback Notice Warning banner if applicable */}
                {msg.fallbackNotice && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-900 flex items-center gap-1.5 font-medium">
                    <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>{msg.fallbackNotice}</span>
                  </div>
                )}

                {/* Action Link Button */}
                {msg.actionView && msg.actionLabel && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        onNavigate(msg.actionView!);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <span>{msg.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {/* Thinking loading indicator */}
          {isThinking && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 shadow-2xs flex items-center gap-2 text-slate-600 text-xs">
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Feedback notice if any */}
        {voiceNotice && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 text-amber-700" />
              <span>{voiceNotice}</span>
            </div>
            <button
              onClick={() => setVoiceNotice(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Listening banner */}
        {isListening && (
          <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-200 text-xs text-rose-800 font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>Listening... Speak your EPFO query</span>
            </div>
            <button
              onClick={handleStopVoice}
              className="text-[11px] bg-rose-200 hover:bg-rose-300 text-rose-900 px-2 py-0.5 rounded"
            >
              Stop
            </button>
          </div>
        )}

        {/* Voice helper prompt text */}
        <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 text-center font-medium">
          🎙️ Try saying: <span className="text-blue-700 font-semibold">"Open EPFO claim"</span> • <span className="text-blue-700 font-semibold">"Check balance"</span> • <span className="text-blue-700 font-semibold">"Why was my claim rejected?"</span> • <span className="text-blue-700 font-semibold">"Open calculator"</span>
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Microphone Button */}
            <button
              type="button"
              id="btn-assistant-drawer-mic"
              onClick={isListening ? handleStopVoice : handleStartVoice}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-500 ring-2 ring-rose-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
              aria-label="Microphone Query"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Accessible Text Input */}
            <div className="relative flex-1">
              <label htmlFor="assistant-drawer-input" className="sr-only">
                Ask PF Sahayak a question
              </label>
              <input
                ref={inputRef}
                id="assistant-drawer-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about rejection, KYC, exit date, transfer..."
                className="w-full text-xs p-2.5 pl-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              id="btn-assistant-drawer-send"
              disabled={!inputText.trim() || isThinking}
              className="bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-2.5 rounded-xl transition-colors font-bold text-xs shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
