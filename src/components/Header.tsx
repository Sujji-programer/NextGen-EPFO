import React, { useState } from 'react';
import { ViewName, Persona, AppSettings, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  Bell,
  LogOut,
  ChevronDown,
  Globe,
  Sliders,
  HelpCircle,
  Info,
  User,
  FileText,
  Sparkles,
  Bot
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  currentPersona: Persona | null;
  settings: AppSettings;
  onLanguageChange: (lang: Language) => void;
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

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  currentPersona,
  settings,
  onLanguageChange,
  onOpenWhyModal,
  onOpenDemoInfoModal,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  const currentLangObj = LANGUAGES.find((l) => l.code === settings.language) || LANGUAGES[0];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-white text-[11px] py-1 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded text-[10px] uppercase tracking-wider">
              EPFO
            </span>
            <span className="text-slate-300 font-medium">
              Unified Member Portal • Digital Services Gateway
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {currentView !== 'loginView' && onOpenWhyModal && (
              <button
                id="header-why-btn"
                onClick={onOpenWhyModal}
                className="hover:text-amber-300 text-slate-300 transition-colors focus-visible:ring-1 focus-visible:ring-white rounded text-[11px] font-medium hidden sm:inline-flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help & Guides</span>
              </button>
            )}

            {currentView !== 'loginView' && onOpenDemoInfoModal && (
              <button
                id="header-demo-info-btn"
                onClick={onOpenDemoInfoModal}
                className="hover:text-amber-300 text-slate-300 transition-colors focus-visible:ring-1 focus-visible:ring-white rounded text-[11px] font-medium inline-flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" />
                <span>System Info</span>
              </button>
            )}

            {currentView !== 'loginView' && <span className="text-slate-600">|</span>}

            {/* Language Selector Dropdown */}

            <div className="relative">
              <button
                id="lang-select-btn"
                onClick={() => {
                  setShowLangMenu(!showLangMenu);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-1.5 text-slate-200 hover:text-amber-300 font-medium text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentLangObj.native}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <div
                  className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-slate-900"
                  onMouseLeave={() => setShowLangMenu(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Select Language / भाषा
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        settings.language === lang.code ? 'font-bold text-blue-700 bg-blue-50/70' : 'text-slate-700'
                      }`}
                    >
                      <span>{lang.native}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-slate-600">|</span>

            {/* Settings button */}
            <button
              id="header-settings-btn"
              onClick={() => onNavigate('settingsView')}
              className="flex items-center gap-1 hover:text-amber-300 text-slate-300 transition-colors text-[11px]"
              aria-label="Open Settings"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.settings}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar (Clean Screenshot Archetype) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Tabs */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Logo */}
          <button
            onClick={() => onNavigate(currentPersona ? 'dashboardView' : 'loginView')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none"
            id="brand-logo-btn"
          >
            {/* EPFO Sunburst Icon */}
            <div className="w-9 h-9 rounded-lg bg-slate-950 text-white flex items-center justify-center font-black shadow-xs">
              <div className="w-4 h-4 rounded-full border-2 border-amber-400 bg-slate-950 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-base tracking-tight text-slate-950 flex items-center gap-1.5">
                <span>NextGen</span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">EPFO</span>
              </div>
            </div>
          </button>

          {/* Navigation Links (Overview, Passbook, Claims, e-Nomination, Profile & KYC, Calculator) */}
          {currentPersona && (
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
              <button
                id="nav-tab-overview"
                onClick={() => onNavigate('dashboardView')}
                className={`px-3.5 py-1.5 rounded-md transition-all duration-150 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 ${
                  currentView === 'dashboardView'
                    ? 'bg-amber-100/70 text-slate-900 font-bold border border-amber-200/80 shadow-2xs'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {t.overview}
              </button>

              <button
                id="nav-tab-passbook"
                onClick={() => onNavigate('balanceView')}
                className={`px-3.5 py-1.5 rounded-md transition-all duration-150 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 ${
                  currentView === 'balanceView'
                    ? 'bg-amber-100/70 text-slate-900 font-bold border border-amber-200/80 shadow-2xs'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {t.passbook}
              </button>

              <button
                id="nav-tab-claims"
                onClick={() => onNavigate('claimDoctorView')}
                className={`px-3.5 py-1.5 rounded-md transition-all duration-150 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 ${
                  currentView === 'claimDoctorView' || currentView === 'trackingView'
                    ? 'bg-amber-100/70 text-slate-900 font-bold border border-amber-200/80 shadow-2xs'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {t.claims}
              </button>

              <button
                id="nav-tab-nomination"
                onClick={() => onNavigate('nominationView')}
                className={`px-3.5 py-1.5 rounded-md transition-all duration-150 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 ${
                  currentView === 'nominationView'
                    ? 'bg-amber-100/70 text-slate-900 font-bold border border-amber-200/80 shadow-2xs'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {t.eNomination}
              </button>

              <button
                id="nav-tab-profile"
                onClick={() => onNavigate('profileView')}
                className={`px-3.5 py-1.5 rounded-md transition-all duration-150 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 ${
                  currentView === 'profileView'
                    ? 'bg-amber-100/70 text-slate-900 font-bold border border-amber-200/80 shadow-2xs'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {t.profileKyc}
              </button>

              <button
                id="nav-tab-calculator"
                onClick={() => onNavigate('calculatorView')}
                className={`px-3.5 py-1.5 rounded-md transition-all duration-150 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 ${
                  currentView === 'calculatorView'
                    ? 'bg-amber-100/70 text-slate-900 font-bold border border-amber-200/80 shadow-2xs'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {t.calculator}
              </button>
            </nav>
          )}
        </div>

        {/* Right User Status & Actions */}
        <div className="flex items-center gap-3">
          {currentPersona ? (
            <>
              {/* Notification Bell */}
              <button
                id="header-notif-btn"
                onClick={() => onNavigate('claimDoctorView')}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {currentPersona.issues.filter((i) => !i.fixed).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {/* User Dropdown Profile Pill */}
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowLangMenu(false);
                  }}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  aria-label="User Account Menu"
                >
                  <div className="w-7 h-7 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center tracking-tight">
                    {getInitials(currentPersona.name)}
                  </div>
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                    {currentPersona.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-xs font-extrabold text-slate-900">{currentPersona.name}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">UAN: {currentPersona.uan}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{currentPersona.profile.employment.employer}</div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          onNavigate('profileView');
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Profile & KYC Details</span>
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('balanceView');
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Member Passbook</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          onNavigate('loginView');
                          setShowUserMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out / Switch Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Explicit SIGN OUT button from screenshot */}
              <button
                id="header-signout-btn"
                onClick={() => onNavigate('loginView')}
                className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 px-2.5 py-1.5 rounded transition-colors uppercase tracking-wider text-[11px]"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.signOut}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate('loginView')}
              className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              Sign In with UAN
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
