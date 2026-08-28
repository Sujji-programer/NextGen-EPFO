import React from 'react';
import { ViewName, Persona, AppSettings } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  XCircle,
  HelpCircle,
  Building,
  Calendar,
  CreditCard,
  FileText,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface TrackingViewProps {
  currentPersona: Persona;
  onNavigate: (view: ViewName) => void;
  settings: AppSettings;
}

export const TrackingView: React.FC<TrackingViewProps> = ({
  currentPersona,
  onNavigate,
}) => {
  const activeClaim = currentPersona.activeClaim;
  const previousClaim = currentPersona.previousClaim;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <Breadcrumbs currentView="trackingView" onNavigate={onNavigate} />

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
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Track My Claim
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Transparent end-to-end claim status explained in plain, simple language
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Active Claim Timeline Card */}
        {activeClaim ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Active Claim
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ID: <strong className="text-slate-800">{activeClaim.claimId}</strong>
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {activeClaim.formType}
                </h3>
              </div>

              <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                <div className="text-[11px] text-slate-500">Submitted On:</div>
                <div className="text-xs font-bold text-slate-800">{activeClaim.submittedAt}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  {activeClaim.estimatedSettlement}
                </div>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="mt-8 relative">
              <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:h-full before:w-0.5 before:bg-slate-200">
                {activeClaim.steps.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs ${
                        step.completed
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                          : idx === activeClaim.currentStep
                          ? 'bg-blue-600 text-white ring-4 ring-blue-50 animate-pulse'
                          : 'bg-slate-100 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {step.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                        {step.date && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {step.date}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Empty Active Claim State */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              No active claim yet. Start EPFO Claim to file a claim.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              You do not have any pending withdrawal applications in progress. Run EPFO Claim to pre-check your records and submit with fast-track digital approval.
            </p>
            <button
              id="btn-goto-claim-doctor-from-track"
              onClick={() => onNavigate('claimDoctorView')}
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs py-3 px-6 rounded-xl transition-colors shadow-sm"
            >
              <Stethoscope className="w-4 h-4 text-amber-300" />
              <span>Start EPFO Claim</span>
            </button>
          </div>
        )}

        {/* Previous Rejected Claim Details (Especially for Meena Iyer) */}
        {previousClaim && (
          <div className="bg-white rounded-2xl border border-rose-200 shadow-xs p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Historical Record: Previous Claim Rejection Decoder
                </h3>
              </div>
              <span className="text-[11px] font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-300">
                Claim {previousClaim.status.toUpperCase()}
              </span>
            </div>

            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 mb-5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Claim Reference:</span>
                <span className="font-mono font-bold text-slate-900">{previousClaim.claimId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Form Type:</span>
                <span className="font-semibold text-slate-800">{previousClaim.formType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Official Portal Reason:</span>
                <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                  "{previousClaim.officialReason}"
                </span>
              </div>
            </div>

            {/* Plain English Translation */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1 text-sm">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Plain Language Translation:</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {previousClaim.translatedReason}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="font-bold text-blue-950 flex items-center gap-1.5 mb-1 text-sm">
                  <ArrowRight className="w-4 h-4 text-blue-700" />
                  <span>Recommended Action:</span>
                </div>
                <p className="text-blue-900 leading-relaxed mb-3">
                  {previousClaim.suggestedAction}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onNavigate('claimDoctorView')}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-3.5 rounded-lg text-xs transition-colors"
                  >
                    Fix via EPFO Claim
                  </button>
                  <button
                    onClick={() => onNavigate('grievanceView')}
                    className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold py-2 px-3.5 rounded-lg text-xs transition-colors"
                  >
                    Open Grievance Helper
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
