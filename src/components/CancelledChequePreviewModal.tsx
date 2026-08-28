import React from 'react';
import { Persona, AppSettings } from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  X,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  FileText,
  Building,
  Check,
  Lock,
  ExternalLink,
} from 'lucide-react';

interface CancelledChequePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: Persona;
  onReplace: () => void;
  onRemove: () => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'warning' | 'info') => void;
  settings: AppSettings;
}

export const CancelledChequePreviewModal: React.FC<CancelledChequePreviewModalProps> = ({
  isOpen,
  onClose,
  currentPersona,
  onReplace,
  onRemove,
  onShowToast,
  settings,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const p = currentPersona.profile;
  const isDigiLocker = p.chequeSource === 'digilocker' || (!p.chequeSource && p.chequeFileName?.includes('DigiLocker'));
  const bankName = p.bankName || 'Apex Mercantile Bank';
  const accountNumber = p.fullAccountNumber || `5010048291${p.accountLast4 || '7788'}`;
  const ifsc = p.ifsc || 'APEX0001234';
  const memberName = p.aadhaarName || currentPersona.name;

  const handleDownloadImage = () => {
    // Generate synthetic downloadable file
    const element = document.createElement('a');
    const file = new Blob(
      [
        `========================================================================\n` +
        `           OFFICIAL NPCI / DIGILOCKER CANCELLED CHEQUE RECORD           \n` +
        `========================================================================\n\n` +
        `Bank Name      : ${bankName}\n` +
        `IFSC Code      : ${ifsc}\n` +
        `Branch         : Main Financial District Central Branch\n` +
        `Account Holder : ${memberName}\n` +
        `Account Number : ${accountNumber}\n` +
        `Status         : CANCELLED (EPFO SETTLEMENT ONLY)\n` +
        `Verification   : DigiLocker Cryptographic Seal Validated\n` +
        `Timestamp      : ${new Date().toISOString()}\n` +
        `Ref ID         : DL-CHK-2026-99120\n\n` +
        `MICR Code      : 110024092\n` +
        `SAN Code       : 492019\n` +
        `========================================================================\n`
      ],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = `${p.chequeFileName || 'Cancelled_Cheque_Verified.txt'}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    if (onShowToast) {
      onShowToast('Cheque Document Downloaded', `${p.chequeFileName || 'Cancelled Cheque'} saved to your device.`, 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Cancelled Cheque Document Viewer
                </h2>
                {isDigiLocker ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    DigiLocker Certified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700">
                    Uploaded Copy
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {p.chequeFileName || 'DigiLocker_Certified_Cheque.jpg'} • Verified via NPCI clearing directory
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* CHEQUE PAPER ARTIFACT */}
          <div className="relative bg-amber-50/70 border-2 border-slate-300 rounded-xl p-5 sm:p-6 shadow-inner font-sans overflow-hidden select-none">
            {/* Background Guilloche Wave pattern simulation */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]" />

            {/* Giant Diagonal CANCELLED Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 rotate-[-18deg]">
              <div className="border-y-8 border-rose-800 py-3 px-8 text-rose-900 font-black tracking-widest text-4xl sm:text-6xl uppercase">
                CANCELLED
              </div>
            </div>

            {/* Bank Header Row */}
            <div className="flex items-start justify-between border-b border-slate-300/80 pb-3 mb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                  {bankName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight leading-none uppercase">
                    {bankName}
                  </h3>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Central Financial District, Tower 4, Mumbai 400051
                  </p>
                  <p className="text-[10px] font-mono font-bold text-blue-900">
                    RTGS / NEFT IFSC: {ifsc}
                  </p>
                </div>
              </div>

              {/* Date Box */}
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Date
                </span>
                <div className="flex gap-0.5 font-mono text-xs font-bold text-slate-700">
                  <span className="border border-slate-400 px-1 py-0.5 bg-white">X</span>
                  <span className="border border-slate-400 px-1 py-0.5 bg-white">X</span>
                  <span className="border border-slate-400 px-1 py-0.5 bg-white">X</span>
                  <span className="border border-slate-400 px-1 py-0.5 bg-white">X</span>
                  <span className="border border-slate-400 px-1 py-0.5 bg-white">2</span>
                  <span className="border border-slate-400 px-1 py-0.5 bg-white">0</span>
                  <span className="border border-slate-400 px-1 py-0.5 bg-white">2</span>
                  <span className="border border-slate-400 px-1 py-0.5 bg-white">6</span>
                </div>
              </div>
            </div>

            {/* Payee Line */}
            <div className="space-y-3 mb-5 relative z-10 text-xs">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-700 uppercase text-[11px] shrink-0">Pay</span>
                <div className="flex-1 border-b border-dotted border-slate-600 pb-0.5 font-semibold text-slate-900 flex justify-between">
                  <span>EPFO SETTLEMENT ONLY — {memberName}</span>
                  <span className="text-slate-500 font-normal text-[10px]">Or Bearer</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-700 uppercase text-[11px] shrink-0">Rupees</span>
                <div className="flex-1 border-b border-dotted border-slate-600 pb-0.5 text-slate-500 italic text-[11px]">
                  *** NOT NEGOTIABLE — FOR ACCOUNT VERIFICATION PURPOSE ONLY ***
                </div>
                <div className="border-2 border-slate-600 px-3 py-1 bg-white font-mono font-bold text-slate-900 rounded">
                  ₹ *******
                </div>
              </div>
            </div>

            {/* Account Box & Signatures */}
            <div className="flex flex-col sm:flex-row items-end justify-between gap-4 pt-2 border-t border-slate-300/80 relative z-10">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-0.5">
                  Savings Bank Account Number
                </span>
                <div className="inline-flex items-center gap-2 border-2 border-slate-800 bg-white px-3 py-1.5 rounded-lg shadow-xs">
                  <span className="font-mono font-black text-sm text-slate-950 tracking-wider">
                    {accountNumber}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-800 font-bold block mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Name Printed: {memberName}
                </span>
              </div>

              {/* Signature / DigiLocker E-Sign Box */}
              <div className="text-right w-full sm:w-auto">
                {isDigiLocker ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-left inline-block shadow-xs">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-[11px] mb-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>DigiLocker NPCI E-Sign</span>
                    </div>
                    <p className="text-[10px] text-emerald-800 font-mono">
                      Ref: DL-CHK-{Date.now().toString().slice(-6)}
                    </p>
                    <p className="text-[9px] text-emerald-700 mt-0.5">
                      Digitally Certified & Timestamped
                    </p>
                  </div>
                ) : (
                  <div className="border-t border-slate-500 pt-1 text-center min-w-[140px]">
                    <span className="text-[10px] text-slate-600 font-bold uppercase block">
                      Authorized Signatory
                    </span>
                    <span className="font-script text-xs text-blue-900 italic block mt-0.5">
                      {memberName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cheque MICR Strip bottom */}
            <div className="mt-5 pt-2 border-t-2 border-slate-800 flex items-center justify-center font-mono text-xs sm:text-sm font-black text-slate-900 tracking-widest relative z-10 bg-amber-100/50 py-1 rounded">
              ⑈ 249018 ⑈ 110024092 ⑈ {accountNumber.slice(-6)} ⑈ 31
            </div>
          </div>

          {/* OCR Verification Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Automated EPFO OCR Validation Report
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                100% Passed (Zero Risk)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Payee Name Match</span>
                <span className="font-bold text-slate-900">{memberName}</span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">✓ 100% Match with Aadhaar</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Bank Account Number</span>
                <span className="font-mono font-bold text-slate-900">•••• {p.accountLast4}</span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">✓ Verified via Penny Drop</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">IFSC Code & DPI</span>
                <span className="font-mono font-bold text-slate-900">{ifsc}</span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">✓ 300 DPI High Clarity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRemove}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Document</span>
            </button>
            <button
              type="button"
              onClick={onReplace}
              className="px-3 py-2 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace / Re-fetch</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Copy</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Download Cheque File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
