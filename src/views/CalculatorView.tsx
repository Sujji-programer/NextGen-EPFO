import React, { useState, useEffect, useMemo } from 'react';
import { ViewName, Persona, AppSettings, CalculationResult, PresetClaimData } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { TRANSLATIONS } from '../data/translations';
import { downloadCalculationReceiptFile } from '../utils/documentGenerator';
import {
  Calculator,
  ArrowLeft,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Building,
  ArrowRight,
  Printer,
  Download,
  X,
  Clock,
  Zap,
  TrendingDown,
  HelpCircle,
  Percent,
} from 'lucide-react';
import { sanitizeNumericInput, handleNumericChange } from '../utils/numericInput';

interface CalculatorViewProps {
  currentPersona: Persona;
  onNavigate: (view: ViewName) => void;
  settings: AppSettings;
  onShowToast?: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onApplyClaim?: (preset: PresetClaimData) => void;
}


// Table D factor lookup (EPS 1995 Table D)
const TABLE_D_FACTORS: Record<number, number> = {
  1: 1.02,
  2: 2.05,
  3: 3.12,
  4: 4.22,
  5: 5.35,
  6: 6.51,
  7: 7.71,
  8: 8.94,
  9: 10.20,
};

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  currentPersona,
  onNavigate,
  settings,
  onShowToast,
  onApplyClaim,
}) => {

  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  // 1. Interactive Control Panel Inputs (maintained as sanitized strings to prevent leading zero bugs)
  const [basicPayStr, setBasicPayStr] = useState<string>(String(currentPersona.monthlyBasicPay || 35000));
  const [serviceYearsStr, setServiceYearsStr] = useState<string>(String(currentPersona.serviceYears || 4));
  const [serviceMonthsStr, setServiceMonthsStr] = useState<string>(String(currentPersona.serviceMonths || 6));

  // Accumulated Balances (Separate editable fields)
  const [eeBalanceStr, setEeBalanceStr] = useState<string>(String(currentPersona.balance.employeeContribution || 122000));
  const [erBalanceStr, setErBalanceStr] = useState<string>(String(currentPersona.balance.employerContribution || 68000));
  const [pensionBalanceStr, setPensionBalanceStr] = useState<string>(String(currentPersona.balance.pensionFund || 44000));

  // Claim Type Selector
  type ClaimType = 'form31' | 'form19' | 'form10c';
  const [claimType, setClaimType] = useState<ClaimType>('form31');

  // Purpose of Advance for Form 31
  type Form31Reason = 'illness' | 'marriage' | 'education' | 'house_purchase' | 'site_purchase' | 'home_loan';
  const [advanceReason, setAdvanceReason] = useState<Form31Reason>('illness');

  // Requested Amount
  const [requestedAmountStr, setRequestedAmountStr] = useState<string>('50000');

  // Tax/KYC Toggles
  const [isPanLinked, setIsPanLinked] = useState<boolean>(currentPersona.profile.panSeeded ?? true);
  const [isForm15gUploaded, setIsForm15gUploaded] = useState<boolean>(false);

  // Modal for printable receipt
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Numeric derivations
  const basicPay = parseFloat(basicPayStr) || 0;
  const serviceYears = parseInt(serviceYearsStr, 10) || 0;
  const serviceMonths = parseInt(serviceMonthsStr, 10) || 0;
  const eeBalance = parseFloat(eeBalanceStr) || 0;
  const erBalance = parseFloat(erBalanceStr) || 0;
  const pensionBalance = parseFloat(pensionBalanceStr) || 0;
  const requestedAmount = parseFloat(requestedAmountStr) || 0;

  // Sync with persona changes
  useEffect(() => {
    setBasicPayStr(String(currentPersona.monthlyBasicPay || 35000));
    setServiceYearsStr(String(currentPersona.serviceYears || 4));
    setServiceMonthsStr(String(currentPersona.serviceMonths || 6));
    setEeBalanceStr(String(currentPersona.balance.employeeContribution || 0));
    setErBalanceStr(String(currentPersona.balance.employerContribution || 0));
    setPensionBalanceStr(String(currentPersona.balance.pensionFund || 44000));
    setIsPanLinked(currentPersona.profile.panSeeded);
  }, [currentPersona.id]);

  // Total continuous service in decimal years
  const totalServiceYears = useMemo(() => {
    return Number((serviceYears + serviceMonths / 12).toFixed(2));
  }, [serviceYears, serviceMonths]);

  // Total accumulated PF balance
  const totalPfBalance = useMemo(() => {
    return eeBalance + erBalance;
  }, [eeBalance, erBalance]);

  // 2. Real-Time Calculation Logic Engine
  const calculation = useMemo<CalculationResult>(() => {
    if (claimType === 'form31') {
      let maxEntitlement = 0;
      let minServiceRequired = 0;
      let reasonName = '';
      let ruleExplanation = '';
      let isEligible = true;

      if (advanceReason === 'illness') {
        minServiceRequired = 0;
        reasonName = 'Illness / Medical Treatment (Para 68J)';
        // min(Requested, 6 * (Basic + DA), Employee Share)
        const sixMonthsBasic = 6 * basicPay;
        maxEntitlement = Math.min(sixMonthsBasic, eeBalance);
        ruleExplanation = `Up to 6 months' Basic + DA (₹${sixMonthsBasic.toLocaleString('en-IN')}) or Employee Share (₹${eeBalance.toLocaleString('en-IN')}), whichever is lower. No minimum service required.`;
      } else if (advanceReason === 'marriage') {
        minServiceRequired = 7;
        reasonName = 'Marriage of Self / Children / Sibling (Para 68K)';
        if (totalServiceYears < 7) {
          isEligible = false;
          maxEntitlement = 0;
          ruleExplanation = `Requires minimum 7 years of continuous service. Current service is ${serviceYears} yrs ${serviceMonths} mos.`;
        } else {
          // 50% of employee contribution
          maxEntitlement = Math.round(0.5 * eeBalance);
          ruleExplanation = `Up to 50% of Employee Share with interest (₹${maxEntitlement.toLocaleString('en-IN')}). Allowed up to 3 times in entire service.`;
        }
      } else if (advanceReason === 'education') {
        minServiceRequired = 7;
        reasonName = 'Higher Post-Matriculation Education (Para 68K)';
        if (totalServiceYears < 7) {
          isEligible = false;
          maxEntitlement = 0;
          ruleExplanation = `Requires minimum 7 years of continuous service. Current service is ${serviceYears} yrs ${serviceMonths} mos.`;
        } else {
          maxEntitlement = Math.round(0.5 * eeBalance);
          ruleExplanation = `Up to 50% of Employee Share (₹${maxEntitlement.toLocaleString('en-IN')}). Allowed up to 3 times for children's higher education.`;
        }
      } else if (advanceReason === 'house_purchase') {
        minServiceRequired = 5;
        reasonName = 'House / Flat Purchase / Construction (Para 68B)';
        if (totalServiceYears < 5) {
          isEligible = false;
          maxEntitlement = 0;
          ruleExplanation = `Requires minimum 5 years of continuous service. Current service is ${serviceYears} yrs ${serviceMonths} mos.`;
        } else {
          // 36 months basic+da or total balance (EE + ER)
          const thirtySixMonthsBasic = 36 * basicPay;
          maxEntitlement = Math.min(thirtySixMonthsBasic, totalPfBalance);
          ruleExplanation = `Up to 36 months' Basic + DA (₹${thirtySixMonthsBasic.toLocaleString('en-IN')}) or total accumulated PF balance (₹${totalPfBalance.toLocaleString('en-IN')}), whichever is lower.`;
        }
      } else if (advanceReason === 'site_purchase') {
        minServiceRequired = 5;
        reasonName = 'Purchase of Site / Land (Para 68B)';
        if (totalServiceYears < 5) {
          isEligible = false;
          maxEntitlement = 0;
          ruleExplanation = `Requires minimum 5 years of continuous service. Current service is ${serviceYears} yrs ${serviceMonths} mos.`;
        } else {
          const twentyFourMonthsBasic = 24 * basicPay;
          maxEntitlement = Math.min(twentyFourMonthsBasic, totalPfBalance);
          ruleExplanation = `Up to 24 months' Basic + DA (₹${twentyFourMonthsBasic.toLocaleString('en-IN')}) or total accumulated PF balance (₹${totalPfBalance.toLocaleString('en-IN')}), whichever is lower.`;
        }
      } else if (advanceReason === 'home_loan') {
        minServiceRequired = 10;
        reasonName = 'Repayment of Housing Loan (Para 68BB)';
        if (totalServiceYears < 10) {
          isEligible = false;
          maxEntitlement = 0;
          ruleExplanation = `Requires minimum 10 years of continuous service. Current service is ${serviceYears} yrs ${serviceMonths} mos.`;
        } else {
          const thirtySixMonthsBasic = 36 * basicPay;
          maxEntitlement = Math.min(thirtySixMonthsBasic, totalPfBalance);
          ruleExplanation = `Up to 36 months' Basic + DA (₹${thirtySixMonthsBasic.toLocaleString('en-IN')}) or total accumulated PF balance (₹${totalPfBalance.toLocaleString('en-IN')}), whichever is lower.`;
        }
      }

      // Approved amount is capped at maxEntitlement and requestedAmount
      const approved = isEligible ? Math.min(requestedAmount, maxEntitlement) : 0;
      // Auto-Settlement Rule: If Illness & Eligible <= ₹5,00,000 -> Auto settlement mode active
      const autoSettlementActive = isEligible && advanceReason === 'illness' && approved <= 500000;

      return {
        eligible: isEligible,
        eligibilityStatus: isEligible ? 'Eligible' : 'May not be eligible',
        maxAmount: maxEntitlement,
        requestedAmount: requestedAmount,
        approvedAmount: approved,
        category: `PF Advance (Form 31) - ${reasonName}`,
        explanation: ruleExplanation,
        tdsApplicable: false,
        tdsPercent: 0,
        tdsAmount: 0,
        netPayableAmount: approved,
        taxNote: '100% Tax-Free: All Form 31 non-refundable advances are completely exempt from income tax and TDS.',
        autoSettlementActive,
        disclaimer: 'Official EPFO Scheme 1952 statutory rules apply.',
      };
    }

    if (claimType === 'form19') {
      const totalPayout = totalPfBalance;
      let tdsPercent = 0;
      let tdsAmount = 0;
      let taxNote = '';

      if (totalServiceYears >= 5) {
        tdsPercent = 0;
        tdsAmount = 0;
        taxNote = '100% Tax-Exempt: Continuous service exceeds 5 years statutory threshold under Section 192A.';
      } else if (totalPayout < 50000) {
        tdsPercent = 0;
        tdsAmount = 0;
        taxNote = 'Tax-Exempt: Total withdrawal amount is under ₹50,000 threshold.';
      } else {
        // Service < 5 years and Total Payout >= 50,000
        if (isForm15gUploaded) {
          tdsPercent = 0;
          tdsAmount = 0;
          taxNote = '0% TDS: Form 15G/15H declaration submitted (Zero tax declaration).';
        } else if (isPanLinked) {
          tdsPercent = 10;
          tdsAmount = Math.round(totalPayout * 0.10);
          taxNote = '10% TDS: Valid PAN linked. 10% TDS deducted under Section 192A.';
        } else {
          // Unseeded PAN -> 34.608% MMR
          tdsPercent = 34.608;
          tdsAmount = Math.round(totalPayout * 0.34608);
          taxNote = 'CRITICAL 34.608% TDS: No PAN seeded! Highest marginal rate (MMR) deducted under Section 206AA.';
        }
      }

      const approved = Math.min(requestedAmount || totalPayout, totalPayout);
      const calculatedTds = Math.round((approved * tdsPercent) / 100);
      const netPayable = approved - calculatedTds;

      return {
        eligible: true,
        eligibilityStatus: 'Eligible',
        maxAmount: totalPayout,
        requestedAmount: approved,
        approvedAmount: approved,
        category: 'Only PF Withdrawal (Form 19 - Full & Final)',
        explanation: 'Full Final Settlement of Employee Share + Employer Share (available after 2 months of job cessation).',
        tdsApplicable: tdsPercent > 0,
        tdsPercent,
        tdsAmount: calculatedTds,
        netPayableAmount: netPayable,
        taxNote,
        disclaimer: 'Employees Provident Fund Scheme 1952 Section 192A taxation guidelines apply.',
      };
    }

    if (claimType === 'form10c') {
      if (totalServiceYears < 0.5) {
        return {
          eligible: false,
          eligibilityStatus: 'May not be eligible',
          maxAmount: 0,
          requestedAmount: 0,
          approvedAmount: 0,
          category: 'Pension Withdrawal (Form 10C)',
          explanation: 'Requires minimum 6 months (0.5 years) of pensionable service to claim lump-sum EPS withdrawal.',
          tdsApplicable: false,
          tdsPercent: 0,
          tdsAmount: 0,
          netPayableAmount: 0,
          taxNote: 'N/A',
          disclaimer: 'EPS 1995 Table D Rules apply.',
        };
      }

      if (totalServiceYears >= 9.5) {
        return {
          eligible: false,
          schemeCertMandatory: true,
          eligibilityStatus: 'May not be eligible',
          maxAmount: 0,
          requestedAmount: 0,
          approvedAmount: 0,
          category: 'Mandatory Scheme Certificate (Form 10C / 10D)',
          explanation: `Total pensionable service is ${totalServiceYears} years (>= 9.5 years). Lump-sum cash withdrawal is strictly blocked under EPS 1995. You must apply for a Scheme Certificate to receive monthly pension after attaining age 58.`,
          tdsApplicable: false,
          tdsPercent: 0,
          tdsAmount: 0,
          netPayableAmount: 0,
          taxNote: 'EPS Scheme Certificate guarantees service accumulation for lifelong monthly superannuation pension.',
          disclaimer: 'Employees Pension Scheme (EPS) 1995 statutory rules apply.',
        };
      }

      // 0.5 <= Service < 9.5 years -> Table D factor applied
      const roundedYears = Math.min(9, Math.max(1, Math.round(totalServiceYears)));
      const factor = TABLE_D_FACTORS[roundedYears] || (roundedYears * 1.05);
      const calculatedPensionPayout = Math.round(pensionBalance);
      const approved = Math.min(requestedAmount || calculatedPensionPayout, calculatedPensionPayout);

      return {
        eligible: true,
        eligibilityStatus: 'Eligible',
        maxAmount: calculatedPensionPayout,
        requestedAmount: approved,
        approvedAmount: approved,
        tableDFactor: factor,
        category: `Only Pension Withdrawal (Form 10C - Table D Factor: ${factor}x)`,
        explanation: `Service is ${serviceYears} yrs ${serviceMonths} mos (less than 10 yrs). Lump-sum EPS withdrawal benefit computed under Table D factor for completed years of service.`,
        tdsApplicable: false,
        tdsPercent: 0,
        tdsAmount: 0,
        netPayableAmount: approved,
        taxNote: '100% Tax-Free: Lump-sum EPS pension withdrawal is completely exempt from income tax and TDS.',
        disclaimer: 'EPS 1995 Table D schedule statutory formulas apply.',
      };
    }

    return {
      eligible: false,
      maxAmount: 0,
      category: 'Unknown',
      explanation: 'Please check inputs.',
      tdsApplicable: false,
      tdsPercent: 0,
      taxNote: '',
    };
  }, [
    claimType,
    advanceReason,
    basicPay,
    serviceYears,
    serviceMonths,
    totalServiceYears,
    eeBalance,
    erBalance,
    pensionBalance,
    totalPfBalance,
    requestedAmount,
    isPanLinked,
    isForm15gUploaded,
  ]);

  // Adjust requested amount when maxAmount changes
  const handlePresetPercentage = (pct: number) => {
    if (calculation.maxAmount > 0) {
      setRequestedAmountStr(String(Math.round(calculation.maxAmount * (pct / 100))));
    }
  };

  const handleDownloadReceipt = () => {
    downloadCalculationReceiptFile({
      persona: currentPersona,
      category: calculation.category,
      basicSalary: basicPay,
      serviceYears,
      serviceMonths,
      totalServiceYears,
      eeBalance,
      erBalance,
      pensionBalance,
      maxAmount: calculation.maxAmount,
      requestedAmount: calculation.requestedAmount || requestedAmount,
      approvedAmount: calculation.approvedAmount,
      tdsPercent: calculation.tdsPercent,
      tdsAmount: calculation.tdsAmount,
      netPayableAmount: calculation.netPayableAmount,
      explanation: calculation.explanation,
      taxNote: calculation.taxNote,
      isAutoSettlement: !!calculation.autoSettlementActive,
    });
    if (onShowToast) {
      onShowToast('Receipt Downloaded', 'Official EPFO statutory calculation receipt downloaded successfully.', 'success');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 font-sans">
      <Breadcrumbs currentView="calculatorView" onNavigate={onNavigate} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => onNavigate('dashboardView')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 mb-2 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                PF Eligibility &amp; Statutory Limit Calculator
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Official statutory rules engine for Form 31 (Advances), Form 19 (Final Settlement), and Form 10C (Pension).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-download-calc-receipt-top"
            onClick={handleDownloadReceipt}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>Download Receipt</span>
          </button>

          <button
            id="btn-view-calc-receipt-top"
            onClick={() => setShowReceiptModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>View / Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs (Col 6) vs Results (Col 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Control Panel */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  1. Custom Variable Tuning Panel
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Real-Time Tuning
              </span>
            </div>

            {/* Monthly Basic + DA (Input with slider) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="basic-pay-input" className="text-xs font-bold text-slate-800">
                  Monthly Basic Salary + DA (₹):
                </label>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  ₹{basicPay.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                id="basic-pay-slider"
                type="range"
                min={10000}
                max={250000}
                step={1000}
                value={basicPay || 0}
                onChange={(e) => setBasicPayStr(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-2"
              />
              <div className="flex gap-2">
                <input
                  id="basic-pay-input"
                  type="text"
                  inputMode="numeric"
                  value={basicPayStr}
                  onChange={handleNumericChange(setBasicPayStr)}
                  className="w-full text-xs font-bold p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  placeholder="Enter Basic + DA"
                />
              </div>
            </div>

            {/* Total Service Tenure (Years & Months) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Total Service Tenure (Continuous Employment):
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="service-years-input" className="text-[11px] text-slate-500 block mb-1">
                    Years
                  </label>
                  <input
                    id="service-years-input"
                    type="text"
                    inputMode="numeric"
                    value={serviceYearsStr}
                    onChange={handleNumericChange(setServiceYearsStr)}
                    className="w-full text-xs font-bold p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="service-months-input" className="text-[11px] text-slate-500 block mb-1">
                    Months
                  </label>
                  <input
                    id="service-months-input"
                    type="text"
                    inputMode="numeric"
                    value={serviceMonthsStr}
                    onChange={handleNumericChange(setServiceMonthsStr)}
                    className="w-full text-xs font-bold p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Total Service: <strong>{totalServiceYears} Years</strong></span>
                <span className={totalServiceYears >= 5 ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                  {totalServiceYears >= 5 ? '✓ 5+ Yrs (Tax-Exempt)' : '⚠ < 5 Yrs (TDS Norms Apply)'}
                </span>
              </div>
            </div>

            {/* Accumulated Balances (Separate editable fields) */}
            <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                Accumulated Ledger Balances (₹):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label htmlFor="ee-balance-input" className="text-[11px] text-slate-600 block mb-1">
                    Employee Share
                  </label>
                  <input
                    id="ee-balance-input"
                    type="text"
                    inputMode="numeric"
                    value={eeBalanceStr}
                    onChange={handleNumericChange(setEeBalanceStr)}
                    className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="er-balance-input" className="text-[11px] text-slate-600 block mb-1">
                    Employer Share
                  </label>
                  <input
                    id="er-balance-input"
                    type="text"
                    inputMode="numeric"
                    value={erBalanceStr}
                    onChange={handleNumericChange(setErBalanceStr)}
                    className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="eps-balance-input" className="text-[11px] text-slate-600 block mb-1">
                    EPS Pension
                  </label>
                  <input
                    id="eps-balance-input"
                    type="text"
                    inputMode="numeric"
                    value={pensionBalanceStr}
                    onChange={handleNumericChange(setPensionBalanceStr)}
                    className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>
              <div className="text-[11px] text-slate-600 flex justify-between pt-1 border-t border-stone-200">
                <span>Total PF Balance (EE + ER):</span>
                <strong className="font-mono text-slate-900">₹{totalPfBalance.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Claim Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Claim Type Selector:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  id="claim-type-form31"
                  onClick={() => setClaimType('form31')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    claimType === 'form31'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold">PF Advance</div>
                  <div className={`text-[11px] ${claimType === 'form31' ? 'text-blue-200' : 'text-slate-500'}`}>
                    Form 31
                  </div>
                </button>

                <button
                  type="button"
                  id="claim-type-form19"
                  onClick={() => setClaimType('form19')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    claimType === 'form19'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold">Only PF Withdrawal</div>
                  <div className={`text-[11px] ${claimType === 'form19' ? 'text-blue-200' : 'text-slate-500'}`}>
                    Form 19 (Full)
                  </div>
                </button>

                <button
                  type="button"
                  id="claim-type-form10c"
                  onClick={() => setClaimType('form10c')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    claimType === 'form10c'
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold">Pension Withdrawal</div>
                  <div className={`text-[11px] ${claimType === 'form10c' ? 'text-blue-200' : 'text-slate-500'}`}>
                    Form 10C
                  </div>
                </button>
              </div>
            </div>

            {/* If Form 31: Purpose of Advance dropdown */}
            {claimType === 'form31' && (
              <div>
                <label htmlFor="advance-purpose-select" className="block text-xs font-bold text-slate-800 mb-1">
                  Purpose of Advance (Form 31 Paragraphs):
                </label>
                <select
                  id="advance-purpose-select"
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value as Form31Reason)}
                  className="w-full text-xs font-bold p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="illness">Illness / Medical Treatment (Para 68J) → No min. service required</option>
                  <option value="marriage">Marriage of Self / Children / Siblings (Para 68K) → Min. 7 yrs required</option>
                  <option value="education">Higher Post-Matric Education (Para 68K) → Min. 7 yrs required</option>
                  <option value="house_purchase">House / Flat Purchase / Construction (Para 68B) → Min. 5 yrs required</option>
                  <option value="site_purchase">Purchase of Site / Land (Para 68B) → Min. 5 yrs required</option>
                  <option value="home_loan">Home Loan Repayment (Para 68BB) → Min. 10 yrs required</option>
                </select>
              </div>
            )}

            {/* Requested Amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="requested-amount-input" className="text-xs font-bold text-slate-800">
                  Amount User Wishes to Withdraw (₹):
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handlePresetPercentage(25)}
                    className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetPercentage(50)}
                    className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetPercentage(75)}
                    className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetPercentage(100)}
                    className="text-[10px] font-bold bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded text-blue-900 font-semibold"
                  >
                    Max
                  </button>
                </div>
              </div>
              <input
                id="requested-amount-input"
                type="text"
                inputMode="numeric"
                value={requestedAmountStr}
                onChange={handleNumericChange(setRequestedAmountStr)}
                className="w-full text-xs font-bold p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                placeholder="Enter requested amount"
              />
            </div>

            {/* Tax & KYC Toggles (Relevant especially for Form 19) */}
            <div className="pt-3 border-t border-stone-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">
                Tax & KYC Declarations (TDS Tuning):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50">
                  <div>
                    <div className="text-xs font-bold text-slate-800">PAN Linked to UAN?</div>
                    <div className="text-[11px] text-slate-500">Affects Section 192A / 206AA</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPanLinked}
                      onChange={(e) => setIsPanLinked(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Form 15G / 15H Uploaded?</div>
                    <div className="text-[11px] text-slate-500">Nil tax declaration</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isForm15gUploaded}
                      onChange={(e) => setIsForm15gUploaded(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Breakdown Card & Real-Time Statutory Results */}
        <div className="lg:col-span-6 space-y-5">
          {/* Main Assessment Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  2. Statutory Assessment & Live Breakdown
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  calculation.eligible
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : calculation.schemeCertMandatory
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {calculation.eligible ? 'Statutory Eligible' : calculation.schemeCertMandatory ? 'Scheme Certificate' : 'Ineligible for Reason'}
              </span>
            </div>

            {/* Auto Settlement Pulsating Banner */}
            {calculation.autoSettlementActive && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 animate-pulse">
                <Zap className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <span>Auto-Settlement Mode Activated (2-3 Days Payout)</span>
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    Medical emergency claim under ₹5,00,000 qualifies for IT-driven zero-human-touch automated instant clearing.
                  </div>
                </div>
              </div>
            )}

            {/* High Marginal Rate Warning */}
            {claimType === 'form19' && !isPanLinked && totalServiceYears < 5 && totalPfBalance >= 50000 && !isForm15gUploaded && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-rose-950">
                    High-Priority Warning: 34.608% Penal TDS
                  </div>
                  <p className="text-[11px] text-rose-900 leading-relaxed">
                    Under Section 206AA, non-seeding of PAN on PF withdrawals exceeding ₹50,000 with under 5 years service attracts maximum marginal rate (34.608%). Link PAN or upload Form 15G immediately to avoid ₹{calculation.tdsAmount?.toLocaleString('en-IN')} deduction.
                  </p>
                </div>
              </div>
            )}

            {/* Big Net Disbursal Amount Box */}
            <div
              className={`rounded-2xl p-5 border transition-all ${
                calculation.eligible
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : calculation.schemeCertMandatory
                  ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider opacity-80 flex justify-between">
                <span>Net Disbursal Amount</span>
                <span>{calculation.category}</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono mt-1">
                ₹{(calculation.netPayableAmount || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-xs mt-2 font-medium opacity-90">
                {calculation.eligible ? 'Approved for immediate electronic credit to verified bank account.' : calculation.explanation}
              </div>
            </div>

            {/* Visual Progress Bar comparing Requested vs Max Eligible limit */}
            {calculation.maxAmount > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>Requested Amount vs Statutory Ceiling:</span>
                  <span className="font-mono font-bold">
                    {Math.min(100, Math.round(((calculation.approvedAmount || 0) / calculation.maxAmount) * 100))}% of Maximum
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round(((calculation.approvedAmount || 0) / calculation.maxAmount) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>₹0</span>
                  <span>Ceiling: ₹{calculation.maxAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* 4-Line Statutory Breakdown Table */}
            <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-200 text-xs">
              <div className="p-3 bg-stone-50 flex justify-between items-center font-medium text-slate-700">
                <span>Max Statutory Entitlement:</span>
                <span className="font-bold font-mono text-slate-900">
                  ₹{calculation.maxAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-white flex justify-between items-center text-slate-700">
                <span>Requested Amount:</span>
                <span className="font-bold font-mono text-slate-900">
                  ₹{(calculation.requestedAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-white flex justify-between items-center text-slate-700">
                <span className="flex items-center gap-1">
                  <span>Approved Gross Amount:</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </span>
                <span className="font-bold font-mono text-emerald-700">
                  ₹{(calculation.approvedAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-white flex justify-between items-center text-slate-700">
                <span>Calculated TDS Deductions ({calculation.tdsPercent}%):</span>
                <span className="font-bold font-mono text-rose-700">
                  - ₹{(calculation.tdsAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-stone-100 flex justify-between items-center font-bold text-slate-900">
                <span>Net Disbursal to Bank:</span>
                <span className="font-mono text-emerald-800 text-sm">
                  ₹{(calculation.netPayableAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Rule & Tax Explanation Box */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Statutory Rule & Section Reference:</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {calculation.explanation}
              </p>
              <div className="pt-2 border-t border-stone-200 text-slate-600">
                <strong>Taxation (Section 192A / 206AA):</strong> {calculation.taxNote}
              </div>
            </div>

            {/* Insolvent Private PF Trust Blocker Notice for Ramesh (Scenario 3) */}
            {currentPersona.profile?.isInsolventTrust && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Insolvent Private PF Trust Notice (NCLT Liquidation)</span>
                </div>
                <p className="text-rose-800 leading-relaxed">
                  Active member <strong>{currentPersona.name}</strong> belongs to an exempted private PF trust currently facing insolvency proceedings. Central EPFO online auto-settlement is disabled for this establishment.
                </p>
                <div className="pt-2 border-t border-rose-200 text-rose-900 text-[11px]">
                  <strong>Mandatory Legal Remedy:</strong> File physical Form D/E with the Insolvency Resolution Professional (IRP) or submit a claim under EPF Act Section 7A at the Regional PF Commissioner (RPFC).
                </div>
              </div>
            )}

            {/* Action to proceed */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  id="btn-download-calc-receipt-bottom"
                  onClick={handleDownloadReceipt}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Download Receipt</span>
                </button>

                <button
                  type="button"
                  id="btn-view-receipt-modal"
                  onClick={() => setShowReceiptModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>View / Print Receipt</span>
                </button>
              </div>

              {currentPersona.profile?.isInsolventTrust ? (
                <button
                  type="button"
                  id="btn-apply-claim-portal-disabled"
                  onClick={() => onNavigate('claimDoctorView')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-900 hover:bg-rose-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-colors shadow-xs"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-300" />
                  <span>View NCLT & RPFC Legal Directives</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-apply-claim-portal"
                  onClick={() => {
                    const preset: PresetClaimData = {
                      formType: claimType,
                      advanceReason: claimType === 'form31' ? advanceReason : undefined,
                      requestedAmount: requestedAmount > 0 ? requestedAmount : (calculation.approvedAmount || calculation.maxAmount),
                      monthlyBasicPay: basicPay,
                      serviceYears: serviceYears,
                      serviceMonths: serviceMonths,
                      autoSettlementEligible: calculation.autoSettlementActive,
                    };
                    if (onApplyClaim) {
                      onApplyClaim(preset);
                    } else {
                      onNavigate('claimDoctorView');
                    }
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-colors shadow-xs hover:ring-2 hover:ring-amber-400/80 cursor-pointer"
                >
                  <span>Apply in Claim Portal</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-slate-200 mb-4">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-xl mx-auto flex items-center justify-center mb-2">
                <ShieldCheck className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">
                Official EPFO Statutory Calculation Summary
              </h3>
              <p className="text-xs text-slate-500">
                Employees' Provident Fund Organisation • NextGen Portal Prototype
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div>
                  <div className="text-[11px] text-slate-500">Member Name</div>
                  <div className="font-bold text-slate-900">{currentPersona.name}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Universal Account Number (UAN)</div>
                  <div className="font-mono font-bold text-slate-900">{currentPersona.uan}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Continuous Service Tenure</div>
                  <div className="font-bold text-slate-900">{serviceYears} Yrs {serviceMonths} Mos ({totalServiceYears} yrs)</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Monthly Basic Wage</div>
                  <div className="font-mono font-bold text-slate-900">₹{basicPay.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-200">
                <div className="p-2.5 flex justify-between">
                  <span className="text-slate-600">Claim Category:</span>
                  <span className="font-bold text-slate-900">{calculation.category}</span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="text-slate-600">Max Statutory Entitlement:</span>
                  <span className="font-mono font-bold text-slate-900">₹{calculation.maxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="text-slate-600">Requested Amount:</span>
                  <span className="font-mono font-bold text-slate-900">₹{(calculation.requestedAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="text-slate-600">TDS Deduction ({calculation.tdsPercent}%):</span>
                  <span className="font-mono font-bold text-rose-700">- ₹{(calculation.tdsAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 flex justify-between font-bold">
                  <span className="text-emerald-950">Net Disbursal Amount:</span>
                  <span className="font-mono text-emerald-800 text-sm">₹{(calculation.netPayableAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <div><strong>Rule Reference:</strong> {calculation.explanation}</div>
                <div><strong>Taxation Note:</strong> {calculation.taxNote}</div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                <span>Assessment Generated: {new Date().toLocaleDateString('en-IN')}</span>
                <span>Statutory Authority: EPFO / MoLE</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                id="btn-download-calc-receipt-modal"
                onClick={handleDownloadReceipt}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>Download Receipt File</span>
              </button>
              <button
                type="button"
                id="btn-print-calc-receipt-modal"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
