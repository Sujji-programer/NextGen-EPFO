import React, { useState, useEffect } from 'react';
import { ViewName, Persona, AppSettings, MandatoryKycCheck, PresetClaimData } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { MockBackend } from '../services/mockBackend';
import {
  downloadPassbookFile,
  downloadJointDeclarationFile,
  downloadClaimAcknowledgmentFile,
} from '../utils/documentGenerator';
import { KycDiagnosticsDrawer } from '../components/KycDiagnosticsDrawer';
import { AutoFixModal } from '../components/AutoFixModal';
import { DigiLockerChequeWidget } from '../components/DigiLockerChequeWidget';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Building,
  CreditCard,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Calendar,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Info,
  Clock,
  Send,
  Download,
  X,
  FileCheck,
  DollarSign,
  Percent,
  Check,
  Lock,
  RefreshCw,
  Landmark,
  ShieldAlert,
  Calculator,
  ExternalLink,
  MapPin,
} from 'lucide-react';

interface ClaimDoctorViewProps {
  currentPersona: Persona;
  onNavigate: (view: ViewName) => void;
  onFixIssue: (issueId: string) => Promise<void>;
  onSubmitClaim: (claimType: string) => Promise<void>;
  onSelectPersona?: (personaId: string) => void;
  onRefreshPersona?: () => Promise<void>;
  settings: AppSettings;
  onShowToast?: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  presetClaimData?: PresetClaimData | null;
  onClearPresetClaimData?: () => void;
}


// 4 Official EPFO Unified Portal Steps
export type ClaimPortalStep =
  | 'step1_profile'     // Step 1: Open the Claim Form & Profile Summary
  | 'step2_bank_verify' // Step 2: Bank Account Verification & Undertaking
  | 'step3_form_reason' // Step 3: Selecting the Form, Reason, PF Eligibility Calculator, Address & Uploads
  | 'step4_otp_submit'  // Step 4: Aadhaar OTP Verification & Submission
  | 'step_success';     // Success Screen with Tracking & Downloads

export interface AdvanceReasonRule {
  id: string;
  name: string;
  para: string;
  minServiceYears: number;
  maxLimitFormula: string;
  frequency: string;
  notes: string;
  calculateMax: (params: {
    monthlyBasicPay: number;
    employeeBalance: number;
    employerBalance: number;
    totalBalance: number;
    yearsOfService: number;
  }) => number;
}

export const ADVANCE_REASONS: AdvanceReasonRule[] = [
  {
    id: 'illness',
    name: 'Medical Treatment / Illness (Para 68J)',
    para: 'Para 68J',
    minServiceYears: 0,
    maxLimitFormula: "Up to 6 months' Basic + DA, or total employee share with interest (whichever is lower)",
    frequency: 'As needed (for self, spouse, children, or dependent parents). Settles under auto-mode up to ₹1,00,000.',
    notes: 'No minimum service required. Auto-settlement mode available.',
    calculateMax: ({ monthlyBasicPay, employeeBalance }) => {
      const sixMonthsBasic = monthlyBasicPay * 6;
      return Math.min(sixMonthsBasic, employeeBalance);
    },
  },
  {
    id: 'marriage',
    name: 'Marriage (Para 68K)',
    para: 'Para 68K',
    minServiceYears: 7,
    maxLimitFormula: 'Up to 50% of employee’s total contribution with interest',
    frequency: 'Max 3 times in total service (for self, daughter, son, brother, or sister).',
    notes: 'Mandatory minimum 7 years continuous service required.',
    calculateMax: ({ employeeBalance, yearsOfService }) => {
      if (yearsOfService < 7) return 0;
      return Math.round(employeeBalance * 0.5);
    },
  },
  {
    id: 'education',
    name: 'Post-Matriculation Education (Para 68K)',
    para: 'Para 68K',
    minServiceYears: 7,
    maxLimitFormula: 'Up to 50% of employee’s total contribution with interest',
    frequency: 'Max 3 times (for higher education of children).',
    notes: 'Mandatory minimum 7 years continuous service required.',
    calculateMax: ({ employeeBalance, yearsOfService }) => {
      if (yearsOfService < 7) return 0;
      return Math.round(employeeBalance * 0.5);
    },
  },
  {
    id: 'house_construction',
    name: 'Purchase of House / Flat / Construction (Para 68B)',
    para: 'Para 68B',
    minServiceYears: 5,
    maxLimitFormula: "Up to 36 months' Basic + DA, or total PF balance (EE + ER share), or actual cost (whichever lowest)",
    frequency: 'Allowed once in total service. Property must be in your name, spouse’s name, or joint.',
    notes: 'Mandatory minimum 5 years continuous membership required.',
    calculateMax: ({ monthlyBasicPay, totalBalance, yearsOfService }) => {
      if (yearsOfService < 5) return 0;
      const thirtySixMonths = monthlyBasicPay * 36;
      return Math.min(thirtySixMonths, totalBalance);
    },
  },
  {
    id: 'land_purchase',
    name: 'Purchase of Land / Site (Para 68B)',
    para: 'Para 68B',
    minServiceYears: 5,
    maxLimitFormula: "Up to 24 months' Basic + DA, or total PF balance, or actual cost (whichever lowest)",
    frequency: 'Allowed once in total service.',
    notes: 'Mandatory minimum 5 years continuous membership required.',
    calculateMax: ({ monthlyBasicPay, totalBalance, yearsOfService }) => {
      if (yearsOfService < 5) return 0;
      const twentyFourMonths = monthlyBasicPay * 24;
      return Math.min(twentyFourMonths, totalBalance);
    },
  },
  {
    id: 'home_loan_repayment',
    name: 'Repayment of Home Loan (Para 68BB)',
    para: 'Para 68BB',
    minServiceYears: 10,
    maxLimitFormula: "Up to 36 months' Basic + DA, or total PF balance, or outstanding loan amount (whichever lowest)",
    frequency: 'Allowed once in total service. Loan must be from a recognized bank/institution.',
    notes: 'Mandatory minimum 10 years continuous membership required.',
    calculateMax: ({ monthlyBasicPay, totalBalance, yearsOfService }) => {
      if (yearsOfService < 10) return 0;
      const thirtySixMonths = monthlyBasicPay * 36;
      return Math.min(thirtySixMonths, totalBalance);
    },
  },
  {
    id: 'house_renovation',
    name: 'House Renovation / Repair (Para 68B)',
    para: 'Para 68B',
    minServiceYears: 5,
    maxLimitFormula: "Up to 12 months' Basic + DA, or employee share with interest (whichever lower)",
    frequency: 'Allowed once (second time permitted 10 years after the first).',
    notes: 'Requires 5 years completion after house construction.',
    calculateMax: ({ monthlyBasicPay, employeeBalance, yearsOfService }) => {
      if (yearsOfService < 5) return 0;
      const twelveMonths = monthlyBasicPay * 12;
      return Math.min(twelveMonths, employeeBalance);
    },
  },
  {
    id: 'pre_retirement',
    name: 'Pre-Retirement (Para 68NN)',
    para: 'Para 68NN',
    minServiceYears: 0,
    maxLimitFormula: 'Up to 90% of total PF balance',
    frequency: 'Allowed once before superannuation.',
    notes: 'Applicable for members aged 54+ (within 1 year of retirement).',
    calculateMax: ({ totalBalance }) => {
      return Math.round(totalBalance * 0.9);
    },
  },
  {
    id: 'pandemic_calamity',
    name: 'Natural Calamities / Pandemic Outbreak',
    para: 'Special Gazette',
    minServiceYears: 0,
    maxLimitFormula: "Up to 3 months' Basic + DA or 75% of total balance (whichever lower)",
    frequency: 'When declared officially by Ministry / EPFO in specific regions.',
    notes: 'No minimum service required. Non-refundable advance.',
    calculateMax: ({ monthlyBasicPay, totalBalance }) => {
      const threeMonths = monthlyBasicPay * 3;
      return Math.min(threeMonths, Math.round(totalBalance * 0.75));
    },
  },
];

export const ClaimDoctorView: React.FC<ClaimDoctorViewProps> = ({
  currentPersona,
  onNavigate,
  onFixIssue,
  onSubmitClaim,
  onSelectPersona,
  onRefreshPersona,
  settings,
  onShowToast,
  presetClaimData,
  onClearPresetClaimData,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  // Step state
  const [currentStep, setCurrentStep] = useState<ClaimPortalStep>('step1_profile');


  // Account 3 / Insolvent Private PF Trust Check
  const isInsolventTrust =
    currentPersona.id === 'account-c' ||
    currentPersona.id === 'meena-rejected' ||
    Boolean(currentPersona.profile.isInsolventTrust);

  // Mandatory checks audit
  const checks: MandatoryKycCheck[] = currentPersona.mandatoryChecks || [];
  const failingChecks = checks.filter((c) => c.status !== 'passed');
  const unresolvedIssues = (currentPersona.issues || []).filter((issue) => !issue.fixed);
  const validationPassed = failingChecks.length === 0 && unresolvedIssues.length === 0;

  // KYC Diagnostics Drawer State
  const [isDiagnosticsDrawerOpen, setIsDiagnosticsDrawerOpen] = useState<boolean>(false);
  const [isAutoFixModalOpen, setIsAutoFixModalOpen] = useState<boolean>(false);

  // -------------------------------------------------------------
  // PROFILE STATE: Empty until DigiLocker Autofill is triggered
  // -------------------------------------------------------------
  const [isProfileAutofilled, setIsProfileAutofilled] = useState<boolean>(false);

  // Guarantee details start empty whenever persona changes or on initial claim entry
  useEffect(() => {
    setIsProfileAutofilled(false);
    setIsBankVerified(false);
    setEnteredBankNumber('');
  }, [currentPersona.id]);

  // -------------------------------------------------------------
  // CALCULATOR STATE: Free controls without leading zeros
  // -------------------------------------------------------------
  const [monthlyBasicPayStr, setMonthlyBasicPayStr] = useState<string>(() => `${currentPersona.monthlyBasicPay || 35000}`);
  const [serviceYearsStr, setServiceYearsStr] = useState<string>(() => `${currentPersona.serviceYears || 6}`);
  const [serviceMonthsStr, setServiceMonthsStr] = useState<string>(() => `${currentPersona.serviceMonths || 0}`);
  const [eeBalanceStr, setEeBalanceStr] = useState<string>(() => `${currentPersona.balance.employeeContribution || 184000}`);
  const [erBalanceStr, setErBalanceStr] = useState<string>(() => `${currentPersona.balance.employerContribution || 118000}`);
  const [pensionBalanceStr, setPensionBalanceStr] = useState<string>(() => `${currentPersona.balance.pensionFund || 48200}`);

  // Derived numeric calculator values
  const monthlyBasicPay = Number(monthlyBasicPayStr) || 0;
  const serviceYears = Number(serviceYearsStr) || 0;
  const serviceMonths = Number(serviceMonthsStr) || 0;
  const totalServiceYears = serviceYears + (serviceMonths / 12);
  const eeBalance = Number(eeBalanceStr) || 0;
  const erBalance = Number(erBalanceStr) || 0;
  const totalBalance = eeBalance + erBalance;
  const pensionBalance = Number(pensionBalanceStr) || 0;

  // -------------------------------------------------------------
  // STEP 2: Bank Account Verification State & Undertaking Modal
  // -------------------------------------------------------------
  const fullActualBankNumber = currentPersona.profile.fullAccountNumber || `5010048291${currentPersona.profile.accountLast4}`;
  const [enteredBankNumber, setEnteredBankNumber] = useState<string>('');
  const [showUndertakingModal, setShowUndertakingModal] = useState<boolean>(false);
  const [isBankVerified, setIsBankVerified] = useState<boolean>(false);
  const [bankVerificationError, setBankVerificationError] = useState<string | null>(null);

  const handleVerifyBankClick = () => {
    if (!enteredBankNumber.trim()) {
      setBankVerificationError('Please enter your full bank account number linked with your UAN.');
      return;
    }
    if (!enteredBankNumber.endsWith(currentPersona.profile.accountLast4)) {
      setBankVerificationError(`Account number does not match linked bank ending with ••${currentPersona.profile.accountLast4}.`);
      return;
    }
    setBankVerificationError(null);
    setShowUndertakingModal(true);
  };

  const handleConfirmUndertaking = () => {
    setShowUndertakingModal(false);
    setIsBankVerified(true);
    if (onShowToast) {
      onShowToast('Bank Account Verified', 'Certificate of Undertaking accepted. NPCI direct credit route active.', 'success');
    }
  };

  // -------------------------------------------------------------
  // STEP 3: Form Selection, Reason, PF Calculator & Uploads
  // -------------------------------------------------------------
  type ClaimFormType = 'form31' | 'form19' | 'form10c' | 'scheme_cert';
  const [selectedFormType, setSelectedFormType] = useState<ClaimFormType>('form31');
  const [selectedAdvanceReason, setSelectedAdvanceReason] = useState<string>('illness');

  // Find active advance reason rule
  const activeReasonRule = ADVANCE_REASONS.find((r) => r.id === selectedAdvanceReason) || ADVANCE_REASONS[0];
  const isReasonEligible = totalServiceYears >= activeReasonRule.minServiceYears;

  // Compute maximum eligible amount dynamically based on selected form & reason
  const computeMaximumEligible = (): {
    maxAmount: number;
    summary: string;
    taxNote: string;
    isEligible: boolean;
    ineligibleReason?: string;
  } => {
    if (selectedFormType === 'form19') {
      const isTaxExempt = totalServiceYears >= 5;
      const isExitMarked = Boolean(currentPersona.profile.employment.doe || currentPersona.profile.employment.exitDateUpdated);
      return {
        maxAmount: totalBalance,
        isEligible: isExitMarked,
        ineligibleReason: !isExitMarked
          ? 'Form 19 requires member to be separated/unemployed with Date of Exit marked > 2 months in ECR.'
          : undefined,
        summary: `100% Full Final Settlement of Employee Share (₹${eeBalance.toLocaleString('en-IN')}) + Employer Share (₹${erBalance.toLocaleString('en-IN')}) + Accumulated Interest.`,
        taxNote: isTaxExempt
          ? '100% Tax-Exempt (Continuous service exceeds 5 years statutory threshold).'
          : '10% TDS applicable under Sec 192A for service < 5 years (Submit Form 15G/15H to claim exemption).',
      };
    }

    if (selectedFormType === 'form10c') {
      if (totalServiceYears >= 10) {
        return {
          maxAmount: 0,
          isEligible: false,
          ineligibleReason: 'Continuous service is 10 or more years. Lump-sum cash withdrawal is NOT permitted under EPS 1995. You must apply for a Scheme Certificate to draw regular monthly pension after age 58.',
          summary: 'Pension Scheme Certificate (Form 10C / 10D).',
          taxNote: 'Pension Scheme Certificate preserves service continuity.',
        };
      }
      return {
        maxAmount: pensionBalance,
        isEligible: true,
        summary: `EPS 1995 Pension lump-sum withdrawal benefit for total service of ${totalServiceYears.toFixed(1)} years (Table D factor applied).`,
        taxNote: 'EPS withdrawal benefit is 100% exempt from income tax.',
      };
    }

    if (selectedFormType === 'scheme_cert') {
      return {
        maxAmount: 0,
        isEligible: true,
        summary: 'Application for EPS Scheme Certificate. Accumulates service pension credit for monthly pension upon attaining age 58.',
        taxNote: 'Official pension entitlement certificate issued by EPFO.',
      };
    }

    // Form 31 Advance Calculation
    const maxVal = activeReasonRule.calculateMax({
      monthlyBasicPay,
      employeeBalance: eeBalance,
      employerBalance: erBalance,
      totalBalance,
      yearsOfService: totalServiceYears,
    });

    return {
      maxAmount: maxVal,
      isEligible: isReasonEligible && monthlyBasicPay > 0 && eeBalance > 0,
      ineligibleReason: !isReasonEligible
        ? `Requires minimum ${activeReasonRule.minServiceYears} years of continuous service. Your current service tenure is ${totalServiceYears.toFixed(1)} years.`
        : monthlyBasicPay <= 0
        ? 'Please enter a valid Monthly Basic + DA wage.'
        : eeBalance <= 0
        ? 'Employee PF balance must be greater than ₹0.'
        : undefined,
      summary: activeReasonRule.maxLimitFormula,
      taxNote: 'All statutory Form 31 non-refundable advances are 100% exempt from income tax and TDS.',
    };
  };

  const statutoryAssessment = computeMaximumEligible();

  // User input amount with free string control
  const [requestedAmountStr, setRequestedAmountStr] = useState<string>(() => `${Math.min(statutoryAssessment.maxAmount, 50000)}`);
  const requestedAmount = Number(requestedAmountStr) || 0;

  // Auto sync default amount when form/reason changes if requested amount was 0 or invalid
  useEffect(() => {
    const assessment = computeMaximumEligible();
    if (assessment.isEligible && assessment.maxAmount > 0) {
      if (requestedAmount === 0 || requestedAmount > assessment.maxAmount) {
        setRequestedAmountStr(`${Math.min(assessment.maxAmount, selectedFormType === 'form19' ? totalBalance : 50000)}`);
      }
    }
  }, [selectedFormType, selectedAdvanceReason]);

  // Sync with presetClaimData transferred from PF Eligibility Calculator
  useEffect(() => {
    if (presetClaimData) {
      if (presetClaimData.formType) {
        setSelectedFormType(presetClaimData.formType);
      }
      if (presetClaimData.advanceReason) {
        setSelectedAdvanceReason(presetClaimData.advanceReason);
      }
      if (presetClaimData.requestedAmount && presetClaimData.requestedAmount > 0) {
        setRequestedAmountStr(`${presetClaimData.requestedAmount}`);
      }
      if (presetClaimData.monthlyBasicPay && presetClaimData.monthlyBasicPay > 0) {
        setMonthlyBasicPayStr(`${presetClaimData.monthlyBasicPay}`);
      }
      if (presetClaimData.serviceYears !== undefined) {
        setServiceYearsStr(`${presetClaimData.serviceYears}`);
      }
      if (presetClaimData.serviceMonths !== undefined) {
        setServiceMonthsStr(`${presetClaimData.serviceMonths}`);
      }

      // Unlock and jump straight to Step 3 for non-blocked accounts
      if (!isInsolventTrust) {
        setIsProfileAutofilled(true);
        setIsBankVerified(true);
        setEnteredBankNumber(fullActualBankNumber);
        setCurrentStep('step3_form_reason');
      }

      if (onShowToast) {
        onShowToast(
          'Eligibility Data Transferred',
          `Pre-loaded ${presetClaimData.formType.toUpperCase()} with ₹${(presetClaimData.requestedAmount || 0).toLocaleString('en-IN')} from calculator.`,
          'success'
        );
      }
      if (onClearPresetClaimData) {
        onClearPresetClaimData();
      }
    }
  }, [presetClaimData]);

  // Validation logic: step 3 cannot proceed on false/invalid inputs

  const isAmountValid =
    selectedFormType === 'scheme_cert'
      ? true
      : requestedAmount > 0 && requestedAmount <= statutoryAssessment.maxAmount;

  const canProceedStep3 =
    statutoryAssessment.isEligible &&
    isAmountValid &&
    monthlyBasicPay > 0;

  // Address State
  const [addressLine1, setAddressLine1] = useState<string>('Flat 402, Block B, Silver Crest Enclave');
  const [addressLine2, setAddressLine2] = useState<string>('Outer Ring Road, Bellandur');
  const [stateName, setStateName] = useState<string>('Karnataka');
  const [districtName, setDistrictName] = useState<string>('Bengaluru Urban');
  const [pincode, setPincode] = useState<string>('560103');

  // Cheque / Passbook File Upload State - Not preloaded by default, user-driven via DigiLocker / Upload
  const isChequeUploaded = Boolean(currentPersona.profile.chequeFileName && currentPersona.profile.chequeStatus === 'valid');
  const uploadedFileName = currentPersona.profile.chequeFileName || '';
  const uploadedFileSize = '248 KB';

  // -------------------------------------------------------------
  // DigiLocker Modal Animation with Empty Blanks -> Filled Step by Step
  // -------------------------------------------------------------
  const [isDigiLockerModalOpen, setIsDigiLockerModalOpen] = useState<boolean>(false);
  const [digiLockerStage, setDigiLockerStage] = useState<number>(0);
  const [digiLockerStatusText, setDigiLockerStatusText] = useState<string>('');
  const [isDigiLockerFinished, setIsDigiLockerFinished] = useState<boolean>(false);
  const [digiLockerBlanks, setDigiLockerBlanks] = useState<{
    uan?: string;
    aadhaarName?: string;
    dob?: string;
    fatherName?: string;
    pan?: string;
    mobile?: string;
    bankIfsc?: string;
    bankName?: string;
    doj?: string;
    doe?: string;
    employer?: string;
  } | null>(null);

  const triggerDigiLockerAutofill = () => {
    setIsDigiLockerModalOpen(true);
    setDigiLockerStage(1);
    setIsDigiLockerFinished(false);
    setDigiLockerBlanks(null); // Keep blanks empty initially!
    setDigiLockerStatusText('Initiating secure handshake with DigiLocker Gateway...');

    // Stage 1: Aadhaar Identity
    setTimeout(() => {
      setDigiLockerStage(2);
      setDigiLockerStatusText('Verifying Aadhaar Identity (Name, DOB & Father’s Name)...');
      setDigiLockerBlanks((prev) => ({
        ...prev,
        aadhaarName: currentPersona.name,
        dob: currentPersona.profile.dob || '05/11/1990',
        fatherName: currentPersona.profile.fatherName || 'V. Narayanan Iyer',
      }));
    }, 600);

    // Stage 2: Income Tax PAN
    setTimeout(() => {
      setDigiLockerStage(3);
      setDigiLockerStatusText('Cross-validating Income Tax PAN seeding & TDS category...');
      setDigiLockerBlanks((prev) => ({
        ...prev,
        pan: currentPersona.profile.pan || 'ABCDE5566P',
      }));
    }, 1200);

    // Stage 3: NPCI Bank Match & Mobile
    setTimeout(() => {
      setDigiLockerStage(4);
      setDigiLockerStatusText('Syncing NPCI Active Bank Account, IFSC & Mobile...');
      setEnteredBankNumber(fullActualBankNumber);
      setIsBankVerified(true);
      setDigiLockerBlanks((prev) => ({
        ...prev,
        bankIfsc: currentPersona.id === 'account-b' || currentPersona.id === 'ravi-issues' ? 'ZNTH0000123' : currentPersona.profile.ifsc,
        bankName: currentPersona.id === 'account-b' || currentPersona.id === 'ravi-issues' ? 'Zenith United Bank (Merged Horizon)' : currentPersona.profile.bankName,
        mobile: currentPersona.profile.mobile || '+91 98••••7742',
      }));
    }, 1800);

    // Stage 4: EPFO Central Service Ledger & Finish
    setTimeout(async () => {
      setDigiLockerStage(5);
      setIsDigiLockerFinished(true);
      setDigiLockerStatusText('DigiLocker Extraction Complete! Auto-populating form...');

      setDigiLockerBlanks((prev) => ({
        ...prev,
        uan: currentPersona.uan,
        doj: `${currentPersona.profile.employment.doj || '10-Jan-2016'} • ${currentPersona.serviceYears || 8} Years Service`,
        doe: currentPersona.profile.employment.exitDateUpdated
          ? '15 Jan 2026 (Exited > 2 months)'
          : 'Currently In-Service (Active ECR)',
        employer: `${currentPersona.profile.employment.employer} — ${currentPersona.profile.employment.memberId}`,
      }));

      // Only populate details into the UI state; do not overwrite or auto-fix KYC backend issues
      setIsProfileAutofilled(true);

      // Close modal smoothly after user views filled credentials
      setTimeout(() => {
        setIsDigiLockerModalOpen(false);
        if (onShowToast) {
          onShowToast('DigiLocker Auto-Fill Complete', 'Verified Aadhaar, PAN, Bank, and Service records populated into form.', 'success');
        }
      }, 1000);
    }, 2400);
  };

  // -------------------------------------------------------------
  // STEP 4: Aadhaar OTP & Declaration State
  // -------------------------------------------------------------
  const [declarationChecked, setDeclarationChecked] = useState<boolean>(false);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [otpValue, setOtpValue] = useState<string>('582914');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generatedClaimId, setGeneratedClaimId] = useState<string>(() => `CLM-2026-${Math.floor(100000 + Math.random() * 900000)}`);

  const handleSendOtp = () => {
    if (!declarationChecked) {
      if (onShowToast) {
        onShowToast('Declaration Required', 'Please check the declaration box before requesting Aadhaar OTP.', 'warning');
      }
      return;
    }
    setIsOtpSent(true);
    if (onShowToast) {
      onShowToast('Aadhaar OTP Dispatched', `Simulated 6-digit OTP sent to Aadhaar-linked mobile (${currentPersona.profile.mobile || '••••••7742'}).`, 'info');
    }
  };

  const handleFinalSubmitClaim = async () => {
    if (!otpValue || otpValue.length < 6) {
      if (onShowToast) {
        onShowToast('Invalid OTP', 'Please enter a valid 6-digit Aadhaar OTP.', 'error');
      }
      return;
    }
    setIsSubmitting(true);
    try {
      const claimDesc =
        selectedFormType === 'form31'
          ? `PF Advance (Form 31 - ${activeReasonRule.name})`
          : selectedFormType === 'form19'
          ? 'Only PF Withdrawal (Form 19 - Full Settlement)'
          : selectedFormType === 'form10c'
          ? 'Only Pension Withdrawal (Form 10C)'
          : 'Scheme Certificate (Form 10C/10D)';

      await onSubmitClaim(claimDesc);
      setCurrentStep('step_success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 font-sans">
      {/* Top Banner / Breadcrumbs */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
            <Building className="w-4 h-4 text-blue-700" />
            <span>Online Services • unifiedportal-mem.epfindia.gov.in</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Claim (FORM-31, 19, 10C & 10D)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statutory EPFO Online Claim filing workflow with real-time rules calculator, bank verification, and DigiLocker auto-fill.
          </p>
        </div>

        {/* 4 Official Step Indicator Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold py-1">
          <div
            className={`px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${
              currentStep === 'step1_profile'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span>1. Profile</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          <div
            className={`px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${
              currentStep === 'step2_bank_verify'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span>2. Bank Verification</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          <div
            className={`px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${
              currentStep === 'step3_form_reason'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span>3. Form & Calculator</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

          <div
            className={`px-3 py-1 rounded-full flex items-center gap-1 transition-colors ${
              currentStep === 'step4_otp_submit'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span>4. Aadhaar OTP</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: OPEN THE CLAIM FORM & PROFILE DETAILS */}
      {/* ========================================================================= */}
      {currentStep === 'step1_profile' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* ===================================================================== */}
          {/* CASE 1: ACCOUNT 3 CRITICAL BLOCKER (Insolvent Private PF Trust)       */}
          {/* ===================================================================== */}
          {isInsolventTrust ? (
            <div className="bg-rose-50/90 border-2 border-rose-300 rounded-2xl p-6 sm:p-7 shadow-md space-y-5 text-xs text-rose-950">
              <div className="flex items-start justify-between gap-3 border-b border-rose-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold tracking-wider uppercase bg-rose-200 text-rose-900 px-2.5 py-0.5 rounded-full">
                      Hard Gate Blocker • Online Claim Blocked
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-rose-950 mt-1">
                      Insolvent Private PF Trust (Exempted Establishment Default)
                    </h2>
                  </div>
                </div>
              </div>

              {/* The Blocker */}
              <div className="bg-white/80 p-4 rounded-xl border border-rose-200 space-y-1.5">
                <div className="font-extrabold text-rose-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>The Blocker:</span>
                </div>
                <p className="text-slate-800 leading-relaxed">
                  Your former employer (<strong>{currentPersona.profile.employment.employer}</strong>) managed an independent in-house PF Trust (Exempted Establishment under Section 17(1) of EPF Act) rather than depositing monthly employee/employer contributions directly to the EPFO central pool, and the company went bankrupt or misappropriated the corpus without transferring funds to the central pool.
                </p>
              </div>

              {/* Why Online Portal Fails */}
              <div className="bg-white/80 p-4 rounded-xl border border-rose-200 space-y-1.5">
                <div className="font-extrabold text-rose-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Why the Online Portal Fails:</span>
                </div>
                <p className="text-slate-800 leading-relaxed">
                  The central EPFO portal does not hold your cash balance; it only holds your service ledger. <strong>EPFO cannot disburse funds it never received.</strong> Automated Form 31, 19, and 10C settlements are permanently disabled for this UAN until the trust liquidation is resolved.
                </p>
              </div>

              {/* Places You Must Visit */}
              <div className="bg-white p-5 rounded-xl border-2 border-rose-300 space-y-3">
                <div className="font-extrabold text-rose-950 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-700" />
                  <span>Places You Must Visit & Immediate Legal Actions:</span>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        National Company Law Tribunal (NCLT) / Insolvency Resolution Professional (IRP)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        File a formal claim as an Operational Creditor / Workman (<strong>Form E or Form D</strong>) under the Insolvency and Bankruptcy Code (IBC 2016). PF dues hold first-charge priority over all secured financial creditors.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        EPFO Recovery & Enforcement Cell (Regional P.F. Commissioner / RPFC)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        File a formal complaint under <strong>Section 7A / 8B of the EPF Act</strong> for statutory attachment of director/promoter personal assets and bank accounts to recover unpaid PF corpus.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        Labour Commissioner’s Office / Police Station (Economic Offences Wing)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        File a criminal breach of trust case under <strong>Section 406 / 409 of the Indian Penal Code (IPC)</strong> against the defaulting trust trustees for non-remittance of salary deductions.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('dashboardView')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Dashboard</span>
                </button>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => downloadJointDeclarationFile(currentPersona)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Pre-Filled Physical Joint Declaration Form</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPassbookFile(currentPersona)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 bg-white hover:bg-stone-50 text-rose-900 font-bold px-3.5 py-2.5 rounded-xl border border-rose-300 text-xs shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Passbook</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* ===================================================================== */}
          {/* CASE 2: ACCOUNT 2 FIXABLE DISCREPANCY WARNING BANNER                  */}
          {/* ===================================================================== */}
          {!isInsolventTrust && failingChecks.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Pre-Submission Gating Alert: {failingChecks.length} Issue(s) Detected</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                  Claim Blocked Until Resolved
                </span>
              </div>

              <p className="text-xs text-amber-800 leading-relaxed">
                EPFO SOP rules strictly require resolving the following items to qualify for online claim submission:
              </p>

              <div className="space-y-2 pt-1">
                {failingChecks.map((check) => (
                  <div key={check.id} className="bg-white/80 border border-amber-200 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{check.name}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{check.details} {check.financialImpact && <span className="text-rose-700 font-semibold">• {check.financialImpact}</span>}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setIsDiagnosticsDrawerOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold bg-white hover:bg-stone-100 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer"
                      >
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        <span>Diagnose Issues</span>
                      </button>
                      <button
                        onClick={() => setIsAutoFixModalOpen(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 px-3.5 py-1.5 rounded-lg shadow-2xs font-bold cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-slate-950" />
                        <span>Auto-Fix Issues (1-Click)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* STEP 1 PROFILE CARD (Blank until DigiLocker Autofill completes)       */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-7 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  Step 1 of 4: Member Profile Verification
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">
                  EPFO Unified Member Portal Profile
                </h2>
                <p className="text-xs text-slate-500">
                  Verify your active demographic and employment records registered under Universal Account Number:
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {failingChecks.length > 0 && (
                  <button
                    type="button"
                    id="btn-autofix-step1-header"
                    onClick={() => setIsAutoFixModalOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs transition-all shadow-2xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Auto-Fix Issues</span>
                  </button>
                )}
                <button
                  type="button"
                  id="btn-autofill-digilocker-step1"
                  onClick={triggerDigiLockerAutofill}
                  className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition-all shadow-2xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isProfileAutofilled ? 'Re-Sync DigiLocker' : 'Auto-fill with DigiLocker'}</span>
                </button>
              </div>
            </div>

            {/* Profile Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* UAN */}
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Universal Account Number (UAN)
                </span>
                <div className="font-mono font-bold text-sm text-slate-950 mt-0.5">
                  {isProfileAutofilled ? currentPersona.uan : <span className="text-slate-400 font-mono tracking-widest">••••••••••••</span>}
                </div>
              </div>

              {/* Name */}
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Member Full Name
                </span>
                <div className="font-bold text-sm text-slate-950 mt-0.5 flex items-center justify-between">
                  <span>{isProfileAutofilled ? currentPersona.name : <span className="text-slate-400 font-normal italic">—</span>}</span>
                  {isProfileAutofilled ? (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded font-bold">✓ Aadhaar Verified</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.2 rounded">Pending DigiLocker Sync</span>
                  )}
                </div>
              </div>

              {/* DOB */}
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Date of Birth (DOB)
                </span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {isProfileAutofilled ? `${currentPersona.profile.dob} (Age: ${30 + (currentPersona.serviceYears || 4)} yrs)` : <span className="text-slate-400 font-normal italic">—</span>}
                </div>
              </div>

              {/* Father Name */}
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Father's / Spouse's Name
                </span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {isProfileAutofilled ? currentPersona.profile.fatherName : <span className="text-slate-400 font-normal italic">—</span>}
                </div>
              </div>

              {/* PAN */}
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Income Tax PAN
                </span>
                <div className="font-mono font-bold text-slate-900 mt-0.5 flex items-center justify-between">
                  <span>{isProfileAutofilled ? (currentPersona.profile.pan || 'ABCDE5566P') : <span className="text-slate-400 font-normal italic">—</span>}</span>
                  {isProfileAutofilled && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.2 rounded font-bold">✓ Seeded</span>
                  )}
                </div>
              </div>

              {/* Mobile */}
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Aadhaar Linked Mobile
                </span>
                <div className="font-mono font-bold text-slate-900 mt-0.5">
                  {isProfileAutofilled ? (currentPersona.profile.mobile || '+91 98••••7742 (Active)') : <span className="text-slate-400 font-normal italic">—</span>}
                </div>
              </div>

              {/* DOJ */}
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Date of Joining (DOJ) & Service
                </span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {isProfileAutofilled ? `${currentPersona.profile.employment.doj} • ${currentPersona.serviceYears || 8} Years Service` : <span className="text-slate-400 font-normal italic">—</span>}
                </div>
              </div>

              {/* DOE */}
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Date of Exit (DOE)
                </span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {isProfileAutofilled ? (
                    currentPersona.profile.employment.exitDateUpdated
                      ? '15 Jan 2026 (Exited > 2 months)'
                      : 'Currently In-Service (Active ECR)'
                  ) : (
                    <span className="text-slate-400 font-normal italic">—</span>
                  )}
                </div>
              </div>

              {/* Present Employer */}
              <div className="md:col-span-2 p-3.5 bg-blue-50/60 rounded-lg border border-blue-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                  Present Employer & Member ID
                </span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {isProfileAutofilled ? `${currentPersona.profile.employment.employer} — ${currentPersona.profile.employment.memberId}` : <span className="text-slate-400 font-normal italic">—</span>}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-stone-200 pt-5">
              <button
                type="button"
                onClick={() => onNavigate('dashboardView')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 hover:ring-2 hover:ring-amber-400/80 px-2.5 py-1.5 rounded"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.backToDashboard}</span>
              </button>

              {/* Proceed Button */}
              {isInsolventTrust ? (
                <div className="text-rose-700 font-bold text-xs bg-rose-100 px-4 py-2 rounded-lg border border-rose-300">
                  Online Claim Blocked (Insolvent Private PF Trust)
                </div>
              ) : !isProfileAutofilled ? (
                <button
                  type="button"
                  id="btn-proceed-autofill-required"
                  onClick={triggerDigiLockerAutofill}
                  className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Auto-fill with DigiLocker to Proceed</span>
                </button>
              ) : !validationPassed ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    id="btn-proceed-autofix-trigger"
                    onClick={() => setIsAutoFixModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Auto-Fix Issues (1-Click)</span>
                  </button>
                  <button
                    type="button"
                    id="btn-proceed-to-step2-disabled"
                    disabled={true}
                    className="inline-flex items-center gap-2 bg-slate-200 text-slate-500 font-bold px-5 py-2.5 rounded-lg text-xs cursor-not-allowed shadow-none"
                    title="Resolve KYC errors using Auto-Fix first"
                  >
                    <span>Resolve Errors to Proceed</span>
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="btn-proceed-to-step2"
                  onClick={() => setCurrentStep('step2_bank_verify')}
                  className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition-all shadow-xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800"
                >
                  <span>Proceed to Bank Account Verification</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: BANK ACCOUNT VERIFICATION & UNDERTAKING */}
      {/* ========================================================================= */}
      {currentStep === 'step2_bank_verify' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-7 shadow-2xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Step 2 of 4: Bank Account Verification
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-2">
                Verify Linked Bank Account Number
              </h2>
              <p className="text-xs text-slate-500">
                To prevent fraud and misdirection of retirement funds, enter your full bank account number seeded with UAN:
              </p>
            </div>

            {/* Bank Info Card */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Seeded Bank Name:</span>
                <span className="font-bold text-slate-900">{currentPersona.profile.bankName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Seeded IFSC Code:</span>
                <span className="font-bold font-mono text-slate-900">{currentPersona.profile.ifsc}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Account Mask:</span>
                <span className="font-bold font-mono text-slate-900">••••••••{currentPersona.profile.accountLast4}</span>
              </div>
            </div>

            {/* Input Box */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Enter Full Bank Account Number *
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="input-verify-bank-number"
                  type="text"
                  value={enteredBankNumber}
                  onChange={(e) => {
                    setEnteredBankNumber(e.target.value);
                    setIsBankVerified(false);
                    setBankVerificationError(null);
                  }}
                  placeholder="e.g. 50100482914829"
                  className="flex-1 text-base font-mono font-bold text-slate-950 border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  id="btn-verify-bank-account"
                  onClick={handleVerifyBankClick}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition-all shadow-xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 shrink-0"
                >
                  Verify
                </button>
              </div>

              {bankVerificationError && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold bg-rose-50 p-2.5 rounded border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bankVerificationError}</span>
                </div>
              )}

              {isBankVerified && (
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold bg-emerald-50 p-3 rounded-lg border border-emerald-200 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bank Account Number verified successfully against EPFO central NPCI database.</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-stone-200 pt-5">
              <button
                type="button"
                onClick={() => setCurrentStep('step1_profile')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 hover:ring-2 hover:ring-amber-400/80 px-2.5 py-1.5 rounded"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                id="btn-proceed-for-online-claim"
                disabled={!isBankVerified}
                onClick={() => setCurrentStep('step3_form_reason')}
                className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition-all shadow-xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Proceed for Online Claim</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: FORM, REASON, IN-LINE CALCULATOR, ADDRESS & UPLOADS */}
      {/* ========================================================================= */}
      {currentStep === 'step3_form_reason' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-7 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  Step 3 of 4: Claim Form & PF Eligibility Calculator
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">
                  Select Form, Purpose & Compute Eligibility
                </h2>
                <p className="text-xs text-slate-500">
                  EPFO rules are calculated in real-time according to official Ministry gazette directives:
                </p>
              </div>

              <button
                type="button"
                id="btn-autofill-digilocker-step3"
                onClick={triggerDigiLockerAutofill}
                className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition-all shadow-2xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Auto-fill with DigiLocker</span>
              </button>
            </div>

            {/* 1. Dropdown: "I Want To Apply For" */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                I Want To Apply For *
              </label>
              <select
                id="select-claim-form-type"
                value={selectedFormType}
                onChange={(e) => setSelectedFormType(e.target.value as ClaimFormType)}
                className="w-full bg-white text-sm font-bold text-slate-950 border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="form31">PF ADVANCE (FORM-31) — While In Service / Partial Advance</option>
                <option value="form19">ONLY PF WITHDRAWAL (FORM-19) — Full Final Settlement (&gt;2 Months Unemployed)</option>
                <option value="form10c">ONLY PENSION WITHDRAWAL (FORM-10C) — Lump-sum EPS (&lt;10 Years Service)</option>
                <option value="scheme_cert">SCHEME CERTIFICATE (FORM-10C / 10D) — Continuous Pension Certificate (&gt;=10 Yrs)</option>
              </select>
            </div>

            {/* 2. When FORM 31 is chosen: Purpose Dropdown with Ineligible in RED */}
            {selectedFormType === 'form31' && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Purpose for which advance is required (EPF Scheme Para) *
                </label>
                <select
                  id="select-advance-reason"
                  value={selectedAdvanceReason}
                  onChange={(e) => setSelectedAdvanceReason(e.target.value)}
                  className="w-full bg-white text-xs sm:text-sm font-bold text-slate-950 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  {ADVANCE_REASONS.map((r) => {
                    const eligible = totalServiceYears >= r.minServiceYears;
                    return (
                      <option key={r.id} value={r.id}>
                        {eligible ? '✓ ' : '❌ [INELIGIBLE] '} {r.name} — {r.minServiceYears > 0 ? `Min ${r.minServiceYears} Yrs Service` : 'No min service'}
                      </option>
                    );
                  })}
                </select>

                {/* Purpose Statutory Details Banner */}
                <div className={`p-3.5 rounded-lg border text-xs ${
                  isReasonEligible ? 'bg-blue-50/80 border-blue-200 text-blue-950' : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      {isReasonEligible ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                      <span>{activeReasonRule.name}</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      isReasonEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isReasonEligible ? 'Eligible to Apply' : `Ineligible (${totalServiceYears.toFixed(1)} / ${activeReasonRule.minServiceYears} yrs service)`}
                    </span>
                  </div>
                  <div className="text-[11px] mt-1 space-y-1">
                    <div><strong>Statutory Formula:</strong> {activeReasonRule.maxLimitFormula}</div>
                    <div><strong>Frequency / Rules:</strong> {activeReasonRule.frequency}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Interactive PF Eligibility Calculator with Free Controls */}
            <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-900 text-white rounded-md">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    PF Eligibility & Limits Calculator (Editable Input Tuning)
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  EPFO Scheme Gazette Compliant
                </span>
              </div>

              {/* Editable Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Monthly Basic Pay */}
                <div className="bg-white p-3 rounded-lg border border-stone-200">
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">
                    Monthly Basic + DA Pay (₹)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    id="input-calc-basic-pay"
                    value={monthlyBasicPayStr}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                      setMonthlyBasicPayStr(v);
                    }}
                    placeholder="e.g. 35000"
                    className="w-full font-mono font-bold text-sm text-slate-950 border border-slate-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">Free input (6x wage multiplier limit)</div>
                </div>

                {/* Service Tenure */}
                <div className="bg-white p-3 rounded-lg border border-stone-200">
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">
                    Service Tenure (Years & Months)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        id="input-calc-service-years"
                        value={serviceYearsStr}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                          setServiceYearsStr(v);
                        }}
                        placeholder="Yrs"
                        className="w-full font-mono font-bold text-sm text-slate-950 border border-slate-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>
                    <span className="text-slate-400 text-xs">Y</span>
                    <div className="w-16">
                      <input
                        type="text"
                        inputMode="numeric"
                        id="input-calc-service-months"
                        value={serviceMonthsStr}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                          setServiceMonthsStr(v);
                        }}
                        placeholder="Mos"
                        className="w-full font-mono font-bold text-sm text-slate-950 border border-slate-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>
                    <span className="text-slate-400 text-xs">M</span>
                  </div>
                  <div className="text-[10px] text-blue-800 font-semibold mt-1">
                    Total: {totalServiceYears.toFixed(1)} Continuous Years
                  </div>
                </div>

                {/* Balances */}
                <div className="bg-white p-3 rounded-lg border border-stone-200">
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">
                    Employee PF Share (₹)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    id="input-calc-ee-balance"
                    value={eeBalanceStr}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                      setEeBalanceStr(v);
                    }}
                    placeholder="e.g. 184000"
                    className="w-full font-mono font-bold text-sm text-slate-950 border border-slate-300 rounded px-2.5 py-1.5 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Total PF Corpus: ₹{totalBalance.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Computed Limit Highlights */}
              <div className="p-3.5 bg-white rounded-lg border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                    Statutory Maximum Eligible Withdrawal:
                  </span>
                  <div className="font-mono font-extrabold text-xl text-emerald-800 mt-0.5">
                    ₹{statutoryAssessment.maxAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {statutoryAssessment.ineligibleReason ? (
                      <span className="text-rose-700 font-bold">{statutoryAssessment.ineligibleReason}</span>
                    ) : (
                      statutoryAssessment.summary
                    )}
                  </div>
                </div>

                {statutoryAssessment.isEligible && statutoryAssessment.maxAmount > 0 && (
                  <button
                    type="button"
                    id="btn-apply-max-eligible-amount"
                    onClick={() => setRequestedAmountStr(`${statutoryAssessment.maxAmount}`)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded text-xs transition-all shrink-0 hover:ring-2 hover:ring-amber-400/80"
                  >
                    Apply Max Limit
                  </button>
                )}
              </div>
            </div>

            {/* 4. Amount of Advance Required (Free Typing Input) */}
            {selectedFormType !== 'scheme_cert' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Amount of Advance / Withdrawal Required (in Rs) *
                </label>
                <div className="relative">
                  <input
                    id="input-claim-amount-req"
                    type="text"
                    inputMode="numeric"
                    value={requestedAmountStr}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                      setRequestedAmountStr(v);
                    }}
                    className={`w-full text-base font-mono font-bold text-slate-950 border rounded-lg p-2.5 focus:ring-2 focus:outline-none transition-all ${
                      requestedAmount > statutoryAssessment.maxAmount || requestedAmount <= 0
                        ? 'border-rose-500 bg-rose-50/40 focus:ring-rose-400'
                        : 'border-slate-300 focus:ring-slate-900'
                    }`}
                    placeholder="Enter amount (e.g. 50000)"
                  />
                </div>

                {requestedAmount > statutoryAssessment.maxAmount && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold bg-rose-50 p-2 rounded border border-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Requested amount exceeds statutory maximum eligible limit of ₹{statutoryAssessment.maxAmount.toLocaleString('en-IN')}.
                    </span>
                  </div>
                )}

                {requestedAmount <= 0 && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold bg-rose-50 p-2 rounded border border-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Please enter a valid claim amount greater than ₹0.</span>
                  </div>
                )}
              </div>
            )}

            {/* 5. Employee Residential Address */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Employee Residential Address *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Flat / Door / House No."
                  className="font-medium text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-slate-900"
                />
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Street / Locality / Landmark"
                  className="font-medium text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-slate-900"
                />
                <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="State"
                    className="font-medium text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-slate-900"
                  />
                  <input
                    type="text"
                    value={districtName}
                    onChange={(e) => setDistrictName(e.target.value)}
                    placeholder="District"
                    className="font-medium text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-slate-900"
                  />
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="PIN Code"
                    className="font-medium font-mono text-slate-900 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 6. Cancelled Cheque & Bank Passbook Widget (DigiLocker 1-Click + Preview + Management) */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Attach Scanned Cheque / Bank Passbook *
              </label>

              <DigiLockerChequeWidget
                currentPersona={currentPersona}
                onRefreshPersona={async () => {
                  if (onFixIssue) {
                    await onFixIssue('doc_quality');
                  }
                }}
                onShowToast={onShowToast}
                settings={settings}
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-stone-200 pt-5">
              <button
                type="button"
                onClick={() => setCurrentStep('step2_bank_verify')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 hover:ring-2 hover:ring-amber-400/80 px-2.5 py-1.5 rounded"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                id="btn-proceed-to-step4"
                disabled={!canProceedStep3}
                onClick={() => setCurrentStep('step4_otp_submit')}
                className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition-all shadow-xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Proceed to Aadhaar OTP Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: AADHAAR OTP VERIFICATION & SUBMISSION */}
      {/* ========================================================================= */}
      {currentStep === 'step4_otp_submit' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Step 4 of 4: Aadhaar OTP e-Sign Verification
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">
                Review & Aadhaar OTP Signature
              </h2>
              <p className="text-xs text-slate-500">
                Confirm your claim application details before transmitting electronically to EPFO field office:
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-stone-200">
                <div>
                  <span className="text-slate-500 text-[11px]">Universal Account Number (UAN):</span>
                  <div className="font-mono font-bold text-slate-950 text-sm">{currentPersona.uan}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Member Name:</span>
                  <div className="font-bold text-slate-950 text-sm">{currentPersona.name}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-stone-200">
                <div>
                  <span className="text-slate-500 text-[11px]">Selected Claim Form:</span>
                  <div className="font-bold text-blue-800 text-sm">
                    {selectedFormType === 'form31'
                      ? `Form 31 Advance (${activeReasonRule.name})`
                      : selectedFormType === 'form19'
                      ? 'Form 19 (Full Final Settlement)'
                      : selectedFormType === 'form10c'
                      ? 'Form 10C (EPS Pension Withdrawal)'
                      : 'Scheme Certificate (Form 10C/10D)'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Claim Settlement Amount:</span>
                  <div className="font-mono font-extrabold text-emerald-800 text-base">
                    ₹{requestedAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 text-[11px]">Direct Credit Bank:</span>
                  <div className="font-bold text-slate-800">{currentPersona.profile.bankName} (••••{currentPersona.profile.accountLast4})</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Tax / TDS Exemption:</span>
                  <div className="font-bold text-slate-800">{statutoryAssessment.taxNote}</div>
                </div>
              </div>
            </div>

            {/* Statutory Declaration Checkbox */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  id="checkbox-aadhaar-declaration"
                  type="checkbox"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-700 rounded border-slate-300 focus:ring-blue-700"
                />
                <span className="text-xs text-slate-800 font-medium leading-relaxed">
                  I hereby declare that the particulars given above are true and correct. I give my consent to EPFO to use my Aadhaar data for electronic authentication (e-Sign) under Section 7 of Aadhaar Act 2016.
                </span>
              </label>
            </div>

            {/* Request Aadhaar OTP Button */}
            {!isOtpSent ? (
              <div className="pt-2">
                <button
                  type="button"
                  id="btn-get-aadhaar-otp"
                  disabled={!declarationChecked}
                  onClick={handleSendOtp}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 px-6 rounded-xl text-xs sm:text-sm transition-all shadow-xs hover:ring-2 hover:ring-amber-400/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>Get Aadhaar OTP</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-5 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">Enter 6-Digit Aadhaar OTP:</span>
                  <span className="text-[11px] text-blue-700 font-semibold">Sent to mobile ••••••7742</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    id="input-aadhaar-otp-value"
                    type="text"
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    className="w-full sm:w-48 text-center tracking-widest font-mono font-extrabold text-xl py-2.5 px-4 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="582914"
                  />

                  <button
                    type="button"
                    id="btn-validate-otp-submit-claim"
                    disabled={isSubmitting || otpValue.length < 6}
                    onClick={handleFinalSubmitClaim}
                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-6 rounded-lg text-xs transition-all shadow-xs hover:ring-2 hover:ring-amber-400/80 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Transmitting Claim to Field Office...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Validate OTP & Submit Claim</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep('step3_form_reason')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 hover:ring-2 hover:ring-amber-400/80 px-2.5 py-1.5 rounded"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Form & Calculator</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUCCESS SCREEN: OFFICIAL EPFO RECEIPT & PDF DOWNLOAD                      */}
      {/* ========================================================================= */}
      {currentStep === 'step_success' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl border border-stone-200 p-7 sm:p-9 shadow-lg space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950">
                Claim Submitted Successfully!
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your online claim has been authenticated via Aadhaar e-Sign and transmitted directly to the regional EPFO Field Office.
              </p>
            </div>

            {/* Official Receipt Card */}
            <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  Claim Tracking Reference ID:
                </span>
                <span className="font-mono font-extrabold text-slate-950 text-base bg-white px-2.5 py-1 rounded border border-stone-300">
                  {generatedClaimId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Claim Type:</span>
                  <div className="font-bold text-slate-900">
                    {selectedFormType === 'form31'
                      ? `Form 31 Advance (${activeReasonRule.name})`
                      : selectedFormType === 'form19'
                      ? 'Form 19 (Full Final Settlement)'
                      : 'Form 10C (EPS Pension)'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Settlement Amount:</span>
                  <div className="font-bold font-mono text-emerald-800">₹{requestedAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200">
                <div>
                  <span className="text-slate-500">Crediting Bank:</span>
                  <div className="font-bold text-slate-900">{currentPersona.profile.bankName} (••••{currentPersona.profile.accountLast4})</div>
                </div>
                <div>
                  <span className="text-slate-500">Estimated TAT:</span>
                  <div className="font-bold text-blue-800">3 to 7 Working Days (Auto-Mode)</div>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                id="btn-track-claim-now"
                onClick={() => onNavigate('trackingView')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition-all shadow-xs hover:ring-2 hover:ring-amber-400/80 hover:border-slate-800"
              >
                <span>Track My Claim Status</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  id="btn-download-claim-receipt"
                  onClick={() =>
                    downloadClaimAcknowledgmentFile(
                      {
                        claimId: generatedClaimId,
                        formType:
                          selectedFormType === 'form31'
                            ? `Form 31 Advance (${activeReasonRule.name})`
                            : selectedFormType === 'form19'
                            ? 'Form 19 Final PF Settlement'
                            : 'Form 10C EPS Pension',
                        amount: requestedAmount,
                      },
                      currentPersona
                    )
                  }
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition-all shadow-2xs hover:ring-2 hover:ring-amber-400/80"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Claim Acknowledgment Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadPassbookFile(currentPersona)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-slate-900 font-bold px-4 py-2.5 rounded-lg text-xs border border-stone-300 transition-all shadow-2xs hover:ring-2 hover:ring-amber-400/80"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Passbook & Ledger</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboardView')}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center font-bold text-slate-700 hover:text-slate-900 px-4 py-2.5 rounded-lg text-xs hover:bg-stone-100 transition-all"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL: CERTIFICATE OF UNDERTAKING (STEP 2)                          */}
      {/* ========================================================================= */}
      {showUndertakingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-slate-950 font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
                <span>Certificate of Undertaking</span>
              </div>
              <button
                type="button"
                onClick={() => setShowUndertakingModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <p className="font-semibold text-slate-900">
                Please confirm the following undertaking as required by the Employees' Provident Fund Scheme:
              </p>
              <p>
                1. I hereby verify that the bank account number entered by me (<strong>{enteredBankNumber}</strong>) matches with the bank account seeded with my Universal Account Number (UAN).
              </p>
              <p>
                2. I certify that this is an active savings bank account with NPCI mapper enabled and capable of receiving direct credit via NEFT/RTGS.
              </p>
              <p>
                3. I understand that the EPFO will not be held responsible for settlement credit failures in case of incorrect account credentials provided by me.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUndertakingModal(false)}
                className="text-xs font-bold text-slate-700 hover:text-slate-950 px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 transition-all"
              >
                No, Re-check Number
              </button>
              <button
                type="button"
                id="btn-confirm-undertaking-yes"
                onClick={handleConfirmUndertaking}
                className="text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg transition-all shadow-xs hover:ring-2 hover:ring-amber-400/80"
              >
                Yes, I Agree & Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIGILOCKER ANIMATED MODAL (Arrives when clicked, animates, and auto closes) */}
      {/* ========================================================================= */}
      {isDigiLockerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-90 slide-in-from-bottom-8 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                  DL
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">DigiLocker National Gateway</h3>
                  <p className="text-[10px] text-slate-400">Verifying Central Identity & Service Records</p>
                </div>
              </div>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>

            {/* 2-Column Grid: Left: Verification Stages, Right: Side-by-Side Live Filling Blanks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Stages */}
              <div className="space-y-2 text-xs">
                <div className={`p-2.5 rounded-lg border transition-all duration-300 ${
                  digiLockerStage >= 1 ? 'border-emerald-500/50 bg-slate-800/80' : 'border-slate-800 bg-slate-900/50 opacity-40'
                }`}>
                  <div className="flex items-center justify-between font-bold text-[11px]">
                    <span>1. Aadhaar Identity</span>
                    {digiLockerStage >= 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3 h-3 text-slate-400 animate-spin" />}
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border transition-all duration-300 ${
                  digiLockerStage >= 2 ? 'border-emerald-500/50 bg-slate-800/80' : 'border-slate-800 bg-slate-900/50 opacity-40'
                }`}>
                  <div className="flex items-center justify-between font-bold text-[11px]">
                    <span>2. Income Tax PAN</span>
                    {digiLockerStage >= 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : digiLockerStage === 2 ? <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" /> : <Clock className="w-3 h-3 text-slate-500" />}
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border transition-all duration-300 ${
                  digiLockerStage >= 3 ? 'border-emerald-500/50 bg-slate-800/80' : 'border-slate-800 bg-slate-900/50 opacity-40'
                }`}>
                  <div className="flex items-center justify-between font-bold text-[11px]">
                    <span>3. NPCI Bank Account</span>
                    {digiLockerStage >= 4 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : digiLockerStage === 3 ? <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" /> : <Clock className="w-3 h-3 text-slate-500" />}
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border transition-all duration-300 ${
                  digiLockerStage >= 4 ? 'border-emerald-500/50 bg-slate-800/80' : 'border-slate-800 bg-slate-900/50 opacity-40'
                }`}>
                  <div className="flex items-center justify-between font-bold text-[11px]">
                    <span>4. EPFO Service Ledger</span>
                    {digiLockerStage >= 5 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : digiLockerStage === 4 ? <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" /> : <Clock className="w-3 h-3 text-slate-500" />}
                  </div>
                </div>
              </div>

              {/* Right Column: Blank-by-blank filling on the sides */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Extracted KYC Record</span>
                  <span className="text-[9px] text-slate-400">Live Sync</span>
                </div>

                {/* Aadhaar Name Blank */}
                <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Aadhaar Linked Name:</div>
                  <div className="font-bold text-white text-[11px] min-h-[18px]">
                    {digiLockerBlanks?.aadhaarName ? (
                      <span className="text-emerald-400 animate-in fade-in duration-300">{digiLockerBlanks.aadhaarName}</span>
                    ) : (
                      <span className="text-slate-600 italic">Waiting for Aadhaar handshake...</span>
                    )}
                  </div>
                </div>

                {/* PAN Blank */}
                <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Permanent Account No (PAN):</div>
                  <div className="font-bold font-mono text-white text-[11px] min-h-[18px]">
                    {digiLockerBlanks?.pan ? (
                      <span className="text-emerald-400 animate-in fade-in duration-300">{digiLockerBlanks.pan} (Verified)</span>
                    ) : (
                      <span className="text-slate-600 italic">Waiting for PAN sync...</span>
                    )}
                  </div>
                </div>

                {/* Bank IFSC Blank */}
                <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Active NPCI Bank IFSC:</div>
                  <div className="font-bold font-mono text-white text-[11px] min-h-[18px]">
                    {digiLockerBlanks?.bankIfsc ? (
                      <span className="text-emerald-400 animate-in fade-in duration-300">{digiLockerBlanks.bankIfsc} • {digiLockerBlanks.bankName}</span>
                    ) : (
                      <span className="text-slate-600 italic">Waiting for NPCI mapping...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Status Text */}
            <div className="p-2.5 rounded-lg bg-slate-800/50 text-[11px] text-amber-300 font-mono text-center flex items-center justify-center gap-2">
              {!isDigiLockerFinished ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{digiLockerStatusText}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">{digiLockerStatusText}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KYC DIAGNOSTICS & COMPARISON DRAWER                                       */}
      {/* ========================================================================= */}
      <KycDiagnosticsDrawer
        isOpen={isDiagnosticsDrawerOpen}
        onClose={() => setIsDiagnosticsDrawerOpen(false)}
        currentPersona={currentPersona}
        onApplyFixes={async () => {
          await MockBackend.autoFixIssues(currentPersona.id);
          if (onRefreshPersona) await onRefreshPersona();
        }}
        onNavigate={onNavigate}
        onShowToast={onShowToast}
      />

      {/* ========================================================================= */}
      {/* AUTONOMOUS AUTO-FIX MODAL WITH ANIMATED MATCHING PIPELINE                 */}
      {/* ========================================================================= */}
      <AutoFixModal
        isOpen={isAutoFixModalOpen}
        onClose={() => setIsAutoFixModalOpen(false)}
        currentPersona={currentPersona}
        onSuccess={async () => {
          if (onRefreshPersona) await onRefreshPersona();
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};
