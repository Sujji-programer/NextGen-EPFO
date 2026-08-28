import React, { useState, useEffect } from 'react';
import { ViewName, Persona, AppSettings } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { MockBackend } from '../services/mockBackend';
import {
  FileText,
  ArrowLeft,
  Copy,
  Check,
  Building,
  Sparkles,
  Send,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

interface GrievanceViewProps {
  currentPersona: Persona;
  onNavigate: (view: ViewName) => void;
  settings: AppSettings;
  onShowToast: (title: string, message: string) => void;
}

export const GrievanceView: React.FC<GrievanceViewProps> = ({
  currentPersona,
  onNavigate,
  onShowToast,
}) => {
  const [draft, setDraft] = useState<{
    subject: string;
    body: string;
    category: string;
    recommendedOffice: string;
  }>({
    subject: '',
    body: '',
    category: '',
    recommendedOffice: '',
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    MockBackend.getGrievanceDraft(currentPersona.id).then((res) => {
      if (mounted) {
        setDraft(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [currentPersona.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`);
    } catch (e) {
      // fallback
    }
    setCopied(true);
    onShowToast('Grievance Draft Copied', 'The text has been copied to your clipboard for submission on EPFiGMS.');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <Breadcrumbs currentView="grievanceView" onNavigate={onNavigate} />

      {/* Header with Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => onNavigate('dashboardView')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 mb-2 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Raise Grievance (EPFiGMS Helper)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Automated plain-language grievance drafts formatted for official EPFO grievance redressal
              </p>
            </div>
          </div>
        </div>

        <button
          id="btn-copy-grievance-draft"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors text-xs"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy Draft'}</span>
        </button>
      </div>

      {/* Contextual Card */}
      <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-5 mb-6 text-xs text-orange-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-sm">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span>AI Grievance Assistant: Tailored for {currentPersona.name}</span>
          </div>
          <p className="text-orange-900">
            Recommended Category: <strong>{draft.category}</strong> • Target Office: <strong>{draft.recommendedOffice}</strong>
          </p>
        </div>
      </div>

      {/* Draft Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Grievance Subject:
          </label>
          <input
            type="text"
            readOnly
            value={loading ? 'Generating draft...' : draft.subject}
            className="w-full text-xs font-semibold p-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Auto-Filled Synthetic Grievance Letter:
          </label>
          <textarea
            rows={14}
            value={loading ? 'Preparing personalized grievance petition...' : draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            className="w-full text-xs font-mono p-4 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 leading-relaxed resize-y"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>You can edit this draft before copying or submitting to EPFiGMS.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Draft</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
