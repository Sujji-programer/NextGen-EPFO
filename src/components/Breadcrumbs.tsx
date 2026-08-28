import React from 'react';
import { ViewName } from '../types';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  titleMap?: Record<ViewName, string>;
}

const DEFAULT_TITLES: Record<ViewName, string> = {
  loginView: 'Demo Login',
  dashboardView: 'Citizen Dashboard',
  claimDoctorView: 'Claim Diagnostic',
  balanceView: 'PF Balance & Passbook',
  transferView: 'Transfer Old PF (Form 13)',
  trackingView: 'Track My Claim Status',
  profileView: 'Member Profile & KYC',
  grievanceView: 'EPFiGMS Grievance Helper',
  calculatorView: 'PF Withdrawal Calculator',
  nominationView: 'e-Nomination Filing',
  assistantView: 'gpt Help Assistant',
  settingsView: 'Portal Settings',
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  currentView,
  onNavigate,
  titleMap = DEFAULT_TITLES,
}) => {
  if (currentView === 'loginView' || currentView === 'dashboardView') {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center space-x-2 text-sm text-slate-500">
      <button
        onClick={() => onNavigate('dashboardView')}
        className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-blue-700 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
      >
        <Home className="w-4 h-4" />
        <span>Dashboard</span>
      </button>
      <ChevronRight className="w-4 h-4 text-slate-400" />
      <span className="font-semibold text-slate-900 truncate" aria-current="page">
        {titleMap[currentView] || currentView}
      </span>
    </nav>
  );
};
