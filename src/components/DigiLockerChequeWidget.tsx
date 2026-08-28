import React, { useState } from 'react';
import { Persona, AppSettings } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { DigiLockerChequeModal } from './DigiLockerChequeModal';
import { CancelledChequePreviewModal } from './CancelledChequePreviewModal';
import { MockBackend } from '../services/mockBackend';
import {
  FileText,
  ShieldCheck,
  Sparkles,
  Eye,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface DigiLockerChequeWidgetProps {
  currentPersona: Persona;
  onRefreshPersona: () => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'warning' | 'info') => void;
  settings: AppSettings;
  compact?: boolean;
}

export const DigiLockerChequeWidget: React.FC<DigiLockerChequeWidgetProps> = ({
  currentPersona,
  onRefreshPersona,
  onShowToast,
  settings,
  compact = false,
}) => {
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const p = currentPersona.profile;
  const isUploaded = p.chequeStatus === 'valid' && Boolean(p.chequeFileName);
  const isDigiLocker = p.chequeSource === 'digilocker' || (!p.chequeSource && p.chequeFileName?.includes('DigiLocker'));

  const handleSuccessFetch = async (source: 'digilocker' | 'manual_upload', fileName: string) => {
    setIsFetchModalOpen(false);
    setIsSubmitting(true);
    try {
      if (source === 'digilocker') {
        const res = await MockBackend.fetchDigiLockerCheque(currentPersona.id);
        if (onShowToast) {
          onShowToast('DigiLocker Cheque Linked', res.message, 'success');
        }
      } else {
        const res = await MockBackend.uploadManualCheque(currentPersona.id, fileName);
        if (onShowToast) {
          onShowToast('Cheque Document Uploaded', res.message, 'success');
        }
      }
      onRefreshPersona();
    } catch (err: any) {
      if (onShowToast) {
        onShowToast('Error', err.message || 'Failed to update cheque', 'warning');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    setIsPreviewModalOpen(false);
    setIsSubmitting(true);
    try {
      const res = await MockBackend.removeChequeDocument(currentPersona.id);
      if (onShowToast) {
        onShowToast('Cheque Removed', res.message, 'info');
      }
      onRefreshPersona();
    } catch (err: any) {
      if (onShowToast) {
        onShowToast('Error', err.message || 'Failed to remove cheque', 'warning');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplace = () => {
    setIsPreviewModalOpen(false);
    setIsFetchModalOpen(true);
  };

  return (
    <>
      <div
        id="widget-digilocker-cheque"
        className={`rounded-2xl border transition-all ${
          isUploaded
            ? 'bg-emerald-50/40 border-emerald-200'
            : 'bg-amber-50/40 border-amber-200'
        } ${compact ? 'p-4' : 'p-5'}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isUploaded
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isUploaded ? (
                <ShieldCheck className="w-6 h-6 text-emerald-700" />
              ) : (
                <FileText className="w-6 h-6 text-amber-700" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-slate-950">
                  {settings.language === 'hi' ? 'कैंसिल्ड चेक / बैंक पासबुक' : 'Cancelled Cheque & Bank Passbook'}
                </h4>
                {isUploaded ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    {isDigiLocker ? 'DigiLocker Certified' : 'Verified Upload'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" />
                    {settings.language === 'hi' ? 'लंबित (अनलोड)' : 'Pending / Not Linked'}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 mt-1">
                {isUploaded ? (
                  <>
                    Linked File: <strong className="font-mono text-slate-900">{p.chequeFileName}</strong>{' '}
                    ({p.bankName || 'Bank Account'}, A/C ending in {p.accountLast4})
                  </>
                ) : (
                  <>
                    {settings.language === 'hi'
                      ? 'अस्वीकृति से बचने के लिए डिजिलॉकर से प्रमाणित चेक भरें या स्कैन की गई कॉपी अपलोड करें।'
                      : 'Attach a certified cancelled cheque to prevent portal rejection due to unreadable bank documents.'}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            {isUploaded ? (
              <>
                <button
                  type="button"
                  id="btn-preview-cheque"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>{settings.language === 'hi' ? 'चेक पूर्वावलोकन' : 'Preview Cheque'}</span>
                </button>

                <button
                  type="button"
                  id="btn-replace-cheque"
                  onClick={handleReplace}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 transition-colors"
                  title="Replace with new copy"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{settings.language === 'hi' ? 'बदलें' : 'Replace'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  id="btn-fill-digilocker-cheque"
                  onClick={() => setIsFetchModalOpen(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{settings.language === 'hi' ? 'डिजिलॉकर से चेक भरें' : 'Fill with DigiLocker'}</span>
                </button>

                <button
                  type="button"
                  id="btn-upload-cheque-modal"
                  onClick={() => setIsFetchModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>{settings.language === 'hi' ? 'अपलोड करें' : 'Upload Copy'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Modals */}
      <DigiLockerChequeModal
        isOpen={isFetchModalOpen}
        onClose={() => setIsFetchModalOpen(false)}
        currentPersona={currentPersona}
        onSuccess={handleSuccessFetch}
        settings={settings}
      />

      <CancelledChequePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        currentPersona={currentPersona}
        onReplace={handleReplace}
        onRemove={handleRemove}
        onShowToast={onShowToast}
        settings={settings}
      />
    </>
  );
};
