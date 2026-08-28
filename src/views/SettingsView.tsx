import React, { useState } from 'react';
import { ViewName, AppSettings } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AssistantBrain } from '../services/assistantBrain';
import { TRANSLATIONS } from '../data/translations';
import {
  Settings,
  ArrowLeft,
  Languages,
  Eye,
  Type,
  RotateCcw,
  ShieldCheck,
  Check,
  Sparkles,
  Key,
  Cpu,
  Coins,
  AlertTriangle,
  Volume2,
  Play,
  Trash2,
  Layers,
  HelpCircle,
  CheckCircle,
  Info,
  Lock,
  EyeOff,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetDemoData: () => void;
  onNavigate: (view: ViewName) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  onOpenWhyModal?: () => void;
  onOpenDemoInfoModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetDemoData,
  onNavigate,
  onShowToast,
  onOpenWhyModal,
  onOpenDemoInfoModal,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  const gpt = settings.gpt || {
    enabled: false,
    apiKey: '',
    model: 'gpt-4o-mini',
    maxTokens: 120,
    tokenBudget: 5000,
    tokensUsed: 0,
  };

  const [isTestingKey, setIsTestingKey] = useState(false);
  const [showKeyText, setShowKeyText] = useState(false);
  const tokensUsed = AssistantBrain.getTokensUsed();
  const tokenBudget = gpt.tokenBudget || 5000;
  const tokenPercent = Math.min(100, Math.round((tokensUsed / tokenBudget) * 100));

  const handleReset = () => {
    onResetDemoData();
    onShowToast('Demo Data Reset', 'All synthetic records have been reset to pristine initial state.');
  };

  const handleGptChange = (fields: Partial<typeof gpt>) => {
    onUpdateSettings({
      gpt: {
        ...gpt,
        ...fields,
      },
    });
  };

  const handleTestKey = async () => {
    if (!gpt.apiKey?.trim()) {
      onShowToast('Missing API Key', 'Please paste an API key before testing.', 'warning');
      return;
    }

    setIsTestingKey(true);
    const res = await AssistantBrain.testGptConnection(gpt.apiKey, gpt.model);
    setIsTestingKey(false);

    if (res.success) {
      onShowToast('GPT Assist Ready', res.message, 'success');
    } else {
      onShowToast('Connection Test Failed', res.message, 'error');
    }
  };

  const handleClearKey = () => {
    handleGptChange({ apiKey: '', enabled: false });
    onShowToast('API Key Cleared', 'GPT Assist has been disabled and key removed from browser storage.', 'info');
  };

  const handleResetTokens = () => {
    AssistantBrain.resetTokensUsed();
    handleGptChange({ tokensUsed: 0 });
    onShowToast('Token Counter Reset', 'Estimated token consumption reset to 0.', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28">
      <Breadcrumbs currentView="settingsView" onNavigate={onNavigate} />

      {/* Header with Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => onNavigate('dashboardView')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 mb-2 p-1 rounded focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToDashboard}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-2xs">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t.settings} & Assistant Controls
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Language preferences, accessibility options, honest mock disclosures, and AI configuration
              </p>
            </div>
          </div>
        </div>

        {/* Quick Modal Triggers */}
        <div className="flex items-center gap-2">
          {onOpenWhyModal && (
            <button
              onClick={onOpenWhyModal}
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Why this prototype?</span>
            </button>
          )}
          {onOpenDemoInfoModal && (
            <button
              onClick={onOpenDemoInfoModal}
              className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Info className="w-4 h-4" />
              <span>Demo Info</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Language Selection Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Portal Language (भाषा चयन)
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              id="btn-lang-en"
              onClick={() => onUpdateSettings({ language: 'en' })}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                settings.language === 'en'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div>
                <div className="text-sm font-bold">English</div>
                <div className="text-[11px] text-slate-500 font-normal">
                  Standard Citizen English Portal
                </div>
              </div>
              {settings.language === 'en' && <Check className="w-5 h-5 text-blue-600" />}
            </button>

            <button
              id="btn-lang-hi"
              onClick={() => onUpdateSettings({ language: 'hi' })}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                settings.language === 'hi'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div>
                <div className="text-sm font-bold">हिन्दी (Hindi)</div>
                <div className="text-[11px] text-slate-500 font-normal">
                  नागरिक-अनुकूल हिन्दी संस्करण
                </div>
              </div>
              {settings.language === 'hi' && <Check className="w-5 h-5 text-blue-600" />}
            </button>
          </div>
        </div>

        {/* Accessibility & Visual Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Accessibility & Display Controls (GIGW Compliant)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              AAA Standard
            </span>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <strong>Accessibility Note:</strong> This prototype aims to be simple, readable, and accessible. It includes high-contrast elements, clear text labels with icons, scalable typography, and keyboard navigation.
          </div>

          {/* Read Answers Aloud Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Read Answers Aloud (Voice Speech)</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Automatically read PF Sahayak assistant responses using browser text-to-speech.
              </div>
            </div>
            <button
              id="read-aloud-toggle"
              onClick={() => onUpdateSettings({ readAloud: !settings.readAloud })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                settings.readAloud ? 'bg-blue-700' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={settings.readAloud}
              aria-label="Toggle Read Answers Aloud"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.readAloud ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Font Size Selector */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-2">
              <Type className="w-4 h-4 text-slate-500" />
              <span>Base Typography Scaling:</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['small', 'normal', 'large'] as const).map((size) => (
                <button
                  key={size}
                  id={`font-size-${size}`}
                  onClick={() => onUpdateSettings({ fontSize: size })}
                  className={`py-3 px-4 rounded-xl text-xs font-bold capitalize border transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                    settings.fontSize === size
                      ? 'bg-purple-50 text-purple-900 border-purple-500 ring-2 ring-purple-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                  aria-label={`Select ${size} font size`}
                >
                  {size} {size === 'normal' ? '(Standard)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast Toggle */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">High Contrast Mode</div>
              <div className="text-[11px] text-slate-500">
                Enhance edge borders and text contrast for low-vision readability.
              </div>
            </div>
            <button
              id="high-contrast-toggle"
              onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                settings.highContrast ? 'bg-blue-700' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={settings.highContrast}
              aria-label="Toggle High Contrast Mode"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.highContrast ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* GPT Assistant Settings Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">
                GPT Assistant Settings (PF Sahayak AI)
              </h3>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto border ${
                gpt.enabled && gpt.apiKey
                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
            >
              Current: {gpt.enabled && gpt.apiKey ? 'GPT Assist Mode' : 'Local Demo Mode (Free)'}
            </span>
          </div>

          {/* Missing key notice / info */}
          {!gpt.apiKey && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Mode Status:</strong> No API key added. Assistant is using local demo answers. Works 100% free and offline in the browser.
              </span>
            </div>
          )}

          {gpt.apiKey && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                <strong>Mode Status:</strong> API key stored locally in this browser. For prototype only.
              </span>
            </div>
          )}

          {/* Toggle Enable GPT */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">Enable GPT Assistant</div>
              <div className="text-[11px] text-slate-500">
                Switch from Local Demo mode to GPT-4o-mini for conversational natural replies.
              </div>
            </div>
            <button
              id="gpt-enable-toggle"
              onClick={() => handleGptChange({ enabled: !gpt.enabled })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:outline-none ${
                gpt.enabled ? 'bg-purple-600' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={gpt.enabled}
              aria-label="Toggle GPT Assistant"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  gpt.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <label htmlFor="gpt-api-key-input" className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-slate-500" />
              <span>OpenAI API Key (Optional):</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeyText ? 'text' : 'password'}
                  id="gpt-api-key-input"
                  value={gpt.apiKey}
                  onChange={(e) => handleGptChange({ apiKey: e.target.value })}
                  placeholder="Paste API key only if you have one (sk-...)"
                  className="w-full text-xs p-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  aria-label={showKeyText ? 'Hide API key' : 'Show API key'}
                >
                  {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  id="btn-test-gpt-key"
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTestingKey || !gpt.apiKey?.trim()}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:outline-none"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isTestingKey ? 'Testing...' : 'Test Connection'}</span>
                </button>

                {gpt.apiKey && (
                  <button
                    id="btn-clear-gpt-key"
                    type="button"
                    onClick={handleClearKey}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2.5 rounded-xl font-bold text-xs transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                    title="Clear saved key"
                    aria-label="Clear saved key"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
              <span>
                For prototype demonstration only. Never enter confidential credentials. Stored solely in browser localStorage.
              </span>
            </div>
          </div>

          {/* Model & Token Limits Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                <span>Model Name:</span>
              </label>
              <input
                type="text"
                value={gpt.model || 'gpt-4o-mini'}
                onChange={(e) => handleGptChange({ model: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-xl"
                placeholder="gpt-4o-mini"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Coins className="w-3.5 h-3.5 text-slate-500" />
                <span>Max Tokens per Reply:</span>
              </label>
              <input
                type="number"
                value={gpt.maxTokens || 120}
                onChange={(e) => handleGptChange({ maxTokens: parseInt(e.target.value) || 120 })}
                className="w-full text-xs p-2 border border-slate-300 rounded-xl"
                min={50}
                max={500}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Coins className="w-3.5 h-3.5 text-slate-500" />
                <span>Token Budget:</span>
              </label>
              <input
                type="number"
                value={gpt.tokenBudget || 5000}
                onChange={(e) => handleGptChange({ tokenBudget: parseInt(e.target.value) || 5000 })}
                className="w-full text-xs p-2 border border-slate-300 rounded-xl"
                min={1000}
                max={50000}
              />
            </div>
          </div>

          {/* Token Usage Stats & Progress Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-700">Estimated Tokens Used: </span>
                <span className="font-extrabold text-purple-800">
                  {tokensUsed.toLocaleString()} / {tokenBudget.toLocaleString()} tokens ({tokenPercent}%)
                </span>
              </div>
              <button
                onClick={handleResetTokens}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1 rounded-lg shadow-2xs self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              >
                Reset Token Counter
              </button>
            </div>

            {/* Token Budget Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  tokenPercent >= 90
                    ? 'bg-rose-600'
                    : tokenPercent >= 70
                    ? 'bg-amber-500'
                    : 'bg-purple-600'
                }`}
                style={{ width: `${tokenPercent}%` }}
              />
            </div>
            {tokensUsed >= tokenBudget && (
              <div className="text-[11px] text-amber-800 font-medium">
                Token budget reached. Assistant is automatically using local demo answers.
              </div>
            )}
          </div>
        </div>

        {/* Honesty & Mock Disclosure Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Honesty & Architecture: What is Real and What is Mocked?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="font-bold text-emerald-900 text-xs mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Real in this Prototype:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-700 list-disc list-inside">
                <li>User interface and single-page navigation</li>
                <li>Claim readiness scoring logic & risk thresholds</li>
                <li>Local issue detection and auto-fix simulator</li>
                <li>Predefined rule-based assistant & intent parser</li>
                <li>Mathematical PF calculation engine & tax checks</li>
                <li>Grievance letter and employer reminder generator</li>
                <li>Voice recognition and text-to-speech audio</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="font-bold text-amber-900 text-xs mb-2 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Mocked in this Prototype:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-700 list-disc list-inside">
                <li>Real EPFO backend and member portal login</li>
                <li>DigiLocker document APIs and live OCR</li>
                <li>Live bank account penny-drop verification</li>
                <li>Real-time Aadhaar/PAN database validation</li>
                <li>Live employer email/SMS reminder dispatch</li>
                <li>Live claim submission to EPFO Field Offices</li>
                <li>GPT assistant if no OpenAI key is provided</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-600">
            All personal information shown here is synthetic and for demonstration only.
          </div>
        </div>

        {/* Demo State Reset Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <RotateCcw className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Prototype Reset Controls
            </h3>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed">
            Reset all synthetic personas (Asha, Ravi, Meena), fixed issues, and submitted claim timelines back to initial hackathon defaults.
          </div>

          <div>
            <button
              id="btn-reset-demo-data"
              onClick={handleReset}
              className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:outline-none"
              aria-label="Reset demo data"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset demo data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
