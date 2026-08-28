import React from 'react';
import { Modal } from './Modal';
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  Layers,
  Cpu,
  UserCheck,
  FileText,
  Info,
} from 'lucide-react';

interface WhyPrototypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhyPrototypeModal: React.FC<WhyPrototypeModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Why this prototype?" maxWidth="lg">
      <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
        <p>
          EPFO manages provident fund, pension, and insurance for millions of organized-sector workers. But many citizens face portal instability, complex login, KYC mismatches, unclear rejection reasons, and delayed grievance resolution.
        </p>
        <p>
          Claim rejection is a major problem. Final settlement claim rejection rose from around 13% in 2017-18 to about 34% in 2022-23. Many rejections are caused by preventable issues such as name mismatch, date of birth mismatch, missing employer exit date, unverified bank account, and incomplete service history.
        </p>
        <p>
          Users often discover errors only after submission. Rejection reasons can be vague, such as “insufficient service”, while the real issue may be a hidden KYC or employer record problem.
        </p>
        <p>
          This prototype reimagines the experience by checking claims before submission, explaining issues in simple language, and guiding users toward fixes.
        </p>

        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Disclaimer:</strong> This is a hackathon prototype using synthetic data. It is not the official EPFO portal.
          </span>
        </div>
      </div>
    </Modal>
  );
};

interface DemoInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoInfoModal: React.FC<DemoInfoModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hackathon Demo & System Information" maxWidth="xl">
      <div className="space-y-6 text-xs text-slate-700 leading-relaxed max-h-[75vh] overflow-y-auto pr-1">
        {/* Project Header */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
              Citizen-First Innovation
            </div>
            <h3 className="text-base font-extrabold text-blue-950">
              NextGen EPFO — EPFO Claim Portal
            </h3>
            <p className="text-xs text-blue-900/80 mt-0.5">
              Automated pre-submission diagnostics, DigiLocker auto-fill, and conversational AI guidance.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-blue-700 text-white rounded-lg shrink-0 self-start sm:self-auto">
            EPFO System
          </span>
        </div>

        {/* Problem vs Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80">
            <h4 className="font-bold text-rose-900 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>The Problem</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
              <li>Claim rejection rates escalated to ~34% in 2022-23.</li>
              <li>Silent KYC & name discrepancies cause surprise rejections.</li>
              <li>Vague rejection remarks (e.g. "insufficient service").</li>
              <li>Employer exit date delays leave citizens stranded.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>The Solution</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
              <li>Pre-submission EPFO Claim Diagnostics with Readiness Score.</li>
              <li>Sample DigiLocker auto-fill & cross-verification.</li>
              <li>1-click auto-fix & employer reminder generation.</li>
              <li>PF Sahayak assistant with voice & optional GPT API.</li>
            </ul>
          </div>
        </div>

        {/* Demo Accounts */}
        <div>
          <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Interactive Demo Accounts (Pre-configured Personas)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="font-bold text-slate-900 text-xs">1. Asha Kumar</div>
              <div className="text-[10px] text-emerald-700 font-bold">Clean Record (98%)</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">UAN: 100000000001</div>
              <div className="text-[11px] text-slate-600 mt-1">
                Zero issues. Ready to submit 1-click claim.
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="font-bold text-slate-900 text-xs">2. Ravi Verma</div>
              <div className="text-[10px] text-amber-700 font-bold">KYC Issues (58%)</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">UAN: 100000000002</div>
              <div className="text-[11px] text-slate-600 mt-1">
                Name mismatch, unverified bank, missing exit date.
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="font-bold text-slate-900 text-xs">3. Meena Iyer</div>
              <div className="text-[10px] text-rose-700 font-bold">Rejected Claim (66%)</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">UAN: 100000000003</div>
              <div className="text-[11px] text-slate-600 mt-1">
                Vague "insufficient service" rejection clarification.
              </div>
            </div>
          </div>
        </div>

        {/* Real vs Mocked Breakdown */}
        <div className="border-t border-slate-100 pt-4">
          <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>What is Real and What is Mocked?</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div className="font-bold text-emerald-800 text-xs mb-2 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Real in this Prototype:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                <li>User interface & responsive layout</li>
                <li>Single-page view navigation</li>
                <li>Claim readiness diagnostic algorithm</li>
                <li>Local issue detection & score progression</li>
                <li>Rule-based PF Sahayak assistant</li>
                <li>Mathematical PF withdrawal calculator</li>
                <li>Grievance letter generator</li>
                <li>Voice speech recognition & read-aloud</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div className="font-bold text-amber-800 text-xs mb-2 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                <span>Mocked in this Prototype:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                <li>Live EPFO database backend</li>
                <li>Government login / real OTP systems</li>
                <li>DigiLocker live API token exchange</li>
                <li>Real OCR document scanner</li>
                <li>Bank account IFSC verification</li>
                <li>Aadhaar/PAN live validation</li>
                <li>Actual employer SMS/Email dispatch</li>
                <li>Live claim submission to Field Offices</li>
              </ul>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic mt-2">
            All personal information shown here is synthetic and for demonstration only.
          </p>
        </div>

        {/* AI Capabilities */}
        <div className="border-t border-slate-100 pt-4">
          <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI & Assistant Architecture</span>
          </h4>
          <p className="text-xs text-slate-600">
            <strong>PF Sahayak</strong> functions with a triple-mode architecture: <strong>Local Demo Mode</strong> (instant, free, offline rule-based matches), <strong>GPT Assist Mode</strong> (optional conversational AI via user’s own API key stored locally in browser), and <strong>Automatic Fallback</strong> (safeguards against token budget limits or network drops).
          </p>
        </div>
      </div>
    </Modal>
  );
};
