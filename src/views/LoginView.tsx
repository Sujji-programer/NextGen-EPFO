import React, { useState } from 'react';
import { ViewName, Persona, AppSettings, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  User,
  Lock,
  Globe,
  KeyRound,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';

interface LoginViewProps {
  personas: Record<string, Persona>;
  onSelectPersona: (personaId: string) => void;
  onNavigate: (view: ViewName) => void;
  settings?: AppSettings;
  onLanguageChange?: (lang: Language) => void;
  onOpenWhyModal?: () => void;
  onOpenDemoInfoModal?: () => void;
}

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
];

export const LoginView: React.FC<LoginViewProps> = ({
  personas,
  onSelectPersona,
  settings,
  onLanguageChange,
}) => {
  const [activeTab, setActiveTab] = useState<'personas' | 'manual'>('personas');
  const [manualUan, setManualUan] = useState('100000000001');
  const [manualPassword, setManualPassword] = useState('demo123');

  const currentLang = settings?.language || 'en';

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = (Object.values(personas) as Persona[]).find((p) => p.uan === manualUan);
    if (found) {
      onSelectPersona(found.id);
    } else {
      onSelectPersona('account-a');
    }
  };

  // 3 Persona Accounts
  const pA = personas['account-a'] || personas['asha-clean'];
  const pB = personas['account-b'] || personas['ravi-issues'];
  const pC = personas['account-c'] || personas['meena-rejected'];

  const personaList = [
    {
      id: 'account-a',
      accountLabel: 'ACCOUNT-A',
      name: pA?.name || 'Arjun Sharma',
      uan: pA?.uan || '100000000001',
      status: 'Clean Record',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      icon: CheckCircle,
      summary: 'Matched Aadhaar KYC, active PAN, verified bank. Fast 1-click claim filing.',
      btnText: 'Sign In as Arjun',
      accentColor: 'border-emerald-200 hover:border-emerald-400',
    },
    {
      id: 'account-b',
      accountLabel: 'ACCOUNT-B',
      name: pB?.name || 'Priya Nair',
      uan: pB?.uan || '100000000002',
      status: 'Fixable KYC',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
      icon: AlertTriangle,
      summary: 'Unseeded PAN & defunct merged bank IFSC. 1-click auto-fixable via DigiLocker.',
      btnText: 'Sign In as Priya',
      accentColor: 'border-amber-200 hover:border-amber-400',
    },
    {
      id: 'account-c',
      accountLabel: 'ACCOUNT-C',
      name: pC?.name || 'Ramesh Kumar Verma',
      uan: pC?.uan || '100000000003',
      status: 'Insolvent Trust',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
      icon: ShieldAlert,
      summary: 'Insolvent private PF trust. Online claims locked; directs to NCLT & RPFC recovery.',
      btnText: 'Sign In as Ramesh',
      accentColor: 'border-rose-200 hover:border-rose-400',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 font-sans space-y-8 animate-entrance">
      {/* 1. BRAND HEADER & MULTILINGUAL SWITCHER */}
      <div className="text-center max-w-2xl mx-auto space-y-3 animate-entrance-delay-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs">
          <Building2 className="w-3.5 h-3.5 text-amber-300" />
          <span>Employees’ Provident Fund Organisation</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
          NextGen EPFO
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-medium">
          Citizen Member Portal • Instant eKYC Gateway &amp; Digital Claims
        </p>

        {/* Real-time Language Switcher */}
        <div className="pt-2 inline-flex items-center gap-1.5 p-1 bg-stone-100 border border-stone-200 rounded-xl">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
          <div className="flex flex-wrap gap-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => onLanguageChange && onLanguageChange(lang.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentLang === lang.code
                    ? 'bg-slate-900 text-white shadow-2xs scale-102'
                    : 'text-slate-700 hover:bg-stone-200'
                }`}
              >
                {lang.native}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. AUTHENTICATION / PERSONA SELECTION */}
      <div className="max-w-4xl mx-auto space-y-6 pt-2 animate-entrance-delay-2">
        <div className="flex items-center justify-center">
          <div className="bg-stone-200/80 p-1 rounded-xl inline-flex space-x-1 shadow-inner">
            <button
              type="button"
              id="tab-demo-personas"
              onClick={() => setActiveTab('personas')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'personas'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Select Citizen Account (3 Personas)
            </button>
            <button
              type="button"
              id="tab-manual-uan"
              onClick={() => setActiveTab('manual')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'manual'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manual UAN Sign-In
            </button>
          </div>
        </div>

        {activeTab === 'personas' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {personaList.map(
              ({
                id,
                accountLabel,
                name,
                uan,
                status,
                badgeColor,
                icon: Icon,
                summary,
                btnText,
                accentColor,
              }) => (
                <div
                  key={id}
                  id={`persona-card-${id}`}
                  className={`bg-white rounded-2xl border ${accentColor} shadow-2xs hover:shadow-md p-5 flex flex-col justify-between transition-all hover:-translate-y-1 duration-200`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {accountLabel}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                      >
                        <Icon className="w-3 h-3" />
                        {status}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-950 mb-1">{name}</h3>
                    <div className="text-xs font-mono text-slate-500 mb-3">UAN: {uan}</div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-4">{summary}</p>
                  </div>

                  <button
                    type="button"
                    id={`btn-login-${id}`}
                    onClick={() => onSelectPersona(id)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 active:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-2xs hover:shadow-md text-xs cursor-pointer"
                  >
                    <span>{btnText}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Manual UAN Sign-In</h3>
            <p className="text-xs text-slate-500 mb-5">
              Enter any 12-digit UAN to authenticate into the EPFO citizen portal.
            </p>

            <form onSubmit={handleManualLogin} className="space-y-4 text-xs">
              <div>
                <label htmlFor="uan-input" className="block text-xs font-bold text-slate-700 mb-1">
                  Universal Account Number (UAN)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="uan-input"
                    type="text"
                    value={manualUan}
                    onChange={(e) => setManualUan(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="e.g. 100000000001"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password-input" className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="password-input"
                    type="password"
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="demo123"
                    required
                  />
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl text-[11px] text-slate-600 flex items-start gap-2 border border-stone-200">
                <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Demo UANs: <strong>100000000001</strong> (Arjun), <strong>100000000002</strong> (Priya), or <strong>100000000003</strong> (Ramesh) • Password: <code>demo123</code>
                </span>
              </div>

              <button
                type="submit"
                id="submit-manual-login"
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-2xs text-xs cursor-pointer"
              >
                Sign In to Citizen Portal
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Security & Verification Notice */}
      <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-4 animate-entrance-delay-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
        <span>Protected by 256-Bit SSL Encryption • Compliant with EPFO IT Security Norms</span>
      </div>
    </div>
  );
};


