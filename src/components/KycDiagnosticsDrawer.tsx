import React, { useState } from 'react';
import { Persona } from '../types';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Download,
  Building,
  CreditCard,
  Calendar,
  Lock,
  FileText,
  UserCheck,
} from 'lucide-react';
import { downloadJointDeclarationFile } from '../utils/documentGenerator';

interface KycDiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: Persona;
  onApplyFixes: () => Promise<void>;
  onNavigate?: (view: any) => void;
  onShowToast?: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const KycDiagnosticsDrawer: React.FC<KycDiagnosticsDrawerProps> = ({
  isOpen,
  onClose,
  currentPersona,
  onApplyFixes,
  onNavigate,
  onShowToast,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [showHardBlocker, setShowHardBlocker] = useState(false);

  if (!isOpen) return null;

  const isAccountC = currentPersona.id === 'account-c' || currentPersona.id === 'meena-rejected';
  const isAccountA = currentPersona.id === 'account-a' || currentPersona.id === 'asha-clean';

  const handleApplyClick = async () => {
    setIsApplying(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsApplying(false);

    if (isAccountC) {
      setShowHardBlocker(true);
      if (onShowToast) {
        onShowToast(
          'Online Fix Blocked',
          'Discrepancy requires physical Joint Declaration and regional field office verification.',
          'error'
        );
      }
    } else {
      await onApplyFixes();
      if (onShowToast) {
        onShowToast(
          'All Fixes Applied Successfully',
          'PAN seeded, Bank IFSC updated, and Date of Exit self-marked.',
          'success'
        );
      }
      onClose();
    }
  };

  const handleDownloadJointDec = () => {
    downloadJointDeclarationFile(currentPersona);
    if (onShowToast) {
      onShowToast('Downloaded', 'Pre-filled Joint Declaration Form generated.', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                KYC Diagnostics &amp; One-Click Auto-Fix Engine
              </h2>
              <p className="text-xs text-slate-400">
                Official discrepancy resolution &amp; source ledger reconciliation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs font-sans">
          
          {/* Member Badge & Scenario summary */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                {currentPersona.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-slate-900">{currentPersona.name}</div>
                <div className="font-mono text-[11px] text-slate-500">UAN: {currentPersona.uan}</div>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wide border ${
              isAccountA
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : isAccountC
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}>
              {isAccountA ? '100% Validated' : isAccountC ? 'Critical Gating Blocker' : 'Amber (Fixable via DigiLocker)'}
            </div>
          </div>

          {/* HARD BLOCKER VIEW FOR ACCOUNT 3 */}
          {showHardBlocker ? (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 space-y-4 text-rose-950">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                    Hard Blocker Enforced
                  </span>
                  <h3 className="text-sm font-extrabold text-rose-950 mt-1">
                    Automated Online Fix Failed
                  </h3>
                  <p className="text-xs text-rose-800 mt-1">
                    Discrepancy requires physical Joint Declaration and regional field office verification.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-2 text-slate-800">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Why Online Automated Fix Cannot Settle This:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 leading-relaxed pl-1">
                  <li>
                    <strong>DOB Mismatch &gt; 3 Years:</strong> EPFO master records have DOB <code>15/06/1986</code> while Aadhaar has <code>10/01/1982</code> (Difference: 4.5 Yrs). EPFO SOP caps automated OTP corrections at 3 years.
                  </li>
                  <li>
                    <strong>Overlapping Service:</strong> Dual active concurrent ECR contributions recorded simultaneously across 2 active establishments.
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleDownloadJointDec}
                  className="w-full inline-flex items-center justify-center gap-2 bg-rose-700 hover:bg-rose-800 text-white font-bold py-3 px-4 rounded-xl shadow-xs text-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Pre-Filled Physical Joint Declaration Form</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 text-center">
                * Proceed to Claim Submission remains disabled until Field Office validates physical Joint Declaration.
              </div>
            </div>
          ) : (
            <>
              {/* Diff Columns: Current Flawed EPFO vs Verified Source Record */}
              <div className="space-y-4">
                
                {/* 1. PAN Seeding Diagnostic */}
                <div className="bg-stone-50/90 border border-stone-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-stone-200 pb-2">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      1. Income Tax PAN Linkage
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      Section 192A Rule
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                      <div className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Current EPFO Record
                      </div>
                      <div className="font-mono font-bold text-rose-950">
                        {currentPersona.profile.pan || 'NOT SEEDED (Missing)'}
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Source Record
                      </div>
                      <div className="font-mono font-bold text-emerald-950">
                        ABCDE5566P (ITD / DigiLocker)
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                    <strong>Diagnostic Reasoning:</strong> Unseeded PAN triggers penal 34.608% TDS on withdrawals &gt; ₹50,000. DigiLocker pulls verified PAN directly from NSDL/ITD.
                  </p>
                </div>

                {/* 2. Bank IFSC Merged Diagnostic */}
                <div className="bg-stone-50/90 border border-stone-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-stone-200 pb-2">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      2. Bank Account &amp; Active IFSC Mapping
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      NPCI Gateway
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                      <div className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Current EPFO Record
                      </div>
                      <div className="font-mono font-bold text-rose-950">
                        {currentPersona.profile.ifsc} (Defunct Horizon National Bank)
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Source Record
                      </div>
                      <div className="font-mono font-bold text-emerald-950">
                        ZNTH0000123 (Zenith United Bank Live)
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                    <strong>Diagnostic Reasoning:</strong> Old Horizon National Bank IFSC HORZ0000123 will bounce. Auto-mapping to Zenith United Bank ZNTH0000123 via RBI directory.
                  </p>
                </div>

                {/* 3. Date of Exit (DOE) Diagnostic */}
                <div className="bg-stone-50/90 border border-stone-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-stone-200 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      3. Date of Exit (DOE) in Service ECR
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      Self-Mark Utility
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                      <div className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Current EPFO Record
                      </div>
                      <div className="font-mono font-bold text-rose-950">
                        {currentPersona.profile.employment.doe || 'NOT MARKED (Active Service)'}
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Source Record
                      </div>
                      <div className="font-mono font-bold text-emerald-950">
                        30-Apr-2024 (Last ECR Wage Month)
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                    <strong>Diagnostic Reasoning:</strong> Employer did not mark DOE. Member self-exit utility initiated via Aadhaar OTP.
                  </p>
                </div>

              </div>

              {/* Action Button */}
              <div className="pt-3">
                <button
                  id="btn-apply-verified-fixes"
                  onClick={handleApplyClick}
                  disabled={isApplying}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-md text-xs hover:ring-2 hover:ring-amber-400/80 transition-all cursor-pointer"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Reconciling &amp; Applying Verified Ledger Fixes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Apply Verified Fixes (1-Click Auto-Fix)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
