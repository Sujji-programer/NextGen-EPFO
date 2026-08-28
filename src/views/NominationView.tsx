import React, { useState } from 'react';
import { ViewName, Persona, AppSettings } from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  UserCheck,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Download,
  Fingerprint,
  FileText,
  User,
  Users,
  Sparkles,
  Award
} from 'lucide-react';
import { sanitizeNumericInput } from '../utils/numericInput';

interface NominationViewProps {
  currentPersona: Persona;
  onNavigate: (view: ViewName) => void;
  settings: AppSettings;
  onShowToast: (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error') => void;
}

interface Nominee {
  id: string;
  name: string;
  relationship: string;
  dob: string;
  aadhaar: string;
  sharePercent: number;
  isMinor: boolean;
  guardianName?: string;
  address: string;
}

export const NominationView: React.FC<NominationViewProps> = ({
  currentPersona,
  onNavigate,
  settings,
  onShowToast,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [hasFamily, setHasFamily] = useState<boolean>(true);
  const [maritalStatus, setMaritalStatus] = useState<'Married' | 'Unmarried' | 'Widowed' | 'Divorced'>('Married');

  // EPF Nominees
  const [epfNominees, setEpfNominees] = useState<Nominee[]>([
    {
      id: 'nom-1',
      name: currentPersona.id === 'asha-clean' ? 'Arun Sharma' : currentPersona.id === 'ravi-issues' ? 'Pooja Verma' : 'Suresh Iyer',
      relationship: 'Spouse',
      dob: '1992-06-15',
      aadhaar: '•••• •••• 8842',
      sharePercent: 100,
      isMinor: false,
      address: 'Flat 402, Green Glen Layout, Bengaluru, KA 560103',
    },
  ]);

  // EPS Pension Nominee
  const [epsSpouseName, setEpsSpouseName] = useState(
    currentPersona.id === 'asha-clean' ? 'Arun Sharma' : currentPersona.id === 'ravi-issues' ? 'Pooja Verma' : 'Suresh Iyer'
  );
  const [epsChildName, setEpsChildName] = useState('Aarav (Son)');

  // e-Sign state
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [isSignDone, setIsSignDone] = useState(false);
  const [nominationDocId, setNominationDocId] = useState('');

  // Total share percentage calculation
  const totalEpfShare = epfNominees.reduce((acc, n) => acc + (Number(n.sharePercent) || 0), 0);

  const handleAddNominee = () => {
    if (epfNominees.length >= 4) {
      onShowToast('Nominee Limit', 'You can add up to 4 nominees.', 'warning');
      return;
    }
    const remainingShare = Math.max(0, 100 - totalEpfShare);
    const newNominee: Nominee = {
      id: `nom-${Date.now()}`,
      name: '',
      relationship: 'Son',
      dob: '2015-08-10',
      aadhaar: '•••• •••• ' + Math.floor(1000 + Math.random() * 9000),
      sharePercent: remainingShare,
      isMinor: false,
      address: 'Same as member permanent address',
    };
    setEpfNominees([...epfNominees, newNominee]);
  };

  const handleRemoveNominee = (id: string) => {
    if (epfNominees.length <= 1) {
      onShowToast('Required', 'At least one nominee is required.', 'warning');
      return;
    }
    setEpfNominees(epfNominees.filter((n) => n.id !== id));
  };

  const handleUpdateNominee = (id: string, field: keyof Nominee, val: any) => {
    setEpfNominees(
      epfNominees.map((n) => {
        if (n.id === id) {
          return { ...n, [field]: val };
        }
        return n;
      })
    );
  };

  const handleVerifyAndProceedStep2 = () => {
    if (totalEpfShare !== 100) {
      onShowToast('Share Allocation Error', 'Total nominee share % must equal exactly 100%.', 'error');
      return;
    }
    for (const n of epfNominees) {
      if (!n.name.trim()) {
        onShowToast('Missing Information', 'Please provide names for all nominees.', 'warning');
        return;
      }
    }
    setStep(3);
  };

  const handleExecuteESign = () => {
    if (!aadhaarOtp || aadhaarOtp.length < 4) {
      onShowToast('Enter OTP', 'Please enter the 6-digit virtual Aadhaar OTP.', 'warning');
      return;
    }
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      setIsSignDone(true);
      const generatedId = `EPFO-NOM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      setNominationDocId(generatedId);
      setStep(5);
      onShowToast('e-Nomination Successful', 'Aadhaar digital signature authenticated & filed with EPFO.', 'success');
    }, 1600);
  };

  const handleDownloadCertificate = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>EPFO e-Nomination Acknowledgment - ${nominationDocId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 20px; font-weight: bold; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .meta-table td { padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 13px; }
    .meta-table td.lbl { background: #f8fafc; font-weight: bold; width: 30%; }
    .seal { display: inline-block; padding: 6px 12px; background: #ecfdf5; border: 1px solid #10b981; color: #065f46; font-weight: bold; border-radius: 6px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">EMPLOYEES' PROVIDENT FUND ORGANISATION</div>
      <div style="font-size: 12px; color: #64748b;">Statutory e-Nomination Filing Certificate & Acknowledgment</div>
    </div>
    <div class="seal">✓ Aadhaar e-Signed</div>
  </div>
  <table class="meta-table">
    <tr><td class="lbl">Acknowledgment Reference</td><td><strong>${nominationDocId}</strong></td></tr>
    <tr><td class="lbl">Member Name</td><td>${currentPersona.name}</td></tr>
    <tr><td class="lbl">Universal Account Number (UAN)</td><td>${currentPersona.uan}</td></tr>
    <tr><td class="lbl">Member ID</td><td>${currentPersona.memberId}</td></tr>
    <tr><td class="lbl">Establishment</td><td>${currentPersona.profile.employment.employer}</td></tr>
    <tr><td class="lbl">Submission Timestamp</td><td>${new Date().toLocaleString()}</td></tr>
    <tr><td class="lbl">Digital Signature Authority</td><td>UIDAI Aadhaar e-Sign Service (Synthetic POC)</td></tr>
  </table>
  <h3>EPF Scheme Nominees</h3>
  <table class="meta-table">
    <tr style="background:#f1f5f9; font-weight:bold;">
      <td>Nominee Name</td><td>Relationship</td><td>Aadhaar No.</td><td>Share %</td>
    </tr>
    ${epfNominees.map((n) => `<tr><td>${n.name}</td><td>${n.relationship}</td><td>${n.aadhaar}</td><td><strong>${n.sharePercent}%</strong></td></tr>`).join('')}
  </table>
  <p style="font-size: 11px; color: #64748b; margin-top: 30px;">
    This is a system-generated electronic document conforming to the Information Technology Act, 2000. No physical signature is required.
  </p>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eNomination_${currentPersona.uan}_${nominationDocId}.html`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Downloaded', 'Nomination Certificate downloaded successfully.', 'info');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 font-sans">
      {/* Top Breadcrumb & Title */}
      <div className="flex items-center justify-between mb-6 border-b border-stone-200 pb-4">
        <div>
          <button
            onClick={() => onNavigate('dashboardView')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backToDashboard}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2.5">
            <span>{t.eNominationTitle}</span>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Form 2 Revised
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t.eNominationSubtitle}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Statutory Compliance 100%</span>
        </div>
      </div>

      {/* Step Indicator Tracker */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-8 shadow-2xs">
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { num: 1, label: t.step1Family || '1. Family' },
            { num: 2, label: t.step2EPF || '2. EPF Nominees' },
            { num: 3, label: t.step3EPS || '3. EPS Pension' },
            { num: 4, label: t.step4eSign || '4. Aadhaar e-Sign' },
            { num: 5, label: t.step5Done || '5. Certificate' },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-2 rounded-lg transition-all ${
                step === s.num
                  ? 'bg-slate-950 text-white font-bold shadow-xs'
                  : step > s.num
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                  : 'bg-stone-50 text-slate-400 font-medium'
              }`}
            >
              <div className="text-[11px] truncate">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Family Declaration */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Step 1: Family Declaration & Profile Confirmation</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              As per EPFO statutory guidelines, please confirm your family status for PF and EPS nominations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  {t.havingFamily || 'Do you have a family?'}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 flex-1 font-semibold text-slate-900 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800">
                    <input
                      type="radio"
                      name="familyRadio"
                      checked={hasFamily === true}
                      onChange={() => setHasFamily(true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Yes (Having Family)</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 flex-1 font-semibold text-slate-900 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800">
                    <input
                      type="radio"
                      name="familyRadio"
                      checked={hasFamily === false}
                      onChange={() => setHasFamily(false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>No (Single / No Dependent)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Marital Status
                </label>
                <select
                  value={maritalStatus}
                  onChange={(e: any) => setMaritalStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-medium text-slate-800 bg-white"
                >
                  <option value="Married">Married</option>
                  <option value="Unmarried">Unmarried</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
              <div className="font-bold text-slate-900 text-sm">Member Summary</div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-slate-900">{currentPersona.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">UAN:</span>
                <span className="font-mono font-bold text-slate-900">{currentPersona.uan}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Date of Birth:</span>
                <span className="font-medium text-slate-800">{currentPersona.profile.dob}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Employer:</span>
                <span className="font-medium text-slate-800 truncate">{currentPersona.profile.employment.employer}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-stone-100">
            <button
              id="btn-nomination-step1-next"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-lg shadow-xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 transition-all text-xs"
            >
              <span>Proceed to EPF Nominees</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: EPF Nominees */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>Step 2: EPF Nominee Details & Share Allocation</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Specify one or more beneficiaries. Total share allocation must sum to exactly 100%.
              </p>
            </div>

            <button
              id="btn-add-nominee"
              onClick={handleAddNominee}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addNominee || 'Add Another Nominee'}</span>
            </button>
          </div>

          {/* Nominees List */}
          <div className="space-y-4">
            {epfNominees.map((nom, idx) => (
              <div
                key={nom.id}
                className="bg-slate-50/70 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200/80 pb-2">
                  <span>Nominee #{idx + 1}</span>
                  {epfNominees.length > 1 && (
                    <button
                      onClick={() => handleRemoveNominee(nom.id)}
                      className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1 p-1 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      {t.nomineeName || 'Nominee Name'} *
                    </label>
                    <input
                      type="text"
                      value={nom.name}
                      onChange={(e) => handleUpdateNominee(nom.id, 'name', e.target.value)}
                      placeholder="e.g. Arun Sharma"
                      className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      {t.relationship || 'Relationship'} *
                    </label>
                    <select
                      value={nom.relationship}
                      onChange={(e) => handleUpdateNominee(nom.id, 'relationship', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-medium"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      {t.aadhaarNo || 'Aadhaar Number'}
                    </label>
                    <input
                      type="text"
                      value={nom.aadhaar}
                      onChange={(e) => handleUpdateNominee(nom.id, 'aadhaar', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-mono font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Share Percentage (%) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={nom.sharePercent === 0 ? '' : nom.sharePercent}
                      onChange={(e) => {
                        const sanitized = sanitizeNumericInput(e.target.value);
                        const numVal = sanitized === '' ? 0 : Math.min(100, Math.max(0, parseInt(sanitized, 10) || 0));
                        handleUpdateNominee(nom.id, 'sharePercent', numVal);
                      }}
                      placeholder="e.g. 100"
                      className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Nominee Permanent Address
                  </label>
                  <input
                    type="text"
                    value={nom.address}
                    onChange={(e) => handleUpdateNominee(nom.id, 'address', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-medium"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Share Total Validation Bar */}
          <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            totalEpfShare === 100
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
              : 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
          }`}>
            <div className="flex items-center gap-2">
              {totalEpfShare === 100 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>
                Total Share Allocated: {totalEpfShare}% {totalEpfShare === 100 ? '— Valid (100%)' : '— Must equal exactly 100%'}
              </span>
            </div>
            {totalEpfShare !== 100 && (
              <button
                onClick={() => {
                  if (epfNominees.length === 1) {
                    handleUpdateNominee(epfNominees[0].id, 'sharePercent', 100);
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-[11px] font-bold"
              >
                Auto-Fix to 100%
              </button>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-stone-100">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              id="btn-nomination-step2-next"
              onClick={handleVerifyAndProceedStep2}
              className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-lg shadow-xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 transition-all text-xs"
            >
              <span>Save & Continue to EPS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: EPS Pension Nominee */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Step 3: EPS Scheme 1995 Pension Nomination</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Statutory pension protection for spouse and dependent children under Employees' Pension Scheme 1995.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-3">
              <div className="font-bold text-blue-950 text-sm">Spouse & Dependent Children EPS Mapping</div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Under Para 18 of EPS 1995, the monthly widow pension and children pension automatically covers legal spouse and children up to age 25.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Spouse Name for Family Pension:
                  </label>
                  <input
                    type="text"
                    value={epsSpouseName}
                    onChange={(e) => setEpsSpouseName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Dependent Children Details:
                  </label>
                  <input
                    type="text"
                    value={epsChildName}
                    onChange={(e) => setEpsChildName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-stone-100">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              id="btn-nomination-step3-next"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-lg shadow-xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 transition-all text-xs"
            >
              <span>Proceed to Aadhaar e-Sign</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Aadhaar e-Sign */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-purple-600" />
              <span>Step 4: Statutory Aadhaar e-Sign Verification</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              e-Nomination becomes legally active only once authenticated with Aadhaar digital e-Sign.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-sm">UIDAI Virtual e-Sign Service</div>
                <div className="text-slate-500 text-[11px]">Simulating instant Aadhaar OTP authorization for demo</div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
              <strong>Statutory Declaration:</strong> I hereby declare that the particulars furnished above are correct. In the event of my death before the amount standing to my credit becomes payable, the specified share shall be distributed to the nominees named herein.
            </div>

            <div className="max-w-md space-y-3">
              <label className="block text-slate-800 font-bold">
                Enter 6-digit Aadhaar OTP sent to linked mobile (••••••7742):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 123456"
                  value={aadhaarOtp}
                  onChange={(e) => setAadhaarOtp(e.target.value)}
                  className="flex-1 p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-center tracking-widest text-base focus:ring-2 focus:ring-purple-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAadhaarOtp('482910')}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs"
                >
                  Fill Demo OTP
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-stone-100">
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              id="btn-nomination-execute-esign"
              disabled={isSigning}
              onClick={handleExecuteESign}
              className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-bold px-7 py-2.5 rounded-lg shadow-xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 transition-all text-xs disabled:opacity-50"
            >
              {isSigning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating e-Sign...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span>Authenticate & Complete e-Nomination</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Nomination Certificate & Success */}
      {step === 5 && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6 text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">
              {t.nominationSuccess || 'e-Nomination Registered Successfully!'}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
              Your digital e-Nomination has been verified via Aadhaar e-Sign and stored in the central EPFO master ledger.
            </p>
          </div>

          <div className="max-w-xl mx-auto bg-stone-50 rounded-xl border border-stone-200 p-5 text-left text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-slate-500 font-semibold">Nomination Reference:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{nominationDocId}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-slate-500 font-semibold">Member UAN:</span>
              <span className="font-mono font-bold text-slate-800">{currentPersona.uan}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-slate-500 font-semibold">Primary Nominee:</span>
              <span className="font-bold text-slate-900">{epfNominees[0]?.name} ({epfNominees[0]?.relationship} — {epfNominees[0]?.sharePercent}%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>e-Signed & Active</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              id="btn-download-nomination-pdf"
              onClick={handleDownloadCertificate}
              className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-lg shadow-xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 transition-all text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Nomination Certificate</span>
            </button>

            <button
              id="btn-nomination-return-dashboard"
              onClick={() => onNavigate('dashboardView')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-lg transition-colors border border-slate-300 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800"
            >
              <span>{t.backToDashboard}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
