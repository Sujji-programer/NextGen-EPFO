/**
 * NextGen EPFO — EPFO Claim Portal
 * Citizen-Facing Application for PF Claims & Rejection Diagnostics
 */

import React, { useState, useEffect } from 'react';
import { ViewName, Persona, AppSettings, PresetClaimData } from './types';
import { MockBackend } from './services/mockBackend';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AssistantDrawer } from './components/AssistantDrawer';
import { WhyPrototypeModal, DemoInfoModal } from './components/InfoModals';
import { Bot } from 'lucide-react';

import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { ClaimDoctorView } from './views/ClaimDoctorView';
import { BalanceView } from './views/BalanceView';
import { TransferView } from './views/TransferView';
import { TrackingView } from './views/TrackingView';
import { ProfileView } from './views/ProfileView';
import { GrievanceView } from './views/GrievanceView';
import { CalculatorView } from './views/CalculatorView';
import { NominationView } from './views/NominationView';
import { AssistantView } from './views/AssistantView';
import { SettingsView } from './views/SettingsView';

const STORAGE_KEYS = {
  SETTINGS: 'epfoClaimDoctor_settings',
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewName>('loginView');
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [personas, setPersonas] = useState<Record<string, Persona>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);
  const [isDemoInfoModalOpen, setIsDemoInfoModalOpen] = useState(false);
  const [presetClaimData, setPresetClaimData] = useState<PresetClaimData | null>(null);


  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      language: 'en',
      fontSize: 'normal',
      highContrast: false,
      readAloud: false,
      gpt: {
        enabled: false,
        apiKey: '',
        model: 'gpt-4o-mini',
        maxTokens: 120,
        tokenBudget: 5000,
        tokensUsed: 0,
      },
    };
  });

  // Toast Helper
  const showToast = (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Data Load — Always start logged out on first landing
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const pA = await MockBackend.getCurrentPersona('account-a');
        const pB = await MockBackend.getCurrentPersona('account-b');
        const pC = await MockBackend.getCurrentPersona('account-c');

        const dict: Record<string, Persona> = {
          'account-a': pA,
          'account-b': pB,
          'account-c': pC,
          'asha-clean': pA,
          'ravi-issues': pB,
          'meena-rejected': pC,
        };
        setPersonas(dict);

        // Always show the logged-out Unified Member Portal landing page first
        setCurrentPersona(null);
        setCurrentView('loginView');
      } catch (e) {
        console.error('Failed loading personas', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitial();
  }, []);

  // Scroll to top upon any view navigation
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentView]);

  // Save settings change
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    });
    showToast('Settings Updated', 'Preferences applied successfully.', 'info');
  };

  // Navigation dispatcher
  const showView = async (viewName: ViewName) => {
    if (viewName === 'loginView') {
      MockBackend.resetDemoData();
      setCurrentPersona(null);
      setPresetClaimData(null);
      // Reload fresh personas list
      const pA = await MockBackend.getCurrentPersona('account-a');
      const pB = await MockBackend.getCurrentPersona('account-b');
      const pC = await MockBackend.getCurrentPersona('account-c');
      setPersonas({
        'account-a': pA,
        'account-b': pB,
        'account-c': pC,
        'asha-clean': pA,
        'ravi-issues': pB,
        'meena-rejected': pC,
      });
      showToast('Logged Out', 'Demo environment and 3 test accounts reset to factory state.', 'info');
    }
    setCurrentView(viewName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Persona Selection & Clean State Reset
  const handleSelectPersona = async (personaId: string) => {
    // Clear any active claim drafts, presets, and previous account caches
    setPresetClaimData(null);
    try {
      localStorage.removeItem('epfoClaimDoctor_claim');
      localStorage.removeItem('epfoClaimDoctor_assistant');
    } catch {
      // ignore
    }

    MockBackend.setSelectedPersonaId(personaId);
    const persona = await MockBackend.getCurrentPersona(personaId);
    setCurrentPersona(persona);
    setCurrentView('dashboardView');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    showToast(`Signed In as ${persona.name}`, `Loaded account overview (${persona.label}).`, 'info');
  };

  const handleRefreshPersona = async () => {
    if (!currentPersona) return;
    const persona = await MockBackend.getCurrentPersona(currentPersona.id);
    setCurrentPersona(persona);
    setPersonas((prev) => ({
      ...prev,
      [persona.id]: persona,
    }));
  };

  // Issue Fix Handler
  const handleFixIssue = async (issueId: string) => {
    if (!currentPersona) return;
    const res = await MockBackend.fixIssue(currentPersona.id, issueId);
    setCurrentPersona(res.persona);
    setPersonas((prev) => ({
      ...prev,
      [res.persona.id]: res.persona,
    }));
    showToast(
      'Issue Resolved & Synced',
      `Claim Readiness Score increased to ${res.newReadiness}%!`,
      'success'
    );
  };

  // Claim Submit Handler
  const handleSubmitClaim = async (claimType: string) => {
    if (!currentPersona) return;
    const res = await MockBackend.submitClaim(currentPersona.id, claimType);
    const updated = await MockBackend.getCurrentPersona(currentPersona.id);
    setCurrentPersona(updated);
    setPersonas((prev) => ({
      ...prev,
      [updated.id]: updated,
    }));
    showToast(
      'Claim Successfully Submitted',
      `Reference ID: ${res.trackingId}. Dispatched to Field Office scrutiny.`,
      'success'
    );
  };

  // Transfer Account Handler
  const handleTransferAccount = async (memberId: string) => {
    if (!currentPersona) throw new Error('No persona');
    const res = await MockBackend.transferOldAccount(currentPersona.id, memberId);
    const updated = await MockBackend.getCurrentPersona(currentPersona.id);
    setCurrentPersona(updated);
    setPersonas((prev) => ({
      ...prev,
      [updated.id]: updated,
    }));
    return res;
  };

  // Reset Demo Data
  const handleResetDemoData = async () => {
    MockBackend.resetDemoData();
    const pAsha = await MockBackend.getCurrentPersona('asha-clean');
    const pRavi = await MockBackend.getCurrentPersona('ravi-issues');
    const pMeena = await MockBackend.getCurrentPersona('meena-rejected');

    const dict: Record<string, Persona> = {
      'asha-clean': pAsha,
      'ravi-issues': pRavi,
      'meena-rejected': pMeena,
    };
    setPersonas(dict);
    const activeId = MockBackend.getSelectedPersonaId();
    setCurrentPersona(dict[activeId] || dict['asha-clean']);
  };

  // Font Size class mapping
  const fontSizeClass = {
    small: 'text-xs',
    normal: 'text-sm',
    large: 'text-base',
  }[settings.fontSize];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-bold text-slate-700">Loading Next-Gen EPFO Prototype...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-150 ${
        settings.highContrast
          ? 'bg-slate-200 text-black font-sans contrast-125'
          : 'bg-slate-100 text-slate-900 font-sans'
      } ${fontSizeClass}`}
    >
      {/* Header */}
      <Header
        currentView={currentView}
        onNavigate={showView}
        currentPersona={currentPersona}
        settings={settings}
        onLanguageChange={(lang) => handleUpdateSettings({ language: lang })}
        onOpenWhyModal={() => setIsWhyModalOpen(true)}
        onOpenDemoInfoModal={() => setIsDemoInfoModalOpen(true)}
      />

      {/* Main Multi-View Router Container */}
      <main className="flex-1">
        {currentView === 'loginView' && (
          <LoginView
            personas={personas}
            onSelectPersona={handleSelectPersona}
            onNavigate={showView}
            onOpenWhyModal={() => setIsWhyModalOpen(true)}
            onOpenDemoInfoModal={() => setIsDemoInfoModalOpen(true)}
            settings={settings}
            onLanguageChange={(lang) => handleUpdateSettings({ language: lang })}
          />
        )}

        {currentView === 'dashboardView' && currentPersona && (
          <DashboardView
            currentPersona={currentPersona}
            onNavigate={showView}
            settings={settings}
          />
        )}

        {currentView === 'claimDoctorView' && currentPersona && (
          <ClaimDoctorView
            currentPersona={currentPersona}
            onNavigate={showView}
            onFixIssue={handleFixIssue}
            onSubmitClaim={handleSubmitClaim}
            onSelectPersona={handleSelectPersona}
            onRefreshPersona={handleRefreshPersona}
            settings={settings}
            onShowToast={showToast}
            presetClaimData={presetClaimData}
            onClearPresetClaimData={() => setPresetClaimData(null)}
          />
        )}

        {currentView === 'balanceView' && currentPersona && (
          <BalanceView
            currentPersona={currentPersona}
            onNavigate={showView}
            settings={settings}
            onShowToast={showToast}
          />
        )}

        {currentView === 'transferView' && currentPersona && (
          <TransferView
            currentPersona={currentPersona}
            onNavigate={showView}
            onTransferAccount={handleTransferAccount}
            settings={settings}
            onShowToast={showToast}
          />
        )}

        {currentView === 'trackingView' && currentPersona && (
          <TrackingView
            currentPersona={currentPersona}
            onNavigate={showView}
            settings={settings}
          />
        )}

        {currentView === 'profileView' && currentPersona && (
          <ProfileView
            currentPersona={currentPersona}
            onNavigate={showView}
            onFixIssue={handleFixIssue}
            onSelectPersona={handleSelectPersona}
            onRefreshPersona={handleRefreshPersona}
            settings={settings}
            onShowToast={showToast}
          />
        )}

        {currentView === 'grievanceView' && currentPersona && (
          <GrievanceView
            currentPersona={currentPersona}
            onNavigate={showView}
            settings={settings}
            onShowToast={showToast}
          />
        )}

        {currentView === 'calculatorView' && currentPersona && (
          <CalculatorView
            currentPersona={currentPersona}
            onNavigate={showView}
            settings={settings}
            onShowToast={showToast}
            onApplyClaim={(preset) => {
              setPresetClaimData(preset);
              showView('claimDoctorView');
            }}
          />
        )}

        {currentView === 'nominationView' && currentPersona && (
          <NominationView

            currentPersona={currentPersona}
            onNavigate={showView}
            settings={settings}
            onShowToast={showToast}
          />
        )}

        {currentView === 'assistantView' && currentPersona && (
          <AssistantView
            currentPersona={currentPersona}
            onNavigate={showView}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {currentView === 'settingsView' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetDemoData={handleResetDemoData}
            onNavigate={showView}
            onShowToast={showToast}
            onOpenWhyModal={() => setIsWhyModalOpen(true)}
            onOpenDemoInfoModal={() => setIsDemoInfoModalOpen(true)}
          />
        )}
      </main>

      {/* Global Floating Assistant Action Button */}
      {currentView !== 'assistantView' && (
        <aside aria-label="gpt Help AI Assistant" className="fixed bottom-6 right-6 z-40">
          <button
            id="btn-global-assistant-fab"
            onClick={() => setIsAssistantOpen(true)}
            className="group inline-flex items-center gap-2.5 bg-slate-950 hover:bg-slate-900 text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl border border-slate-700/80 hover:border-amber-400 hover:ring-2 hover:ring-amber-400/80 transition-all transform hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            title="Open gpt Help (AI Voice & EPFO Rules Assistant)"
            aria-label="Open gpt Help Assistant"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4 text-amber-300" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs font-black tracking-tight text-white">gpt Help</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings.gpt?.enabled && settings.gpt?.apiKey
                      ? 'bg-purple-400 animate-pulse'
                      : 'bg-emerald-400'
                  }`}
                />
              </div>
              <span className="text-[10px] text-slate-300 font-medium leading-tight">
                {settings.gpt?.enabled && settings.gpt?.apiKey ? 'AI Assistant' : 'Powered by OpenAI'}
              </span>
            </div>
          </button>
        </aside>
      )}

      {/* Global Assistant Drawer */}
      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        currentPersona={currentPersona}
        onNavigate={showView}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Global Modals */}
      <WhyPrototypeModal
        isOpen={isWhyModalOpen}
        onClose={() => setIsWhyModalOpen(false)}
      />
      <DemoInfoModal
        isOpen={isDemoInfoModalOpen}
        onClose={() => setIsDemoInfoModalOpen(false)}
      />

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <Footer
        onOpenWhyModal={() => setIsWhyModalOpen(true)}
        onOpenDemoInfoModal={() => setIsDemoInfoModalOpen(true)}
      />
    </div>
  );
}
