import React, { useState } from 'react';
import { ViewName, Persona, AppSettings } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  ArrowLeftRight,
  ArrowLeft,
  Building,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface TransferViewProps {
  currentPersona: Persona;
  onNavigate: (view: ViewName) => void;
  onTransferAccount: (memberId: string) => Promise<{ success: boolean; message: string; trackingId: string }>;
  settings: AppSettings;
  onShowToast: (title: string, message: string) => void;
}

export const TransferView: React.FC<TransferViewProps> = ({
  currentPersona,
  onNavigate,
  onTransferAccount,
  onShowToast,
}) => {
  const [transferringId, setTransferringId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const oldAccounts = currentPersona.oldAccounts || [];

  const handleStartTransfer = async (memberId: string) => {
    setTransferringId(memberId);
    try {
      const res = await onTransferAccount(memberId);
      setSuccessMessage(res.message);
      onShowToast('Transfer Request Prepared', `${res.message} (Ref: ${res.trackingId})`);
    } finally {
      setTransferringId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <Breadcrumbs currentView="transferView" onNavigate={onNavigate} />

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
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Transfer Old PF (One Member One EPF)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Consolidate previous employer PF balances directly into your current active account
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success banner if transfer triggered */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-2xl mb-6 flex items-start gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Transfer request prepared</h4>
            <p className="text-xs text-emerald-800 mt-0.5">
              {successMessage}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {oldAccounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            No old PF account found for this demo user
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            All accumulated PF balances for {currentPersona.name} are already consolidated under active Member ID {currentPersona.profile.employment.memberId}.
          </p>
          <button
            onClick={() => onNavigate('dashboardView')}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">One Member One EPF Account Initiative:</span>
              <p className="mt-0.5 text-blue-800">
                Transferring balances avoids loss of interest, preserves continuous service for EPS pension eligibility, and simplifies tax-free withdrawal.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {oldAccounts.map((account, index) => {
              const isTransferred = account.status === 'Transferred' || account.status === 'Transfer in progress';

              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Previous Account
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isTransferred
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {account.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {account.employer}
                      </h3>

                      <div className="text-xs text-slate-500 font-mono">
                        Member ID: <span className="text-slate-800 font-bold">{account.memberId}</span>
                      </div>

                      <div className="text-sm font-semibold text-slate-700">
                        Unclaimed Balance: <strong className="text-xl font-extrabold text-blue-700 ml-1">₹{account.balance.toLocaleString('en-IN')}</strong>
                      </div>

                      {account.trackingId && (
                        <div className="text-xs text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded inline-block">
                          Transfer Ref: <strong>{account.trackingId}</strong> ({account.transferDate})
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 pt-2">
                      {isTransferred ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Transfer Request In Progress</span>
                        </div>
                      ) : (
                        <button
                          id={`btn-start-transfer-${index}`}
                          onClick={() => handleStartTransfer(account.memberId)}
                          disabled={transferringId === account.memberId}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 px-5 rounded-xl transition-colors shadow-xs text-xs disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{transferringId === account.memberId ? 'Preparing Request...' : 'Start Transfer'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>How Form 13 Online Transfer Works:</span>
            </div>
            <p>
              1. Your transfer request is digitally routed to either your previous or current employer for digital signature validation.
            </p>
            <p>
              2. Once authorized, the regional EPFO field office transfers the ledger annexure-K to your current account.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
