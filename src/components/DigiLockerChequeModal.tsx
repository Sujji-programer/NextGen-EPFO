import React, { useState, useEffect } from 'react';
import { Persona, AppSettings } from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  X,
  RefreshCw,
  Building,
  Lock,
  Eye,
  Check,
} from 'lucide-react';

interface DigiLockerChequeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: Persona;
  onSuccess: (source: 'digilocker' | 'manual_upload', fileName: string) => void;
  settings: AppSettings;
}

export const DigiLockerChequeModal: React.FC<DigiLockerChequeModalProps> = ({
  isOpen,
  onClose,
  currentPersona,
  onSuccess,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'digilocker' | 'upload'>('digilocker');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // Manual upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
      setCurrentStep(0);
      setStatusMessage('');
      setIsCompleted(false);
      setUploadedFile(null);
      setUploadError(null);
      setUploadPreviewUrl(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartDigiLockerFetch = () => {
    setIsProcessing(true);
    setCurrentStep(1);
    setStatusMessage(settings.language === 'hi' ? 'डिजिलॉकर बैंक वॉल्ट से कनेक्ट हो रहा है...' : 'Connecting to DigiLocker NPCI Banking Repository...');

    setTimeout(() => {
      setCurrentStep(2);
      setStatusMessage(
        settings.language === 'hi'
          ? `खाता ${currentPersona.profile.accountLast4} (${currentPersona.profile.bankName}) के लिए बैंक रिकॉर्ड प्राप्त किए जा रहे हैं...`
          : `Retrieving certified cheque record for A/C ending in ${currentPersona.profile.accountLast4} (${currentPersona.profile.bankName})...`
      );
    }, 700);

    setTimeout(() => {
      setCurrentStep(3);
      setStatusMessage(
        settings.language === 'hi'
          ? 'डिजिटल कैंसिल्ड चेक और वाटरमार्क तैयार किया जा रहा है...'
          : 'Generating cryptographically sealed & watermarked Cancelled Cheque...'
      );
    }, 1400);

    setTimeout(() => {
      setCurrentStep(4);
      setStatusMessage(
        settings.language === 'hi'
          ? 'स्वचालित ओसीआर सत्यापन: खाता संख्या और नाम 100% मेल खा रहे हैं...'
          : 'Running Automated OCR Verification: Account No, Payee Name & IFSC 100% matched...'
      );
    }, 2100);

    setTimeout(() => {
      setCurrentStep(5);
      setStatusMessage(
        settings.language === 'hi'
          ? 'सत्यापन पूर्ण! डिजिलॉकर डिजिटल हस्ताक्षर संलग्न किया गया।'
          : 'Complete! DigiLocker e-Sign & NPCI QR verification stamp attached.'
      );
      setIsCompleted(true);
      setIsProcessing(false);

      setTimeout(() => {
        onSuccess('digilocker', 'DigiLocker_Certified_Cheque.jpg');
      }, 1000);
    }, 2800);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('jpeg') && !file.type.includes('png') && !file.type.includes('pdf')) {
      setUploadError('Invalid format. Please upload JPG, PNG, or PDF file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File size exceeds 2MB limit.');
      return;
    }

    setUploadError(null);
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadPreviewUrl(url);
  };

  const handleConfirmManualUpload = () => {
    if (!uploadedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    setIsProcessing(true);
    setStatusMessage('Scanning document with OCR AI engine...');
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess('manual_upload', uploadedFile.name);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-800/80 text-[10px] font-bold text-blue-200 mb-0.5 border border-blue-700">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>EPFO Document Compliance</span>
              </div>
              <h2 className="text-base font-bold text-white">
                Cancelled Cheque & Bank Passbook Gateway
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => !isProcessing && setActiveTab('digilocker')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'digilocker'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Fill with DigiLocker (Instant 1-Click)</span>
          </button>
          <button
            type="button"
            onClick={() => !isProcessing && setActiveTab('upload')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-blue-900 text-blue-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload Scanned Cheque</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {activeTab === 'digilocker' ? (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3">
                <Building className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950">
                  <p className="font-bold">Automated 1-Click Bank Document Linking</p>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    DigiLocker directly fetches a certified, watermarked cancelled cheque corresponding to your registered bank account{' '}
                    <strong>{currentPersona.profile.bankName} (A/C ending in {currentPersona.profile.accountLast4})</strong>, guaranteed to pass EPFO OCR audits with 0% rejection risk.
                  </p>
                </div>
              </div>

              {/* Progress Stepper when running */}
              {currentStep > 0 && (
                <div className="bg-slate-950 rounded-xl p-4 text-white space-y-3 font-mono text-xs border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-bold text-slate-400">DIGILOCKER SECURE HANDSHAKE</span>
                    <span className="text-[10px] text-amber-400">NPCI / UIDAI Gateway</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className={currentStep >= 1 ? 'text-emerald-400 flex items-center gap-2' : 'text-slate-600 flex items-center gap-2'}>
                      {currentStep >= 1 ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                      <span>1. Connecting to DigiLocker Banking Vault</span>
                    </div>
                    <div className={currentStep >= 2 ? 'text-emerald-400 flex items-center gap-2' : 'text-slate-600 flex items-center gap-2'}>
                      {currentStep >= 2 ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                      <span>2. Querying Live Bank Records for A/C {currentPersona.profile.accountLast4}</span>
                    </div>
                    <div className={currentStep >= 3 ? 'text-emerald-400 flex items-center gap-2' : 'text-slate-600 flex items-center gap-2'}>
                      {currentStep >= 3 ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                      <span>3. Generating Certified & Watermarked Cheque</span>
                    </div>
                    <div className={currentStep >= 4 ? 'text-emerald-400 flex items-center gap-2' : 'text-slate-600 flex items-center gap-2'}>
                      {currentStep >= 4 ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                      <span>4. Automated OCR Check (Name & IFSC 100% Match)</span>
                    </div>
                    <div className={currentStep >= 5 ? 'text-emerald-400 flex items-center gap-2' : 'text-slate-600 flex items-center gap-2'}>
                      {currentStep >= 5 ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                      <span>5. Cryptographic E-Sign Attached</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-amber-300 text-[11px] flex items-center gap-2">
                    {isProcessing && <RefreshCw className="w-3 h-3 animate-spin shrink-0" />}
                    <span>{statusMessage}</span>
                  </div>
                </div>
              )}

              {/* Target Bank Card */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Target Bank Account</span>
                  <span className="font-bold text-slate-900">{currentPersona.profile.bankName}</span>
                  <span className="text-slate-500 block font-mono text-[11px]">
                    IFSC: {currentPersona.profile.ifsc} • A/C: •••• {currentPersona.profile.accountLast4}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                    DigiLocker Ready
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
                <input
                  type="file"
                  id="manual-cheque-input"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="manual-cheque-input" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    Click to select or drag and drop Cancelled Cheque / Bank Passbook
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports JPG, PNG, PDF (Max 2MB, Clear legible account number & name required)
                  </p>
                </label>
              </div>

              {uploadedFile && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <div>
                      <span className="font-bold text-emerald-950 block">{uploadedFile.name}</span>
                      <span className="text-[10px] text-emerald-700">
                        {(uploadedFile.size / 1024).toFixed(1)} KB • Ready for OCR check
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>256-bit Encrypted Government Vault</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>

            {activeTab === 'digilocker' ? (
              <button
                type="button"
                onClick={handleStartDigiLockerFetch}
                disabled={isProcessing || isCompleted}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Fetching Cheque...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Fill Cancelled Cheque via DigiLocker</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmManualUpload}
                disabled={isProcessing || !uploadedFile}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Upload...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Upload & Verify</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
