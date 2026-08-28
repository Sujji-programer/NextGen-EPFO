import React, { useState, useEffect, useRef } from 'react';
import { ViewName, Persona, AppSettings } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AssistantBrain, AssistantResponse } from '../services/assistantBrain';
import { VoiceManager } from '../services/voiceManager';
import {
  Bot,
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  User,
  Sparkles,
  Volume2,
  VolumeX,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AssistantViewProps {
  currentPersona: Persona;
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

export const AssistantView: React.FC<AssistantViewProps> = ({
  currentPersona,
  onNavigate,
  settings,
  onUpdateSettings,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: `Namaste ${currentPersona.name}! I am AI Help, your EPFO citizen assistant. How can I help you today? You can ask about claim rejection causes, exit date updates, pension eligibility, or passbook balances.`,
      timestamp: 'Just now',
      source: 'demo',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isGptEnabled = !!(settings.gpt?.enabled && settings.gpt?.apiKey?.trim());
  const readAloud = settings.readAloud ?? false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    return () => {
      VoiceManager.stopListening();
      VoiceManager.stopSpeaking();
    };
  }, []);

  const handleToggleReadAloud = () => {
    const nextState = !readAloud;
    if (onUpdateSettings) {
      onUpdateSettings({ readAloud: nextState });
    }
    if (!nextState) {
      VoiceManager.stopSpeaking();
    }
  };

  const predefinedQueries = [
    {
      label: 'Why do claims get rejected?',
      query: 'Why was my claim rejected?',
    },
    {
      label: 'What is KYC mismatch?',
      query: 'What is KYC mismatch?',
    },
    {
      label: 'What is EPS pension service?',
      query: 'What is EPS service?',
    },
    {
      label: 'How to transfer old PF?',
      query: 'How do I transfer PF?',
    },
    {
      label: 'How long does withdrawal take?',
      query: 'How long does PF withdrawal take?',
    },
    {
      label: 'Check my Claim Readiness',
      query: 'Check my claim readiness',
    },
    {
      label: 'Open EPFO Claim',
      query: 'Open EPFO claim',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setVoiceNotice(null);
    setIsThinking(true);

    try {
      const res: AssistantResponse = await AssistantBrain.processQuery(text, settings.gpt);
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

      if (readAloud) {
        VoiceManager.speak(res.answer, settings.language);
      }

      if (res.autoNavigate && res.actionView) {
        setTimeout(() => {
          onNavigate(res.actionView!);
        }, 1200);
      }
    } catch {
      setIsThinking(false);
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'AI Help is operating in fallback mode. Open EPFO Claim to diagnose eligibility issues.',
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <Breadcrumbs currentView="assistantView" onNavigate={onNavigate} />

      {/* Header with Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => onNavigate('dashboardView')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 mb-2 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  AI Help
                </h1>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                    isGptEnabled
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  {isGptEnabled ? 'GPT Assist Mode' : 'Local Demo Mode'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Ask questions in plain language or voice for instant EPFO rules guidance
              </p>
            </div>
          </div>
        </div>

        {/* Read Aloud Audio Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleReadAloud}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              readAloud
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            aria-label="Toggle Read Answers Aloud"
          >
            {readAloud ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>Read Answers Aloud: {readAloud ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Predefined Chips */}
      <div className="mb-4">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Suggested Inquiries:
        </div>
        <div className="flex flex-wrap gap-2">
          {predefinedQueries.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(pq.query)}
              className="text-xs bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium px-3 py-1.5 rounded-full border border-slate-300 hover:border-blue-300 shadow-2xs transition-colors text-left"
            >
              {pq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
        {/* Messages Container */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
              )}

              <div
                className={`max-w-md sm:max-w-lg rounded-2xl p-4 text-xs leading-relaxed shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-700 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                }`}
              >
                <div className="font-normal">{msg.text}</div>

                {/* Source badge */}
                {msg.sender === 'bot' && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
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

                {/* Fallback Notice */}
                {msg.fallbackNotice && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-900 flex items-center gap-1.5 font-medium">
                    <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>{msg.fallbackNotice}</span>
                  </div>
                )}

                {msg.actionView && msg.actionLabel && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => msg.actionView && onNavigate(msg.actionView)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <span>{msg.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4 text-amber-300" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-2xs flex items-center gap-2 text-slate-600 text-xs">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {voiceNotice && (
          <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{voiceNotice}</span>
            </div>
            <button onClick={() => setVoiceNotice(null)} className="text-slate-400 hover:text-slate-600">
              Dismiss
            </button>
          </div>
        )}

        {isListening && (
          <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-200 text-xs text-rose-800 font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>Listening to your voice... (Speak now)</span>
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
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center font-medium">
          🎙️ Try saying: <span className="text-blue-700 font-semibold">"Open EPFO claim"</span> • <span className="text-blue-700 font-semibold">"Check balance"</span> • <span className="text-blue-700 font-semibold">"Why was my claim rejected?"</span> • <span className="text-blue-700 font-semibold">"Open calculator"</span>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              id="assistant-mic-btn"
              onClick={isListening ? handleStopVoice : handleStartVoice}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-300'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
              aria-label="Microphone query"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <label htmlFor="assistant-text-input" className="sr-only">
              Ask PF Sahayak
            </label>
            <input
              type="text"
              id="assistant-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about claims, passbook, exit date, or KYC..."
              className="flex-1 text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
            />

            <button
              type="submit"
              id="assistant-send-btn"
              disabled={!inputText.trim() || isThinking}
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-xl transition-colors font-bold text-xs shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

