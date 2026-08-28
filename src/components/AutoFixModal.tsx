import React, { useState, useEffect } from 'react';
import { Persona } from '../types';
import { MockBackend } from '../services/mockBackend';
import {
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Building2,
  FileCheck,
  CreditCard,
  UserCheck,
  ArrowRight,
  RefreshCw,
  X,
  ShieldAlert,
  Fingerprint,
} from 'lucide-react';

interface AutoFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: Persona;
  onSuccess: () => Promise<void> | void;
  onShowToast?: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AutoFixModal: React.FC<AutoFixModalProps> = ({
  isOpen,
  onClose,
  currentPersona,
  onSuccess,
  onShowToast,
}) => {
  const [stage, setStage] = useState<number>(0); // 0: intro, 1: matching official, 2: matching bank, 3: service sync, 4: complete
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isInsolvent = currentPersona.id === 'account-c' || currentPersona.id === 'meena-rejected';

  useEffect(() => {
    if (isOpen) {
      setStage(0);
      setIsRunning(false);
      setIsCompleted(false);
      setErrorMessage(null);
    }
  }, [isOpen, currentPersona.id]);

  if (!isOpen) return null;

  const handleStartAutoFix = async () => {
    setIsRunning(true);
    setStage(1);
    setErrorMessage(null);

    if (isInsolvent) {
      setTimeout(() => {
        setIsRunning(false);
        setErrorMessage(
          'Automated Online Fix Gated: Insolvent Private PF Trust requires physical Joint Declaration and regional RPFC legal claims.'
        );
      }, 1200);
      return;
    }

    // Step 1: Matching Official Details (Aadhaar & PAN)
    setTimeout(() => {
      setStage(2);
    }, 900);

    // Step 2: Matching Bank Details (NPCI & IFSC Migration)
    setTimeout(() => {
      setStage(3);
    }, 1900);

    // Step 3: Service Ledger & Exit Date
    setTimeout(() => {
      setStage(4);
    }, 2800);

    // Step 4: Finalizing & Saving
    setTimeout(async () => {
      try {
        await MockBackend.autoFixIssues(currentPersona.id);
        await onSuccess();
        setIsCompleted(true);
        setIsRunning(false);
        if (onShowToast) {
          onShowToast(
            'KYC Auto-Fix Complete',
            'Official Identity & Bank records 100% matched and reconciled.',
            'success'
          );
        }
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err?.message || 'Failed to apply automated fixes.');
        setIsRunning(false);
      }
    }, 3600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden font-sans">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                <span>Autonomous KYC Reconciler</span>
              </div>
              <h2 className="text-base font-extrabold text-white">
                Auto-Fix KYC Issues &amp; Reconcile Records
              </h2>
            </div>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          
          {/* Member Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                {currentPersona.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-slate-900">{currentPersona.name}</div>
                <div className="text-[11px] font-mono text-slate-500">UAN: {currentPersona.uan}</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                isCompleted || currentPersona.claimReadiness === 100
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {isCompleted || currentPersona.claimReadiness === 100 ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>100% Ready</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Fixable KYC Issues Detected</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Hard blocker notice for Account C */}
          {isInsolvent && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 text-rose-950 space-y-2">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-rose-900">Insolvent Private PF Trust Record</h4>
                  <p className="text-[11px] text-rose-700 leading-relaxed mt-1">
                    Automated online fixes are disabled for exempted insolvent trusts. This record requires manual Joint Declaration submission and direct RPFC legal insolvency claim processing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ANIMATED MATCHING PIPELINE */}
          {!isInsolvent && (
            <div className="space-y-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Matching &amp; Verification Pipeline</span>
                {isRunning && (
                  <span className="inline-flex items-center gap-1.5 text-blue-700 font-bold normal-case">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Reconciling records...</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Official Details Card */}
                <div className={`p-4 rounded-xl border transition-all ${
                  stage >= 2 || isCompleted
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : stage === 1
                    ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/30'
                    : 'bg-stone-50 border-stone-200 opacity-60'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-slate-700" />
                      <span className="font-extrabold text-slate-900 text-xs">Official Govt Identity</span>
                    </div>
                    {stage >= 2 || isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3" /> MATCHED
                      </span>
                    ) : stage === 1 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Checking UIDAI...
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Pending</span>
                    )}
                  </div>
                  <ul className="space-y-1.5 text-[11px]">
                    <li className="flex items-center justify-between">
                      <span className="text-slate-600">UIDAI Aadhaar Name:</span>
                      <span className="font-semibold text-slate-900">{currentPersona.name}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-600">Income Tax PAN:</span>
                      <span className={`font-mono font-bold ${stage >= 2 || isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {stage >= 2 || isCompleted ? 'ABCDE5566P (Seeded)' : 'Pending Link'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-600">TDS Category:</span>
                      <span className="font-semibold text-emerald-700">0% Exemption Active</span>
                    </li>
                  </ul>
                </div>

                {/* 2. Bank Details Card */}
                <div className={`p-4 rounded-xl border transition-all ${
                  stage >= 3 || isCompleted
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : stage === 2
                    ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/30'
                    : 'bg-stone-50 border-stone-200 opacity-60'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-700" />
                      <span className="font-extrabold text-slate-900 text-xs">Bank &amp; NPCI Clearing</span>
                    </div>
                    {stage >= 3 || isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3" /> VERIFIED
                      </span>
                    ) : stage === 2 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" /> NPCI Ping...
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Pending</span>
                    )}
                  </div>
                  <ul className="space-y-1.5 text-[11px]">
                    <li className="flex items-center justify-between">
                      <span className="text-slate-600">Target IFSC:</span>
                      <span className={`font-mono font-bold ${stage >= 3 || isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {stage >= 3 || isCompleted ? 'ZNTH0000123 (Active)' : 'HORZ0000123 (Defunct)'}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-600">Bank Entity:</span>
                      <span className="font-semibold text-slate-900">Zenith United Bank (Merged)</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-600">Penny-Drop Match:</span>
                      <span className="font-semibold text-emerald-700">100% Name Match</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 3. Service Ledger Summary */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                stage >= 4 || isCompleted
                  ? 'bg-emerald-50/50 border-emerald-300'
                  : 'bg-stone-50 border-stone-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-slate-700" />
                    <span className="font-bold text-slate-900">EPFO Service Ledger:</span>
                    <span className="text-slate-600">Date of Exit marked as <strong className="text-slate-900">30-Apr-2024</strong> (Self-Exit Validated)</span>
                  </div>
                  {stage >= 4 || isCompleted ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      SYNCHRONIZED
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Pending</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success state overview */}
          {isCompleted && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 flex items-center justify-between animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs">All Discrepancies Resolved</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Official PAN seeded, defunct IFSC upgraded, and claim readiness restored to 100%.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-black text-emerald-700">100%</span>
                <span className="block text-[9px] font-bold text-emerald-800 uppercase">Readiness</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {isCompleted
              ? '✅ Ready for online claim submission.'
              : '⚡ Resolves KYC errors autonomously without paper forms.'}
          </div>

          <div className="flex items-center gap-2">
            {!isCompleted ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isRunning}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-execute-autofix"
                  onClick={handleStartAutoFix}
                  disabled={isRunning || isInsolvent}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Matching &amp; Fixing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      <span>Auto-Fix Issues (1-Click)</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                id="btn-close-autofix-complete"
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              >
                <span>Done • Return to Portal</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
