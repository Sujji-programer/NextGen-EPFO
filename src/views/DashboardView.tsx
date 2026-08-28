import React from 'react';
import { ViewName, Persona, AppSettings } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { downloadPassbookFile, formatINR } from '../utils/documentGenerator';
import {
  ArrowRight,
  CreditCard,
  ArrowLeftRight,
  Search,
  UserCheck,
  Download,
  ShieldCheck,
  Calculator,
  User,
  History,
  FileCheck2,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  currentPersona: Persona;
  onNavigate: (view: ViewName) => void;
  settings: AppSettings;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentPersona,
  onNavigate,
  settings,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  const total = currentPersona.balance.total;
  const employeeContrib = currentPersona.balance.employeeContribution;
  const employerContrib = currentPersona.balance.employerContribution;
  const interestEarned = currentPersona.balance.interest;
  const pensionFund = currentPersona.balance.pensionFund || 48200;

  // Formatting helper for Lakhs display if > 1 Lakh or formatted currency
  const formatLakhOrAmt = (val: number) => {
    if (val >= 100000) {
      const lk = (val / 100000).toFixed(2);
      return `₹${lk} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Distribution percentages
  const totalShares = employeeContrib + employerContrib + interestEarned;
  const eePct = Math.round((employeeContrib / totalShares) * 100) || 50;
  const erPct = Math.round((employerContrib / totalShares) * 100) || 30;
  const intPct = 100 - eePct - erPct;

  // Time based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.goodMorning;
    if (hour < 17) return t.goodAfternoon;
    return t.goodEvening;
  };

  // Recent synthetic contribution entries
  const recentContributions = [
    {
      month: 'Jul 2026',
      subtext: 'Posted 15 Aug',
      employer: currentPersona.profile.employment.employer || 'Cloudnine Systems India Ltd',
      you: 8640,
      employerAmt: 7390,
      pension: 1250,
      totalAmt: 16030,
    },
    {
      month: 'Jun 2026',
      subtext: 'Posted 15 Jul',
      employer: currentPersona.profile.employment.employer || 'Cloudnine Systems India Ltd',
      you: 8640,
      employerAmt: 7390,
      pension: 1250,
      totalAmt: 16030,
    },
    {
      month: 'May 2026',
      subtext: 'Posted 15 Jun',
      employer: currentPersona.profile.employment.employer || 'Cloudnine Systems India Ltd',
      you: 8640,
      employerAmt: 7390,
      pension: 1250,
      totalAmt: 16030,
    },
    {
      month: 'Apr 2026',
      subtext: 'Posted 15 May',
      employer: currentPersona.profile.employment.employer || 'Cloudnine Systems India Ltd',
      you: 8640,
      employerAmt: 7390,
      pension: 1250,
      totalAmt: 16030,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 font-sans">
      {/* 1. Header Overview & Greeting */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
          {t.overview}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-200 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            {getGreeting()}, {currentPersona.name.split(' ')[0]}
          </h1>
          <div className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-2">
            <span>UAN <strong className="font-mono text-slate-800">{currentPersona.uan}</strong></span>
            <span>•</span>
            <span className="text-slate-700 font-semibold">{currentPersona.profile.employment.employer}</span>
          </div>
        </div>
      </div>

      {/* 2. Stacked Balance & Recent Contributions (Down the total balance, not side-to-side) */}
      <div className="space-y-6 mb-8">
        {/* Total Balance Card (Full Width) */}
        <div
          id="total-balance-card"
          className="w-full bg-white rounded-xl border border-stone-200 p-6 sm:p-7 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:border-slate-400 hover:shadow-xs"
        >
          <div>
            {/* Header row with badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {t.totalBalance}
              </span>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {t.interestRateBadge}
              </span>
            </div>

            {/* Giant Balance */}
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-5">
              ₹{total.toLocaleString('en-IN')}
            </div>

            {/* Segmented Distribution Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden mb-4">
              <div
                className="h-full bg-slate-900 transition-all duration-500"
                style={{ width: `${eePct}%` }}
                title={`Employee Share: ${eePct}%`}
              />
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${erPct}%` }}
                title={`Employer Share: ${erPct}%`}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${intPct}%` }}
                title={`Interest Earned: ${intPct}%`}
              />
            </div>

            {/* Contribution Breakdown Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                  <span className="w-2 h-2 rounded-full bg-slate-900" />
                  <span className="truncate">{t.yourContributions}</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900">
                  {formatLakhOrAmt(employeeContrib)}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span className="truncate">{t.employerShare}</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900">
                  {formatLakhOrAmt(employerContrib)}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="truncate">{t.interestEarned}</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900">
                  {formatLakhOrAmt(interestEarned)}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row of Balance Card */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-600 flex items-center gap-1.5">
              <span>{t.pensionFund} <strong className="text-slate-900">₹{pensionFund.toLocaleString('en-IN')}</strong></span>
              <span className="text-slate-400">ⓘ</span>
              <span className="text-slate-500 text-[11px] hidden sm:inline">{t.pensionNote}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-download-passbook-card"
                onClick={() => downloadPassbookFile(currentPersona)}
                className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-all duration-150 border border-slate-300 shadow-2xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800"
                title="Download Official EPFO Passbook HTML/PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.downloadPassbook}</span>
              </button>

              <button
                id="btn-open-passbook-link"
                onClick={() => onNavigate('balanceView')}
                className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 px-2 py-1 rounded transition-all duration-150 hover:bg-blue-50 hover:ring-2 hover:ring-amber-400/80"
              >
                <span>{t.openPassbook}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Contributions Card (Directly below Total Balance) */}
        <div
          id="recent-contributions-card"
          className="w-full bg-white rounded-xl border border-stone-200 p-6 shadow-2xs transition-all duration-200 hover:border-slate-400 hover:shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {t.recentContributions}
                </h2>
              </div>
              <button
                onClick={() => onNavigate('balanceView')}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 transition-all px-2 py-1 rounded hover:bg-blue-50 hover:ring-2 hover:ring-amber-400/80"
              >
                {t.viewAll} →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50/80 text-stone-500 border-b border-stone-200 text-[11px] font-bold">
                    <th className="py-2.5 px-3">{t.month}</th>
                    <th className="py-2.5 px-3">Employer / Establishment</th>
                    <th className="py-2.5 px-3 text-right">{t.you}</th>
                    <th className="py-2.5 px-3 text-right">{t.employer}</th>
                    <th className="py-2.5 px-3 text-right">Pension Fund</th>
                    <th className="py-2.5 px-3 text-right">{t.total}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-slate-700">
                  {recentContributions.map((item, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.month}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.subtext}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium truncate max-w-[220px]">
                        {item.employer}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        ₹{item.you.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        ₹{item.employerAmt.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-purple-700">
                        ₹{item.pension.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        +₹{item.totalAmt.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-xs text-slate-500">
            <span>Last EPFO Central Ledger Sync: Today, 11:30 AM</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Direct Electronic Challan Return (ECR) Verified
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section: "What do you want to do?" (Interactive Action Cards) */}
      <div className="mb-8">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
          <span>{t.whatDoYouWantToDo}</span>
          <span className="text-xs text-slate-400 font-normal">Click any card to begin</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Withdraw / EPFO Claim */}
          <div
            id="action-card-withdraw"
            onClick={() => onNavigate('claimDoctorView')}
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs transition-all duration-200 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 hover:shadow-md cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-slate-800 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                {t.withdraw} ({t.epfoClaim})
              </h3>
              <p className="text-xs text-slate-500">
                {t.withdrawDesc}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-700">
              <span>{t.continue}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. File e-Nomination (Separate statutory workflow) */}
          <div
            id="action-card-enomination"
            onClick={() => onNavigate('nominationView')}
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs transition-all duration-200 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 hover:shadow-md cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {t.eNomination || 'File e-Nomination'}
                </h3>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-200">
                  Form 2
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Declare beneficiaries for EPF & EPS pension schemes with instant Aadhaar e-Sign authentication.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-700">
              <span>Start Nomination</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Transfer */}
          <div
            id="action-card-transfer"
            onClick={() => onNavigate('transferView')}
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs transition-all duration-200 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 hover:shadow-md cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-slate-800 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                {t.transfer}
              </h3>
              <p className="text-xs text-slate-500">
                {t.transferDesc}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-700">
              <span>{t.continue}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. Track a claim */}
          <div
            id="action-card-track"
            onClick={() => onNavigate('trackingView')}
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs transition-all duration-200 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 hover:shadow-md cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-slate-800 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                {t.trackClaim}
              </h3>
              <p className="text-xs text-slate-500">
                {t.trackClaimDesc}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-700">
              <span>{t.continue}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 5. Statutory PF Calculator */}
          <div
            id="action-card-calculator"
            onClick={() => onNavigate('calculatorView')}
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs transition-all duration-200 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 hover:shadow-md cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-slate-800 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                {t.calculator}
              </h3>
              <p className="text-xs text-slate-500">
                Calculate statutory withdrawal limits for illness, marriage, housing, or retirement under EPFO rules.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-700">
              <span>{t.continue}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 6. Profile & KYC */}
          <div
            id="action-card-profile"
            onClick={() => onNavigate('profileView')}
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs transition-all duration-200 hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 hover:shadow-md cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-slate-800 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">
                {t.profileKyc}
              </h3>
              <p className="text-xs text-slate-500">
                Inspect Aadhaar, PAN seeding, bank account verification, and employer demographic details.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-700">
              <span>{t.continue}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
