export type Form31Reason = 'illness' | 'marriage' | 'education' | 'house_purchase' | 'site_purchase' | 'home_loan'

export const EPFO_RULES = {
  interestRate: 0.0825,
  wageCeiling: 15000,
  panTdsRate: 0.1,
  noPanTdsRate: 0.34608,
} as const

export const FORM31_REASONS: Record<Form31Reason, { label: string; minYears: number; months: number; cap: 'employee' | 'total' }> = {
  illness: { label: 'Illness / medical treatment (Para 68J)', minYears: 0, months: 6, cap: 'employee' },
  marriage: { label: 'Marriage (self, children or sibling) (Para 68K)', minYears: 7, months: 0, cap: 'employee' },
  education: { label: 'Post-matric education (Para 68K)', minYears: 7, months: 0, cap: 'employee' },
  house_purchase: { label: 'House purchase / construction (Para 68B)', minYears: 5, months: 36, cap: 'total' },
  site_purchase: { label: 'Site / land purchase (Para 68B)', minYears: 5, months: 24, cap: 'total' },
  home_loan: { label: 'Housing-loan repayment (Para 68BB)', minYears: 10, months: 36, cap: 'total' },
}

export function serviceInYears(years: number, months: number) {
  return Math.max(0, years) + Math.max(0, Math.min(11, months)) / 12
}

export function calculateForm31(reason: Form31Reason, years: number, months: number, basicDa: number, employeeShare: number, totalPf: number, requested: number) {
  const rule = FORM31_REASONS[reason]
  const service = serviceInYears(years, months)
  const eligible = service >= rule.minYears
  const salaryCap = rule.months ? basicDa * rule.months : employeeShare * 0.5
  const maxAmount = eligible ? Math.min(salaryCap, rule.cap === 'employee' ? employeeShare : totalPf) : 0
  const approved = Math.min(Math.max(0, requested), maxAmount)
  return { eligible, maxAmount, approved, service, rule, explanation: eligible ? `Maximum is the lower of the statutory cap and your available ${rule.cap === 'employee' ? 'employee share' : 'total PF balance'}. Form 31 advances are not subject to TDS.` : `This purpose requires at least ${rule.minYears} years of eligible service.`, tds: 0 }
}

export function calculateForm19(years: number, months: number, totalPf: number, requested: number, panLinked: boolean, form15Filed: boolean) {
  const service = serviceInYears(years, months)
  const amount = Math.min(Math.max(0, requested || totalPf), totalPf)
  let rate = 0
  let explanation = 'No TDS: continuous service is at least 5 years.'
  if (service < 5 && amount >= 50000 && !form15Filed) {
    rate = panLinked ? EPFO_RULES.panTdsRate : EPFO_RULES.noPanTdsRate
    explanation = panLinked ? 'TDS is 10% because service is under 5 years, withdrawal is at least ₹50,000, and PAN is linked.' : 'TDS is 34.608% because PAN is not linked under Section 206AA.'
  } else if (service < 5 && amount < 50000) explanation = 'No TDS: withdrawal is below the ₹50,000 threshold.'
  else if (form15Filed) explanation = 'No TDS shown: Form 15G/15H declaration is marked as filed; eligibility is subject to the Income Tax Act.'
  const tds = Math.round(amount * rate)
  return { eligible: true, maxAmount: totalPf, approved: amount, service, rate: rate * 100, tds, net: amount - tds, explanation }
}

const TABLE_D: Record<number, number> = { 1: 1.02, 2: 2.05, 3: 3.12, 4: 4.22, 5: 5.35, 6: 6.51, 7: 7.71, 8: 8.94, 9: 10.2 }
export function calculateForm10C(years: number, months: number, pensionBalance: number) {
  const service = serviceInYears(years, months)
  if (service < 0.5) return { eligible: false, mandatoryCertificate: false, amount: 0, factor: 0, explanation: 'Form 10C requires at least 6 months of pensionable service.' }
  if (service >= 9.5) return { eligible: false, mandatoryCertificate: true, amount: 0, factor: 0, explanation: 'At 9.5 years or more, cash withdrawal is not available; apply for a Scheme Certificate instead.' }
  const completedYears = Math.min(9, Math.max(1, Math.floor(service)))
  const factor = TABLE_D[completedYears]
  return { eligible: true, mandatoryCertificate: false, amount: Math.round(pensionBalance * factor), factor, explanation: `EPS withdrawal benefit uses the Table D factor of ${factor} for ${completedYears} completed years. No TDS applies.` }
}

export function monthlyContribution(basicDa: number) {
  const pensionWage = Math.min(Math.max(0, basicDa), EPFO_RULES.wageCeiling)
  const employee = basicDa * 0.12
  const eps = Math.min(pensionWage * 0.0833, 1250)
  return { employee, eps, employerEpF: Math.max(0, basicDa * 0.12 - eps) }
}

export const formatInr = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`
