import React, { useState } from 'react';
import { ViewName, Persona, AppSettings } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { downloadPassbookFile } from '../utils/documentGenerator';
import {
  Wallet,
  ArrowLeft,
  Info,
  TrendingUp,
  Download,
  Calendar,
  Building,
  User,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface BalanceViewProps {
  currentPersona: Persona;
  onNavigate: (view: ViewName) => void;
  settings: AppSettings;
  onShowToast: (title: string, message: string) => void;
}

export const BalanceView: React.FC<BalanceViewProps> = ({
  currentPersona,
  onNavigate,
  onShowToast,
}) => {
  const [selectedYear, setSelectedYear] = useState('2025-26');
  const b = currentPersona.balance;

  const handleDownload = () => {
    downloadPassbookFile(currentPersona);
    onShowToast('Passbook Downloaded', 'Official EPF Passbook ledger file downloaded.');
  };

  const syntheticPassbookRows = [
    {
      month: 'May 2026',
      epfWage: '₹42,000',
      eeShare: '₹5,040',
      erShare: '₹1,540',
      pension: '₹3,500',
      date: '15/06/2026',
    },
    {
      month: 'Apr 2026',
      epfWage: '₹42,000',
      eeShare: '₹5,040',
      erShare: '₹1,540',
      pension: '₹3,500',
      date: '15/05/2026',
    },
    {
      month: 'Mar 2026',
      epfWage: '₹42,000',
      eeShare: '₹5,040',
      erShare: '₹1,540',
      pension: '₹3,500',
      date: '15/04/2026',
    },
    {
      month: 'Feb 2026',
      epfWage: '₹42,000',
      eeShare: '₹5,040',
      erShare: '₹1,540',
      pension: '₹3,500',
      date: '15/03/2026',
    },
    {
      month: 'Jan 2026',
      epfWage: '₹42,000',
      eeShare: '₹5,040',
      erShare: '₹1,540',
      pension: '₹3,500',
      date: '15/02/2026',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <Breadcrumbs currentView="balanceView" onNavigate={onNavigate} />

      {/* Header & Back Navigation */}
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
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                PF Balance & Passbook
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Detailed synthetic breakdown of employee share, employer share, and accrued interest
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownload}
          id="btn-download-passbook"
          className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-300 shadow-2xs transition-colors text-xs"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>Download e-Passbook (PDF)</span>
        </button>
      </div>

      {/* Synthetic Data Note */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
        <Info className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          <strong>Synthetic balance for demo only:</strong> Figures shown below simulate an active EPF member ledger. No actual funds are accessed.
        </span>
      </div>

      {/* Main Total Balance Showcase */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-lg border border-blue-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">
              Total Accumulated EPF Balance
            </div>
            <div className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              ₹{b.total.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-blue-200">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Last Updated: <strong>{b.lastUpdated}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                Interest Rate: 8.25% p.a.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('claimDoctorView')}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-5 py-3 rounded-xl text-xs transition-colors shadow-sm"
            >
              Withdraw Funds via EPFO Claim
            </button>
          </div>
        </div>
      </div>

      {/* 4-Stat Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Employee Contribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold">Employee Share</span>
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{b.employeeContribution.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">12% standard monthly deduction</div>
        </div>

        {/* Employer Contribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold">Employer Share</span>
            <Building className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{b.employerContribution.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">3.67% remitted directly to EPF</div>
        </div>

        {/* Interest Earned */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold">Total Interest Accrued</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            ₹{b.interest.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Compound interest added annually</div>
        </div>

        {/* Pension Fund Share */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold">EPS Pension Fund</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{(b.pensionFund || 35000).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">8.33% employer share towards EPS-95</div>
        </div>
      </div>

      {/* Monthly Passbook Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Passbook Ledger Transactions</span>
            </h3>
            <p className="text-xs text-slate-500">
              Establishment: {currentPersona.profile.employment.employer} ({currentPersona.profile.employment.memberId})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Financial Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800"
            >
              <option value="2025-26">FY 2025-2026</option>
              <option value="2024-25">FY 2024-2025</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Wage Month</th>
                <th className="px-5 py-3">EPF Wages</th>
                <th className="px-5 py-3">Employee Share (12%)</th>
                <th className="px-5 py-3">Employer Share (3.67%)</th>
                <th className="px-5 py-3">Pension Fund (8.33%)</th>
                <th className="px-5 py-3">Credit Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {syntheticPassbookRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{row.month}</td>
                  <td className="px-5 py-3.5 text-slate-600 font-mono">{row.epfWage}</td>
                  <td className="px-5 py-3.5 text-blue-700 font-mono font-semibold">{row.eeShare}</td>
                  <td className="px-5 py-3.5 text-indigo-700 font-mono">{row.erShare}</td>
                  <td className="px-5 py-3.5 text-purple-700 font-mono">{row.pension}</td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
