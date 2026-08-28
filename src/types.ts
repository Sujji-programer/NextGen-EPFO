export type Language = 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'ml';

export type ViewName =
  | 'loginView'
  | 'dashboardView'
  | 'claimDoctorView'
  | 'balanceView'
  | 'transferView'
  | 'trackingView'
  | 'profileView'
  | 'nominationView'
  | 'grievanceView'
  | 'calculatorView'
  | 'assistantView'
  | 'settingsView';

export type IssueSeverity = 'high' | 'medium' | 'low';

export interface IssueItem {
  id: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  fixActionLabel: string;
  category: 'kyc' | 'bank' | 'employer' | 'claim';
  fixed?: boolean;
}

export interface OldAccount {
  employer: string;
  memberId: string;
  balance: number;
  status: 'Not transferred' | 'Transfer in progress' | 'Transferred';
  transferDate?: string;
  trackingId?: string;
}

export interface PreviousClaim {
  claimId: string;
  formType: string;
  date: string;
  status: 'rejected' | 'settled' | 'under_process';
  officialReason: string;
  translatedReason: string;
  suggestedAction: string;
}

export interface ActiveClaim {
  claimId: string;
  formType: string;
  submittedAt: string;
  currentStep: number;
  estimatedSettlement: string;
  steps: {
    title: string;
    description: string;
    completed: boolean;
    date?: string;
  }[];
}

export type ResolutionRoute = 'self_service' | 'digilocker' | 'joint_declaration';

export interface MandatoryKycCheck {
  id: 'trust_status' | 'aadhaar' | 'pan' | 'bank' | 'exit_date' | 'doc_quality' | string;
  name: string;
  status: 'passed' | 'warning' | 'failed';
  statusLabel: string;
  details: string;
  exactReason?: string;
  financialImpact?: string;
  resolutionRoute?: ResolutionRoute;
  canAutoFix?: boolean;
}

export interface UserProfile {
  dob: string;
  epfoDob?: string;
  aadhaarDob?: string;
  aadhaarName: string;
  pan: string;
  panSeeded: boolean;
  bankName: string;
  accountLast4: string;
  fullAccountNumber?: string;
  ifsc: string;
  ifscStatus?: 'valid' | 'defunct_merged';
  bankVerified: boolean;
  fatherName: string;
  mobile: string;
  email: string;
  gender: string;
  serviceOverlap?: boolean;
  chequeStatus?: 'valid' | 'name_mismatch' | 'unreadable' | 'not_uploaded' | 'pending';
  chequeFileName?: string;
  chequeSource?: 'digilocker' | 'manual_upload';
  chequeVerifiedAt?: string;
  isInsolventTrust?: boolean;
  employment: {
    employer: string;
    from: string;
    to?: string;
    doj?: string;
    doe?: string | null;
    exitDateUpdated: boolean;
    memberId: string;
    concurrentEmployer?: string;
  };
}

export interface BalanceDetails {
  total: number;
  employeeContribution: number;
  employerContribution: number;
  interest: number;
  pensionFund?: number;
  lastUpdated: string;
}

export interface Persona {
  id: string;
  scenarioType: 'clean_pass' | 'fixable_amber' | 'critical_red';
  name: string;
  uan: string;
  label: string;
  claimReadiness: number;
  initialReadiness: number;
  serviceYears: number;
  serviceMonths: number;
  monthlyBasicPay: number;
  issues: IssueItem[];
  mandatoryChecks: MandatoryKycCheck[];
  balance: BalanceDetails;
  oldAccounts: OldAccount[];
  profile: UserProfile;
  previousClaim?: PreviousClaim;
  activeClaim?: ActiveClaim;
}

export interface GPTSettings {
  enabled: boolean;
  apiKey: string;
  model: string;
  maxTokens: number;
  tokenBudget: number;
  tokensUsed: number;
  apiEndpoint?: string;
}

export interface AppSettings {
  language: Language;
  fontSize: 'small' | 'normal' | 'large';
  highContrast: boolean;
  readAloud?: boolean;
  gpt?: GPTSettings;
}

export interface CalculationResult {
  eligible: boolean;
  eligibilityStatus?: 'Eligible' | 'Partially eligible' | 'May not be eligible' | 'Please check details';
  maxAmount: number;
  requestedAmount?: number;
  approvedAmount?: number;
  category: string;
  explanation: string;
  tdsApplicable: boolean;
  tdsPercent: number;
  tdsAmount?: number;
  netPayableAmount?: number;
  taxNote: string;
  autoSettlementActive?: boolean;
  schemeCertMandatory?: boolean;
  tableDFactor?: number;
  disclaimer?: string;
}

export interface PresetClaimData {
  formType: 'form31' | 'form19' | 'form10c' | 'scheme_cert';
  advanceReason?: string;
  requestedAmount?: number;
  monthlyBasicPay?: number;
  serviceYears?: number;
  serviceMonths?: number;
  autoSettlementEligible?: boolean;
}


