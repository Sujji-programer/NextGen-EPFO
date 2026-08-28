import React, { useState } from 'react';
import { ViewName, Persona, AppSettings, MandatoryKycCheck } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { MockBackend } from '../services/mockBackend';
import { AutoFixModal } from '../components/AutoFixModal';
import { DigiLockerChequeWidget } from '../components/DigiLockerChequeWidget';
import {
  UserCheck,
  ArrowLeft,
  ShieldCheck,
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  FileText,
  UserPlus,
  ArrowRight,
  Lock,
  Unlock,
  Check,
  X,
  Printer,
  KeyRound,
  ExternalLink,
  ShieldAlert,
  Clock,
  Download,
} from 'lucide-react';

interface ProfileViewProps {
  currentPersona: Persona;
  onNavigate: (view: ViewName) => void;
  onFixIssue: (issueId: string) => Promise<void>;
  onSelectPersona?: (personaId: string) => void;
  onRefreshPersona?: () => Promise<void>;
  settings: AppSettings;
  onShowToast?: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentPersona,
  onNavigate,
  onFixIssue,
  onSelectPersona,
  onRefreshPersona,
  settings,
  onShowToast,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const p = currentPersona.profile;

  // Global blank profile state until user clicks DigiLocker autofill
  const [isProfileAutofilled, setIsProfileAutofilled] = useState<boolean>(false);

  // Automatically reset blank profile security state whenever persona switches
  React.useEffect(() => {
    setIsProfileAutofilled(false);
  }, [currentPersona.id]);

  // Active step progress tracking
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Manual Edit Drawer/Modal State
  const [showManualEditModal, setShowManualEditModal] = useState<boolean>(false);
  const [manualPan, setManualPan] = useState<string>(p.pan || '');
  const [manualIfsc, setManualIfsc] = useState<string>(p.ifsc || '');
  const [manualAccount, setManualAccount] = useState<string>(p.fullAccountNumber || '');

  // Self-Mark Date of Exit Drawer State
  const [showDoeModal, setShowDoeModal] = useState<boolean>(false);
  const [doeDate, setDoeDate] = useState<string>('2024-04-15');
  const [doeReason, setDoeReason] = useState<string>('Cessation (Short Service / Resignation)');
  const [doeOtpRequested, setDoeOtpRequested] = useState<boolean>(false);
  const [doeOtp, setDoeOtp] = useState<string>('');
  const [isMarkingDoe, setIsMarkingDoe] = useState<boolean>(false);

  // Auto-Fix Modal State
  const [showAutoFixModal, setShowAutoFixModal] = useState<boolean>(false);

  // DigiLocker OAuth & Animation State
  const [showDigiLockerModal, setShowDigiLockerModal] = useState<boolean>(false);
  const [isDigiLockerRunning, setIsDigiLockerRunning] = useState<boolean>(false);
  const [digiLockerStep, setDigiLockerStep] = useState<number>(0);
  const [digiLockerStatus, setDigiLockerStatus] = useState<string>('');
  const [digiLockerFilledDetails, setDigiLockerFilledDetails] = useState<{
    pan?: string;
    aadhaarName?: string;
    bankIfsc?: string;
    bankName?: string;
  } | null>(null);

  // Joint Declaration PDF Preview Modal State
  const [showJointDeclarationModal, setShowJointDeclarationModal] = useState<boolean>(false);

  // Single Check Fixing State
  const [fixingCheckId, setFixingCheckId] = useState<string | null>(null);

  const handleFixSingleCheck = async (checkId: string) => {
    setFixingCheckId(checkId);
    try {
      const res = await MockBackend.fixSingleCheck(currentPersona.id, checkId);
      if (onRefreshPersona) {
        await onRefreshPersona();
      }
      if (onShowToast) {
        onShowToast('KYC Issue Resolved', res.message, 'success');
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast('Error', err?.message || 'Failed to resolve check.', 'error');
      }
    } finally {
      setFixingCheckId(null);
    }
  };

  // Mandatory KYC Checks
  const checks: MandatoryKycCheck[] = (currentPersona.mandatoryChecks && currentPersona.mandatoryChecks.length > 0)
    ? currentPersona.mandatoryChecks
    : [
    {
      id: 'aadhaar',
      name: 'Aadhaar Demographic KYC',
      status: p.aadhaarName === currentPersona.name ? 'passed' : 'warning',
      statusLabel: p.aadhaarName === currentPersona.name ? 'Matched & Verified' : 'Name Mismatch',
      details: 'Demographic match between EPFO member master and UIDAI database.',
      exactReason: 'Name mismatch in middle initial between EPFO member master and UIDAI database.',
      financialImpact: 'Can cause automated gateway rejection during Aadhaar OTP validation.',
      resolutionRoute: 'digilocker',
      canAutoFix: true,
    },
    {
      id: 'pan',
      name: 'Income Tax PAN Seeding',
      status: p.panSeeded ? 'passed' : 'failed',
      statusLabel: p.panSeeded ? 'PAN Seeded & Active' : 'PAN Not Seeded',
      details: 'Income Tax PAN linking in EPFO portal.',
      exactReason: 'Income Tax PAN is missing in EPFO records. Service tenure is under 5 years.',
      financialImpact: 'Unseeded PAN will trigger 34.608% penal TDS deduction on withdrawals over ₹50,000.',
      resolutionRoute: 'digilocker',
      canAutoFix: true,
    },
    {
      id: 'bank',
      name: 'Bank Account & Active IFSC',
      status: p.bankVerified && p.ifscStatus !== 'defunct_merged' ? 'passed' : 'failed',
      statusLabel: p.ifscStatus === 'defunct_merged' ? 'Defunct Merged IFSC' : p.bankVerified ? 'Verified' : 'Unverified Bank',
      details: 'Bank account number and NPCI IFSC routing status.',
      exactReason: 'Defunct IFSC belongs to merged bank or bank verification is unconfirmed.',
      financialImpact: 'Claim settlement payment will bounce at RBI clearing gateway.',
      resolutionRoute: 'self_service',
      canAutoFix: true,
    },
    {
      id: 'exit_date',
      name: 'Date of Exit / Service Record',
      status: p.employment.doe ? 'passed' : 'failed',
      statusLabel: p.employment.doe ? 'Date of Exit Marked' : 'Exit Date Missing',
      details: 'Service exit date recording on ECR portal.',
      exactReason: 'Missing Date of Exit prevents Form 19/10C selection. EPFO records show service is still active.',
      financialImpact: 'Blocks online application for Full PF Settlement (Form 19) and Pension (Form 10C).',
      resolutionRoute: 'self_service',
      canAutoFix: true,
    },
    {
      id: 'doc_quality',
      name: 'Bank Cheque / Passbook Quality',
      status: p.chequeStatus === 'name_mismatch' ? 'failed' : 'passed',
      statusLabel: p.chequeStatus === 'name_mismatch' ? 'Cheque Name Mismatch' : 'Readable Document',
      details: 'Visual clarity of uploaded cancelled cheque/passbook.',
      exactReason: 'Name mismatch on uploaded cancelled cheque.',
      financialImpact: 'Manual scrutiny rejection by Section Supervisor.',
      resolutionRoute: 'joint_declaration',
      canAutoFix: false,
    },
  ];

  const failedChecks = checks.filter((c) => c.status !== 'passed');
  const isClaimGated = failedChecks.length > 0;

  // -------------------------------------------------------------
  // ACTION 1: One-Click Auto-Fix via DigiLocker
  // -------------------------------------------------------------
  const handleStartDigiLocker = () => {
    setShowDigiLockerModal(true);
    setIsDigiLockerRunning(false);
    setDigiLockerStep(0);
    setDigiLockerFilledDetails(null); // Keep blanks empty initially!
  };

  const handleExecuteDigiLockerSync = async () => {
    setIsDigiLockerRunning(true);
    setDigiLockerStep(1);
    setDigiLockerStatus('Connecting to DigiLocker National Gateway via Aadhaar Consent...');

    setTimeout(() => {
      setDigiLockerStep(2);
      setDigiLockerStatus('Extracting authoritative demographic certificate from UIDAI (Aadhaar)...');
    }, 700);

    setTimeout(() => {
      setDigiLockerStep(3);
      setDigiLockerStatus('Fetching seeded Form 26AS PAN record from Income Tax Department...');
    }, 1400);

    setTimeout(() => {
      setDigiLockerStep(4);
      setDigiLockerStatus('Cross-matching active NPCI Bank Account & converting defunct IFSC...');
      // Reveal the filled details blank by blank
      setDigiLockerFilledDetails({
        pan: 'ABCDE5566P',
        aadhaarName: currentPersona.name,
        bankIfsc: 'ZNTH0000123',
        bankName: 'Zenith United Bank (Merged Horizon)',
      });
    }, 2100);

    setTimeout(async () => {
      setDigiLockerStep(5);
      setDigiLockerStatus('DigiLocker Handshake Complete! Credentials populated.');
      setIsProfileAutofilled(true);

      if (onShowToast) {
        onShowToast(
          'DigiLocker Records Populated',
          'Aadhaar, PAN, Bank and Service details successfully loaded into profile.',
          'success'
        );
      }

      setTimeout(() => {
        setShowDigiLockerModal(false);
        setIsDigiLockerRunning(false);
      }, 1200);
    }, 2800);
  };


  // -------------------------------------------------------------
  // ACTION 2: Manual KYC Update
  // -------------------------------------------------------------
  const handleSaveManualKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await MockBackend.manualUpdateKyc(currentPersona.id, {
        pan: manualPan,
        ifsc: manualIfsc,
        bankAccount: manualAccount,
      });
      if (onRefreshPersona) await onRefreshPersona();
      setShowManualEditModal(false);
      if (onShowToast) {
        onShowToast('Manual KYC Saved', 'Updated Bank and PAN records in EPFO database.', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // ACTION 3: Self-Mark Date of Exit with Aadhaar OTP
  // -------------------------------------------------------------
  const handleRequestDoeOtp = () => {
    setDoeOtpRequested(true);
    setDoeOtp('749201'); // pre-fill demo OTP
    if (onShowToast) {
      onShowToast('Aadhaar OTP Sent', 'OTP sent to mobile linked with Aadhaar (•••• •••• 3210). Demo OTP: 749201', 'info');
    }
  };

  const handleConfirmDoeSubmit = async () => {
    if (!doeOtp || doeOtp.length < 6) {
      if (onShowToast) onShowToast('Invalid OTP', 'Please enter a 6-digit Aadhaar OTP.', 'error');
      return;
    }
    setIsMarkingDoe(true);
    try {
      await MockBackend.manualUpdateKyc(currentPersona.id, {
        doe: doeDate,
        exitReason: doeReason,
      });
      if (onRefreshPersona) await onRefreshPersona();
      setShowDoeModal(false);
      if (onShowToast) {
        onShowToast(
          'Date of Exit Successfully Marked',
          `Date of Exit (${doeDate}) recorded in ECR. Form 19/10C are now unlocked!`,
          'success'
        );
      }
    } finally {
      setIsMarkingDoe(false);
      setDoeOtpRequested(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 font-sans">
      {/* Step Progress Indicator */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 shadow-2xs">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div
            onClick={() => setActiveStep(1)}
            className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
              activeStep === 1
                ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                : 'bg-stone-50 border-stone-200 text-slate-600'
            }`}
          >
            <div className="text-[10px] text-blue-700 font-bold uppercase">Step 1</div>
            <div>KYC Diagnostics (5 Checks)</div>
          </div>

          <div
            onClick={() => setActiveStep(2)}
            className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
              activeStep === 2
                ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                : 'bg-stone-50 border-stone-200 text-slate-600'
            }`}
          >
            <div className="text-[10px] text-amber-700 font-bold uppercase">Step 2</div>
            <div>Issue Resolution (Auto / Manual)</div>
          </div>

          <div
            onClick={() => {
              if (!isClaimGated) {
                onNavigate('claimDoctorView');
              }
            }}
            className={`p-2.5 rounded-xl border transition-all ${
              !isClaimGated
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold cursor-pointer hover:bg-emerald-100'
                : 'bg-stone-50 border-stone-200 text-slate-400 cursor-not-allowed opacity-70'
            }`}
          >
            <div className="text-[10px] text-emerald-700 font-bold uppercase flex items-center justify-center gap-1">
              {!isClaimGated ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3 text-slate-400" />}
              <span>Step 3</span>
            </div>
            <div>Claim Form Unlocked</div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-stone-200 pb-4">
        <div>
          <button
            onClick={() => onNavigate('dashboardView')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backToDashboard}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Citizen Profile & 5-Point KYC Diagnostics
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Active Member: <strong>{isProfileAutofilled ? currentPersona.name : '— (Pending DigiLocker)'}</strong> (UAN: {isProfileAutofilled ? currentPersona.uan : '••••••••••••'}) • Readiness Score: <strong>{isProfileAutofilled ? `${currentPersona.claimReadiness}%` : 'Pending DigiLocker Verification'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Global Gate Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full border shadow-2xs flex items-center gap-1.5 ${
              !isClaimGated
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {!isClaimGated ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All 5 Checks Passed — Claim Unlocked</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{failedChecks.length} Mandatory Check(s) Failing</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* 5-POINT MANDATORY KYC DIAGNOSTICS & REASONING CARDS */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>5 Mandatory KYC & Statutory Gate Checks</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            EPFO SOP 2024 Audit Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {checks.map((check) => {
            const isPassed = check.status === 'passed';
            const isWarning = check.status === 'warning';
            const isFixing = fixingCheckId === check.id;
            return (
              <div
                key={check.id}
                className={`p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                  isPassed
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs'
                    : isWarning
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-2xs'
                    : 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                      {check.id.replace('_', ' ')}
                    </span>
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className={`w-4 h-4 ${isWarning ? 'text-amber-600' : 'text-rose-600'} shrink-0`} />
                    )}
                  </div>
                  <div className="text-xs font-bold leading-tight mb-1">{check.name}</div>
                  <div className={`text-[11px] font-semibold ${isPassed ? 'text-emerald-800' : isWarning ? 'text-amber-800' : 'text-rose-800'}`}>
                    {check.statusLabel}
                  </div>
                </div>

                {!isPassed && check.canAutoFix && (
                  <button
                    onClick={() => handleFixSingleCheck(check.id)}
                    disabled={isFixing}
                    className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-[11px] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isFixing ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin text-slate-950" />
                        <span>Fixing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-slate-950" />
                        <span>1-Click Fix</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Diagnostic Error Reasoning Cards for Failing Checks */}
        {failedChecks.length === 0 ? (
          <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <span>All KYC &amp; Service Records 100% Verified</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-bold">
                    Zero Rejection Risk
                  </span>
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  No KYC errors, bank IFSC mismatches, or date of exit issues found. Account is 100% compliant and unlocked for online claims.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('claimDoctorView')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
              >
                <span>Proceed to Online Claim Filing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Diagnostic Error Reasoning &amp; Action Plans:
              </h3>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {failedChecks.length} Issue{failedChecks.length > 1 ? 's' : ''} Remaining
              </span>
            </div>

            {failedChecks.map((check) => {
              const isFixing = fixingCheckId === check.id;
              return (
                <div
                  key={`error-${check.id}`}
                  className="bg-white rounded-xl border border-stone-300 p-4 shadow-2xs space-y-3 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                      <span className="text-xs font-bold text-slate-900">{check.name}: <span className="text-rose-700">{check.statusLabel}</span></span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Route: {check.resolutionRoute === 'digilocker' ? 'DigiLocker 1-Click' : check.resolutionRoute === 'self_service' ? 'Self-Service Online' : 'Physical Joint Declaration'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                      <div className="font-bold text-slate-800 text-[11px] mb-0.5">1. Exact Root Cause:</div>
                      <p className="text-slate-600 leading-relaxed">{check.exactReason || check.details}</p>
                    </div>

                    <div className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-200">
                      <div className="font-bold text-rose-900 text-[11px] mb-0.5">2. Financial / Process Impact:</div>
                      <p className="text-rose-800 leading-relaxed">{check.financialImpact || 'May cause claim rejection.'}</p>
                    </div>
                  </div>

                  {/* Resolution Action Trigger */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-stone-100">
                    {/* Check-specific 1-click auto-fix button */}
                    {check.id === 'pan' && (
                      <>
                        <button
                          onClick={() => handleFixSingleCheck('pan')}
                          disabled={isFixing}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isFixing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                          )}
                          <span>Auto-Fix PAN (DigiLocker 1-Click)</span>
                        </button>
                        <button
                          onClick={handleStartDigiLocker}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Seed via DigiLocker</span>
                        </button>
                      </>
                    )}

                    {check.id === 'bank' && (
                      <>
                        <button
                          onClick={() => handleFixSingleCheck('bank')}
                          disabled={isFixing}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isFixing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                          )}
                          <span>Auto-Fix IFSC (1-Click)</span>
                        </button>
                        <button
                          onClick={() => {
                            setManualIfsc('ZNTH0000123');
                            setShowManualEditModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                          <span>Update Merged Bank IFSC</span>
                        </button>
                      </>
                    )}

                    {check.id === 'doc_quality' && (
                      <>
                        <button
                          onClick={() => handleFixSingleCheck('doc_quality')}
                          disabled={isFixing}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isFixing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                          )}
                          <span>Fill Cheque via DigiLocker (1-Click)</span>
                        </button>
                      </>
                    )}

                    {check.id === 'exit_date' && (
                      <>
                        <button
                          onClick={() => handleFixSingleCheck('exit_date')}
                          disabled={isFixing}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isFixing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                          )}
                          <span>Auto-Fix Exit Date (1-Click)</span>
                        </button>
                        <button
                          onClick={() => setShowDoeModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-amber-300" />
                          <span>Self-Mark Date of Exit</span>
                        </button>
                      </>
                    )}

                    {check.id !== 'pan' && check.id !== 'bank' && check.id !== 'exit_date' && check.canAutoFix && (
                      <button
                        onClick={() => handleFixSingleCheck(check.id)}
                        disabled={isFixing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isFixing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                        )}
                        <span>Auto-Fix Check (1-Click)</span>
                      </button>
                    )}

                    {check.resolutionRoute === 'joint_declaration' && (
                      <button
                        onClick={() => setShowJointDeclarationModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Generate Digital Joint Declaration Form</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DUAL RESOLUTION WORKFLOW CONTROLS BAR */}
      <div className="bg-stone-100 p-5 rounded-2xl border border-stone-200 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              KYC &amp; Identity Workflows
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {failedChecks.length > 0
                ? 'Choose autonomous issue resolution or authenticate details via DigiLocker:'
                : 'All statutory records are fully verified and aligned with central EPFO databases:'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {failedChecks.length > 0 ? (
              <button
                id="btn-open-autofix-modal"
                onClick={() => setShowAutoFixModal(true)}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Auto-Fix Issues (1-Click)</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 font-bold text-xs px-3.5 py-2 rounded-xl border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>No Issues • Profile Complete</span>
              </div>
            )}

            <button
              id="btn-open-digilocker-sync"
              onClick={handleStartDigiLocker}
              className="inline-flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isProfileAutofilled ? 'Re-Sync DigiLocker' : 'Auto-fill with DigiLocker'}</span>
            </button>

            <button
              id="btn-open-manual-edit"
              onClick={() => setShowManualEditModal(true)}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-slate-600" />
              <span>Manual KYC Inputs</span>
            </button>

            {failedChecks.some(c => c.id === 'exit_date') && (
              <button
                id="btn-open-doe-drawer"
                onClick={() => setShowDoeModal(true)}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-slate-600" />
                <span>Self-Mark Exit Date</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MEMBER PROFILE DETAILS (3 Cards Grid) */}
      {!isProfileAutofilled && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Blank Profile Security:</strong> Personal KYC attributes remain unpopulated until authenticated via DigiLocker handshake.
            </span>
          </div>
          <button
            onClick={handleStartDigiLocker}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Auto-fill with DigiLocker</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Personal Demographics */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Identity & Aadhaar</span>
            </h3>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              UAN: {isProfileAutofilled ? currentPersona.uan : '••••••••••••'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500">Portal Member Name:</span>
              <div className="font-bold text-slate-900">
                {isProfileAutofilled ? currentPersona.name : '— (Pending DigiLocker)'}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Aadhaar Linked Name:</span>
              <div className="flex items-center justify-between mt-0.5">
                <span
                  className={`font-bold ${
                    !isProfileAutofilled
                      ? 'text-slate-400'
                      : p.aadhaarName !== currentPersona.name
                      ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded'
                      : 'text-slate-900'
                  }`}
                >
                  {isProfileAutofilled ? p.aadhaarName : '— (Pending DigiLocker)'}
                </span>
                {isProfileAutofilled && p.aadhaarName !== currentPersona.name && (
                  <button
                    onClick={handleStartDigiLocker}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    Sync via DigiLocker
                  </button>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Father’s / Spouse Name:</span>
              <div className="font-bold text-slate-900">
                {isProfileAutofilled ? p.fatherName || '—' : '—'}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Gender:</span>
              <div className="font-medium text-slate-900">
                {isProfileAutofilled ? p.gender || '—' : '—'}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Date of Birth (EPFO vs Aadhaar):</span>
              <div className="font-medium text-slate-800">
                {isProfileAutofilled ? (
                  <>
                    EPFO: <strong>{p.epfoDob || p.dob}</strong> | Aadhaar: <strong>{p.aadhaarDob || p.dob}</strong>
                  </>
                ) : (
                  <span className="text-slate-400 font-mono">— / — / —</span>
                )}
              </div>
              {isProfileAutofilled && p.epfoDob && p.aadhaarDob && p.epfoDob !== p.aadhaarDob && (
                <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                  ⚠ Discrepancy exceeds 3-year automated limit.
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-500">Income Tax PAN:</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className={`font-mono font-bold ${!isProfileAutofilled ? 'text-slate-400' : !p.pan ? 'text-rose-600' : 'text-slate-900'}`}>
                  {isProfileAutofilled ? p.pan || 'Not Seeded' : '— (Pending DigiLocker)'}
                </span>
                {isProfileAutofilled && !p.pan && (
                  <button
                    onClick={handleStartDigiLocker}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    Seed PAN Now
                  </button>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Mobile & Email:</span>
              <div className="font-mono text-slate-800">
                {isProfileAutofilled ? p.mobile : '••••••••••'}
              </div>
              <div className="text-slate-600 text-[11px]">
                {isProfileAutofilled ? p.email : '••••••••@••••.com'}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Bank & NPCI Seeding */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Bank & NPCI Status</span>
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                !isProfileAutofilled
                  ? 'bg-slate-100 text-slate-600'
                  : p.bankVerified && p.ifscStatus !== 'defunct_merged'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {!isProfileAutofilled
                ? 'Pending DigiLocker'
                : p.bankVerified && p.ifscStatus !== 'defunct_merged'
                ? 'Verified'
                : 'Pending / Action Required'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500">Bank Name:</span>
              <div className="font-bold text-slate-900">
                {isProfileAutofilled ? p.bankName : '— (Pending DigiLocker)'}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Account Number:</span>
              <div className="font-mono font-bold text-slate-900">
                {isProfileAutofilled ? `•••• •••• •••• ${p.accountLast4}` : '•••• •••• •••• ••••'}
              </div>
            </div>

            <div>
              <span className="text-slate-500">IFSC Code:</span>
              <div className="flex items-center justify-between mt-0.5">
                <span
                  className={`font-mono font-bold ${
                    !isProfileAutofilled
                      ? 'text-slate-400'
                      : p.ifscStatus === 'defunct_merged'
                      ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded'
                      : 'text-slate-900'
                  }`}
                >
                  {isProfileAutofilled ? p.ifsc : '— (Pending DigiLocker)'}
                </span>
                {isProfileAutofilled && p.ifscStatus === 'defunct_merged' && (
                  <button
                    onClick={() => {
                      setManualIfsc('ZNTH0000123');
                      setShowManualEditModal(true);
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    Upgrade IFSC
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">NPCI Direct Credit:</span>
                <span className={`font-bold ${!isProfileAutofilled ? 'text-slate-400' : 'text-emerald-700'}`}>
                  {isProfileAutofilled ? 'Active' : 'Pending Sync'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Cheque Verification:</span>
                <span className={`font-bold ${!isProfileAutofilled ? 'text-slate-400' : p.chequeStatus === 'valid' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isProfileAutofilled ? (p.chequeStatus === 'valid' ? 'Verified' : 'Name Mismatch') : 'Pending Sync'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Employment & Exit Date */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-purple-600" />
              <span>Employment & Service</span>
            </h3>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              Contributory Service
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500">Current Establishment:</span>
              <div className="font-bold text-slate-900">
                {isProfileAutofilled ? p.employment.employer : '— (Pending DigiLocker)'}
              </div>
            </div>

            {isProfileAutofilled && p.employment.concurrentEmployer && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-900 text-[11px]">
                <strong>Service Overlap:</strong> {p.employment.concurrentEmployer}
              </div>
            )}

            <div>
              <span className="text-slate-500">Member ID:</span>
              <div className="font-mono font-bold text-slate-900">
                {isProfileAutofilled ? p.employment.memberId : '— (Pending DigiLocker)'}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Date of Joining (DOJ):</span>
              <div className="font-medium text-slate-800">
                {isProfileAutofilled ? p.employment.doj || p.employment.from : '—'}
              </div>
            </div>

            <div>
              <span className="text-slate-500">Date of Exit (DOE):</span>
              <div className="flex items-center justify-between mt-0.5">
                <span
                  className={`font-medium ${
                    !isProfileAutofilled
                      ? 'text-slate-400'
                      : !p.employment.doe
                      ? 'text-amber-700 font-bold'
                      : 'text-slate-800'
                  }`}
                >
                  {isProfileAutofilled ? p.employment.doe || 'Not Marked in ECR' : '—'}
                </span>
                {isProfileAutofilled && !p.employment.doe && (
                  <button
                    onClick={() => setShowDoeModal(true)}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    Self-Mark Date
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIGILOCKER CANCELLED CHEQUE & BANK PASSBOOK WIDGET */}
      <div className="mt-6">
        <DigiLockerChequeWidget
          currentPersona={currentPersona}
          onRefreshPersona={onRefreshPersona || (async () => {})}
          onShowToast={onShowToast}
          settings={settings}
        />
      </div>

      {/* PROCEED TO CLAIM FORM BUTTON */}
      <div className="mt-8 bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">
            {!isClaimGated ? 'Step 3: Ready to Submit Claim' : 'Step 3: Claim Submission Gated'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {!isClaimGated
              ? 'All 5 mandatory checks are clean and verified. You can proceed with Form 31, 19, or 10C.'
              : 'Resolve failing KYC checks above to unlock claim application form.'}
          </p>
        </div>

        <button
          id="btn-proceed-unlocked-claim"
          disabled={isClaimGated}
          onClick={() => onNavigate('claimDoctorView')}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs shadow-xs transition-all ${
            !isClaimGated
              ? 'bg-slate-950 hover:bg-slate-900 text-white hover:ring-2 hover:ring-amber-400 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Proceed to Claim Submission</span>
          <ArrowRight className="w-4 h-4 text-amber-300" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: Authentic DigiLocker OAuth & Animation Modal          */}
      {/* ------------------------------------------------------------- */}
      {showDigiLockerModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDigiLockerModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {/* DigiLocker Official Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-5">
              <div className="w-12 h-12 bg-blue-900 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-xs">
                DL
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-950 flex items-center gap-1.5">
                  <span>DigiLocker National e-Governance Gateway</span>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </h3>
                <p className="text-xs text-slate-500">
                  Government of India • Ministry of Electronics & IT (MeitY)
                </p>
              </div>
            </div>

            {/* Content: Consent & Side-by-Side Blanks */}
            <div className="space-y-5 text-xs">
              <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-950 leading-relaxed">
                <strong>Authorization Consent:</strong> By clicking <em>Sync Verified Credentials</em>, you authorize EPFO to fetch your digitally signed Aadhaar demographic profile, verified Income Tax PAN record, and active NPCI bank IFSC code directly from government issuers.
              </div>

              {/* Side-by-Side Extraction Blanks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Income Tax PAN Seeding</label>
                  <div className="p-2.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 min-h-[38px] flex items-center">
                    {digiLockerFilledDetails?.pan || (
                      <span className="text-slate-400 italic text-[11px] font-sans">[Blank - Awaiting Sync]</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">UIDAI Aadhaar Full Name</label>
                  <div className="p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 min-h-[38px] flex items-center">
                    {digiLockerFilledDetails?.aadhaarName || (
                      <span className="text-slate-400 italic text-[11px] font-sans">[Blank - Awaiting Sync]</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Active NPCI Bank IFSC</label>
                  <div className="p-2.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 min-h-[38px] flex items-center">
                    {digiLockerFilledDetails?.bankIfsc || (
                      <span className="text-slate-400 italic text-[11px] font-sans">[Blank - Awaiting Sync]</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Mapped Bank Name</label>
                  <div className="p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 min-h-[38px] flex items-center">
                    {digiLockerFilledDetails?.bankName || (
                      <span className="text-slate-400 italic text-[11px] font-sans">[Blank - Awaiting Sync]</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Animation Steps */}
              {isDigiLockerRunning && (
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 shadow-md">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Live Gateway Handshake in Progress...</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className={digiLockerStep >= 1 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {digiLockerStep >= 1 ? '✓ ' : '○ '} Authenticated Member via Aadhaar OTP Gateway
                    </div>
                    <div className={digiLockerStep >= 2 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {digiLockerStep >= 2 ? '✓ ' : '○ '} Fetched verified Aadhaar e-KYC XML from UIDAI
                    </div>
                    <div className={digiLockerStep >= 3 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {digiLockerStep >= 3 ? '✓ ' : '○ '} Verified Income Tax PAN record with NSDL/UTIITSL
                    </div>
                    <div className={digiLockerStep >= 4 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {digiLockerStep >= 4 ? '✓ ' : '○ '} Converted defunct Horizon IFSC to active Zenith United Bank (ZNTH0000123)
                    </div>
                  </div>
                  <div className="text-[11px] text-amber-300 pt-1 border-t border-slate-800">
                    {digiLockerStatus}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDigiLockerModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDigiLockerRunning}
                onClick={handleExecuteDigiLockerSync}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 inline-flex items-center gap-2 shadow-xs"
              >
                {isDigiLockerRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>Sync Verified Credentials</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: Interactive Manual Correction Inputs Modal           */}
      {/* ------------------------------------------------------------- */}
      {showManualEditModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowManualEditModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-950 mb-1">
              Manual Member KYC Update
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter corrected Bank Account, new IFSC, or PAN manually:
            </p>

            <form onSubmit={handleSaveManualKyc} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Income Tax PAN (10 Alpha-Numeric):
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={manualPan}
                  onChange={(e) => setManualPan(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE5566P"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Active Bank IFSC Code:
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={manualIfsc}
                  onChange={(e) => setManualIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. ZNTH0000123"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Tip: Horizon National Bank account holders should use new Zenith United Bank IFSC: <strong>ZNTH0000123</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Full Bank Account Number:
                </label>
                <input
                  type="text"
                  value={manualAccount}
                  onChange={(e) => setManualAccount(e.target.value)}
                  placeholder="e.g. 30291048297788"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowManualEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-900"
                >
                  Save Corrections
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: Interactive Self-Mark Date of Exit Drawer with OTP   */}
      {/* ------------------------------------------------------------- */}
      {showDoeModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowDoeModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-extrabold text-slate-950">
                Self-Mark Date of Exit (Aadhaar OTP)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Under EPFO Member Self-Declaration norms, employees can mark their Date of Exit 2 months after leaving employment without employer intervention.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Establishment / Employer:
                </label>
                <div className="p-2.5 bg-stone-100 rounded-lg text-slate-800 font-bold">
                  {p.employment.employer} ({p.employment.memberId})
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Date of Leaving Service:
                </label>
                <input
                  type="date"
                  value={doeDate}
                  onChange={(e) => setDoeDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Reason for Leaving:
                </label>
                <select
                  value={doeReason}
                  onChange={(e) => setDoeReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="Cessation (Short Service / Resignation)">Cessation (Short Service / Resignation)</option>
                  <option value="Retirement / Superannuation">Retirement / Superannuation</option>
                  <option value="Permanent Incapacity">Permanent Incapacity</option>
                </select>
              </div>

              {/* Aadhaar OTP Authentication Section */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Aadhaar OTP Authorization</div>
                    <div className="text-[11px] text-slate-500">Sent to Aadhaar linked mobile</div>
                  </div>
                  {!doeOtpRequested ? (
                    <button
                      type="button"
                      onClick={handleRequestDoeOtp}
                      className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-xs shadow-2xs"
                    >
                      Request OTP
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      OTP Dispatched
                    </span>
                  )}
                </div>

                {doeOtpRequested && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Enter 6-digit Aadhaar OTP:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={doeOtp}
                      onChange={(e) => setDoeOtp(e.target.value)}
                      placeholder="e.g. 749201"
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-center text-sm font-bold tracking-widest bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDoeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!doeOtpRequested || isMarkingDoe}
                onClick={handleConfirmDoeSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-900 inline-flex items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-xs"
              >
                {isMarkingDoe ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
                <span>Validate OTP & Mark Exit Date</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: Digital Joint Declaration PDF Generator Modal (Red)   */}
      {/* ------------------------------------------------------------- */}
      {showJointDeclarationModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowJointDeclarationModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-slate-200 mb-4">
              <div className="w-12 h-12 bg-rose-900 text-white rounded-xl mx-auto flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">
                Official Digital Joint Declaration Form (EPFO SOP 2024)
              </h3>
              <p className="text-xs text-slate-500">
                To be physically attested by Member & Employer for Field Office submission
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed">
                <strong>Why is this required?</strong> Member record has a DOB discrepancy of &gt;3 years ({p.epfoDob || p.dob} vs {p.aadhaarDob || p.dob}) and/or dual active concurrent service overlaps. Under statutory circulars, online OTP correction is restricted.
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                <div className="p-3 bg-stone-50 font-bold text-slate-900">
                  Joint Declaration Parameters:
                </div>
                <div className="p-2.5 grid grid-cols-3 gap-2">
                  <span className="font-bold text-slate-700">Parameter</span>
                  <span className="font-bold text-rose-700">EPFO Incorrect Record</span>
                  <span className="font-bold text-emerald-700">Correct Record (Aadhaar)</span>
                </div>
                <div className="p-2.5 grid grid-cols-3 gap-2">
                  <span className="text-slate-600">Date of Birth:</span>
                  <span className="font-mono text-rose-800">{p.epfoDob || '1986-06-15'}</span>
                  <span className="font-mono text-emerald-800 font-bold">{p.aadhaarDob || '1982-01-10'}</span>
                </div>
                <div className="p-2.5 grid grid-cols-3 gap-2">
                  <span className="text-slate-600">Service Overlap:</span>
                  <span className="text-rose-800">Delta Corp & Pioneer Concurrent</span>
                  <span className="text-emerald-800 font-bold">Cessation from Delta Corp (2021)</span>
                </div>
                <div className="p-2.5 grid grid-cols-3 gap-2">
                  <span className="text-slate-600">Bank Account Name:</span>
                  <span className="text-rose-800">Ramesh Verma</span>
                  <span className="text-emerald-800 font-bold">Ramesh Kumar Verma</span>
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] text-slate-500">Employee Signature Space</div>
                  <div className="h-14 border border-dashed border-slate-300 rounded mt-1 flex items-center justify-center text-slate-400">
                    [Member Signature]
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Employer Stamp & DSC Seal</div>
                  <div className="h-14 border border-dashed border-slate-300 rounded mt-1 flex items-center justify-center text-slate-400">
                    [Employer Authorized Signatory]
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowJointDeclarationModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-900 inline-flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Joint Declaration PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AUTONOMOUS AUTO-FIX MODAL WITH ANIMATED MATCHING PIPELINE */}
      <AutoFixModal
        isOpen={showAutoFixModal}
        onClose={() => setShowAutoFixModal(false)}
        currentPersona={currentPersona}
        onSuccess={async () => {
          if (onRefreshPersona) await onRefreshPersona();
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};
