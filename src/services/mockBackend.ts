import { INITIAL_PERSONAS } from '../data/personas';
import {
  Persona,
  IssueItem,
  OldAccount,
  UserProfile,
  BalanceDetails,
  CalculationResult,
  ActiveClaim,
} from '../types';

export interface ActivityLogEntry {
  id: string;
  action: string;
  timestamp: string;
  readinessScore: number;
  details: string;
}

const STORAGE_KEYS = {
  PERSONAS_STATE: 'epfoClaimDoctor_persona',
  SETTINGS: 'epfoClaimDoctor_settings',
  SELECTED_PERSONA_ID: 'epfoClaimDoctor_selected_persona_id',
  CLAIM: 'epfoClaimDoctor_claim',
  ISSUES: 'epfoClaimDoctor_issues',
  ASSISTANT: 'epfoClaimDoctor_assistant',
  ACTIVITY_LOG: 'epfoClaimDoctor_activity_log',
};

// Helper to load or initialize personas from localStorage
function getStoredPersonas(): Record<string, Persona> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAS_STATE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading stored personas', e);
  }
  // Initialize default
  saveStoredPersonas(INITIAL_PERSONAS);
  return JSON.parse(JSON.stringify(INITIAL_PERSONAS));
}

function saveStoredPersonas(personas: Record<string, Persona>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PERSONAS_STATE, JSON.stringify(personas));
  } catch (e) {
    console.error('Error saving personas', e);
  }
}

// Activity Log helpers
export function getActivityLogs(): ActivityLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [
    {
      id: 'log-init',
      action: 'Session Initialized',
      timestamp: 'Just now',
      readinessScore: 98,
      details: 'Mock EPFO prototype environment active.',
    },
  ];
}

export function logActivity(action: string, readinessScore: number, details: string): void {
  try {
    const current = getActivityLogs();
    const newEntry: ActivityLogEntry = {
      id: `log-${Date.now()}`,
      action,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      readinessScore,
      details,
    };
    const updated = [newEntry, ...current].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// Simulated network delay helper (100-250ms for realistic fast responsiveness)
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const MockBackend = {
  // 1. Get current selected persona ID & object
  async getCurrentPersona(personaIdOverride?: string): Promise<Persona> {
    await delay(100);
    const personas = getStoredPersonas();
    const storedId =
      personaIdOverride ||
      localStorage.getItem(STORAGE_KEYS.SELECTED_PERSONA_ID) ||
      'account-a';
    const persona = personas[storedId] || personas['account-a'] || personas['asha-clean'];
    return JSON.parse(JSON.stringify(persona));
  },

  // Set selected persona ID
  setSelectedPersonaId(personaId: string): void {
    localStorage.setItem(STORAGE_KEYS.SELECTED_PERSONA_ID, personaId);
    logActivity('Switched Citizen Persona', 98, `Switched persona to ${personaId}`);
  },

  getSelectedPersonaId(): string {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_PERSONA_ID) || 'account-a';
  },

  // 2. Get balance
  async getBalance(personaId: string): Promise<BalanceDetails> {
    await delay(120);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) throw new Error('Persona not found');
    return persona.balance;
  },

  // 3. Get old accounts
  async getOldAccounts(personaId: string): Promise<OldAccount[]> {
    await delay(120);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) return [];
    return persona.oldAccounts || [];
  },

  // Transfer old account
  async transferOldAccount(personaId: string, memberId: string): Promise<{ success: boolean; message: string; trackingId: string }> {
    await delay(250);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) throw new Error('Persona not found');

    const account = persona.oldAccounts.find((a) => a.memberId === memberId);
    const trackingId = `TRF-${Date.now().toString().slice(-6)}`;
    if (account) {
      account.status = 'Transfer in progress';
      account.transferDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      account.trackingId = trackingId;
      // Add balance to current balance once transfer is prepared
      persona.balance.total += account.balance;
      persona.balance.employeeContribution += Math.round(account.balance * 0.65);
      persona.balance.employerContribution += Math.round(account.balance * 0.35);
      saveStoredPersonas(personas);
      logActivity('PF Transfer Initiated', persona.claimReadiness, `Prepared One Member One EPF transfer for ${memberId}`);
    }
    return {
      success: true,
      message: 'Transfer request prepared. This is mocked for the prototype.',
      trackingId,
    };
  },

  // 4. Get issues
  async getIssues(personaId: string): Promise<IssueItem[]> {
    await delay(100);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) return [];
    return persona.issues || [];
  },

  // 5. Get claim readiness score
  async getClaimReadiness(personaId: string): Promise<{ score: number; label: string; issueCount: number }> {
    await delay(80);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) return { score: 98, label: 'Clean record', issueCount: 0 };
    return {
      score: persona.claimReadiness,
      label: persona.label,
      issueCount: (persona.issues || []).filter((i) => !i.fixed).length,
    };
  },

  // 6. Fix issue
  async fixIssue(personaId: string, issueId: string): Promise<{ success: boolean; newReadiness: number; persona: Persona; message?: string }> {
    await delay(200);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) throw new Error('Persona not found');

    // Update specific issue
    const issue = persona.issues.find((i) => i.id === issueId);
    if (issue) {
      issue.fixed = true;
    }

    // Apply specific fixes to profile and exact score progression
    if (issueId === 'pan_unseeded' || issueId === 'pan') {
      persona.profile.pan = 'ABCDE5566P';
      persona.profile.panSeeded = true;
      const panCheck = (persona.mandatoryChecks || []).find((c) => c.id === 'pan');
      if (panCheck) {
        panCheck.status = 'passed';
        panCheck.statusLabel = 'Seeded & Verified (0% TDS)';
      }
    } else if (issueId === 'defunct_ifsc' || issueId === 'bank_unverified' || issueId === 'bank') {
      persona.profile.ifsc = 'ZNTH0000123';
      persona.profile.bankName = 'Zenith United Bank (Merged Horizon)';
      persona.profile.ifscStatus = 'valid';
      persona.profile.bankVerified = true;
      const bankCheck = (persona.mandatoryChecks || []).find((c) => c.id === 'bank');
      if (bankCheck) {
        bankCheck.status = 'passed';
        bankCheck.statusLabel = 'Verified (Zenith Bank ZNTH0000123)';
      }
    } else if (issueId === 'exit_date_missing' || issueId === 'exit_date') {
      persona.profile.employment.doe = '30-Apr-2024';
      persona.profile.employment.exitDateUpdated = true;
      const exitCheck = (persona.mandatoryChecks || []).find((c) => c.id === 'exit_date');
      if (exitCheck) {
        exitCheck.status = 'passed';
        exitCheck.statusLabel = 'Self-Marked: 30-Apr-2024';
      }
    } else if (issueId === 'name_mismatch') {
      persona.profile.aadhaarName = persona.name;
      const aadhaarCheck = (persona.mandatoryChecks || []).find((c) => c.id === 'aadhaar');
      if (aadhaarCheck) {
        aadhaarCheck.status = 'passed';
        aadhaarCheck.statusLabel = 'Matched with UIDAI';
      }
    } else if (issueId === 'rejected_claim') {
      if (persona.previousClaim) {
        persona.previousClaim.status = 'settled';
      }
    }

    // Recalculate score based on remaining unresolved checks & issues
    const unResolvedChecks = (persona.mandatoryChecks || []).filter((c) => c.status !== 'passed');
    const unResolvedIssues = (persona.issues || []).filter((i) => !i.fixed);

    if (unResolvedChecks.length === 0 && unResolvedIssues.length === 0) {
      persona.claimReadiness = 100;
      persona.label = 'Clean record';
    } else if (unResolvedChecks.length === 0) {
      persona.claimReadiness = 98;
      persona.label = 'Clean record';
    } else {
      persona.claimReadiness = Math.min(95, Math.max(30, 100 - unResolvedChecks.length * 18));
    }

    if (personaId === 'account-b' && personas['ravi-issues']) {
      personas['ravi-issues'] = JSON.parse(JSON.stringify(persona));
    } else if (personaId === 'ravi-issues' && personas['account-b']) {
      personas['account-b'] = JSON.parse(JSON.stringify(persona));
    }

    saveStoredPersonas(personas);
    logActivity('Fixed Rejection Risk', persona.claimReadiness, `Resolved issue ${issueId}. Score is now ${persona.claimReadiness}%`);

    return {
      success: true,
      newReadiness: persona.claimReadiness,
      persona: JSON.parse(JSON.stringify(persona)),
    };
  },

  // 6c. Fix Single Mandatory Check (1-Click single item resolution)
  async fixSingleCheck(personaId: string, checkId: string): Promise<{ success: boolean; newReadiness: number; persona: Persona; message: string }> {
    await delay(180);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) throw new Error('Persona not found');

    let message = 'Check resolved successfully.';

    if (checkId === 'pan') {
      persona.profile.pan = 'ABCDE5566P';
      persona.profile.panSeeded = true;
      const panCheck = (persona.mandatoryChecks || []).find((c) => c.id === 'pan');
      if (panCheck) {
        panCheck.status = 'passed';
        panCheck.statusLabel = 'Seeded & Verified (0% TDS)';
      }
      const panIssue = (persona.issues || []).find((i) => i.id === 'pan_unseeded');
      if (panIssue) panIssue.fixed = true;
      message = 'Income Tax PAN ABCDE5566P seeded and verified via DigiLocker. Penal TDS waived.';
    } else if (checkId === 'bank') {
      persona.profile.ifsc = 'ZNTH0000123';
      persona.profile.bankName = 'Zenith United Bank (Merged Horizon)';
      persona.profile.ifscStatus = 'valid';
      persona.profile.bankVerified = true;
      const bankCheck = (persona.mandatoryChecks || []).find((c) => c.id === 'bank');
      if (bankCheck) {
        bankCheck.status = 'passed';
        bankCheck.statusLabel = 'Verified (Zenith Bank ZNTH0000123)';
      }
      const ifscIssue = (persona.issues || []).find((i) => i.id === 'defunct_ifsc' || i.id === 'bank_unverified');
      if (ifscIssue) ifscIssue.fixed = true;
      message = 'Defunct Horizon National Bank IFSC upgraded to Zenith United Bank ZNTH0000123 via RBI NPCI clearing gateway.';
    } else if (checkId === 'exit_date') {
      persona.profile.employment.doe = '30-Apr-2024';
      persona.profile.employment.exitDateUpdated = true;
      const exitCheck = (persona.mandatoryChecks || []).find((c) => c.id === 'exit_date');
      if (exitCheck) {
        exitCheck.status = 'passed';
        exitCheck.statusLabel = 'Self-Marked: 30-Apr-2024';
      }
      const exitIssue = (persona.issues || []).find((i) => i.id === 'exit_date_missing');
      if (exitIssue) exitIssue.fixed = true;
      message = 'Date of Exit recorded as 30-Apr-2024 via Aadhaar OTP member self-exit utility.';
    } else if (checkId === 'aadhaar') {
      persona.profile.aadhaarName = persona.name;
      const aadhaarCheck = (persona.mandatoryChecks || []).find((c) => c.id === 'aadhaar');
      if (aadhaarCheck) {
        aadhaarCheck.status = 'passed';
        aadhaarCheck.statusLabel = 'Matched with UIDAI';
      }
      const nameIssue = (persona.issues || []).find((i) => i.id === 'name_mismatch');
      if (nameIssue) nameIssue.fixed = true;
      message = 'Aadhaar demographic records synchronized and validated with UIDAI.';
    } else if (checkId === 'doc_quality') {
      persona.profile.chequeStatus = 'valid';
      persona.profile.chequeFileName = 'DigiLocker_Certified_Cheque.jpg';
      persona.profile.chequeSource = 'digilocker';
      persona.profile.chequeVerifiedAt = new Date().toISOString();
      const docCheck = (persona.mandatoryChecks || []).find((c) => c.id === 'doc_quality');
      if (docCheck) {
        docCheck.status = 'passed';
        docCheck.statusLabel = 'Verified (DigiLocker Certified Cheque)';
        docCheck.details = 'Certified cancelled cheque auto-fetched from DigiLocker / Bank NPCI Vault.';
      }
      message = 'DigiLocker Certified Cancelled Cheque fetched and verified with 100% OCR match.';
    }

    // Calculate score
    const unResolved = (persona.mandatoryChecks || []).filter((c) => c.status !== 'passed');
    if (unResolved.length === 0) {
      persona.claimReadiness = 100;
      persona.label = 'Clean record';
    } else {
      persona.claimReadiness = Math.min(95, Math.max(30, 100 - unResolved.length * 18));
    }

    if (personaId === 'account-b' && personas['ravi-issues']) {
      personas['ravi-issues'] = JSON.parse(JSON.stringify(persona));
    } else if (personaId === 'ravi-issues' && personas['account-b']) {
      personas['account-b'] = JSON.parse(JSON.stringify(persona));
    }

    saveStoredPersonas(personas);
    logActivity('Fixed Single KYC Check', persona.claimReadiness, message);

    return {
      success: true,
      newReadiness: persona.claimReadiness,
      persona: JSON.parse(JSON.stringify(persona)),
      message,
    };
  },

  // Direct Profile / eKYC Fixes
  async updateProfile(personaId: string, partialProfile: Partial<UserProfile>, fixedIssueIds: string[] = []): Promise<{ success: boolean; persona: Persona; newReadiness: number }> {
    await delay(200);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) throw new Error('Persona not found');

    persona.profile = {
      ...persona.profile,
      ...partialProfile,
      employment: {
        ...persona.profile.employment,
        ...(partialProfile.employment || {}),
      },
    };

    if (partialProfile.aadhaarName) {
      persona.name = partialProfile.aadhaarName;
    }

    // Mark issues as fixed if applicable
    for (const issueId of fixedIssueIds) {
      const target = persona.issues.find((i) => i.id === issueId);
      if (target) target.fixed = true;
    }

    // Recalculate readiness
    const activeIssues = (persona.issues || []).filter((i) => !i.fixed);
    if (activeIssues.length === 0) {
      persona.claimReadiness = 100;
      persona.label = 'Clean record';
    } else {
      persona.claimReadiness = Math.min(100 - activeIssues.length * 15, 85);
    }

    saveStoredPersonas(personas);
    logActivity('eKYC Profile Updated', persona.claimReadiness, `Updated member profile and verified eKYC records directly.`);

    return {
      success: true,
      persona: JSON.parse(JSON.stringify(persona)),
      newReadiness: persona.claimReadiness,
    };
  },

  // 6a. One-Click Auto-Fix KYC Issues
  async autoFixIssues(personaId: string): Promise<{ success: boolean; persona: Persona; newReadiness: number; summary: string }> {
    await delay(250);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) throw new Error('Persona not found');

    if (personaId === 'account-c' || personaId === 'meena-rejected') {
      return {
        success: false,
        persona: JSON.parse(JSON.stringify(persona)),
        newReadiness: 0,
        summary: 'Automated Online Fix Failed: Discrepancy requires physical Joint Declaration and regional field office verification.',
      };
    }

    // 1. Auto-seed PAN
    persona.profile.pan = 'ABCDE5566P';
    persona.profile.panSeeded = true;

    // 2. Aligns Aadhaar Name spelling
    persona.profile.aadhaarName = persona.name;

    // 3. Updates IFSC from Horizon (HORZ0000123) to merged Zenith United Bank (ZNTH0000123)
    persona.profile.ifsc = 'ZNTH0000123';
    persona.profile.bankName = 'Zenith United Bank (Merged Horizon)';
    persona.profile.ifscStatus = 'valid';
    persona.profile.bankVerified = true;

    // 4. Mark Date of Exit (Self-Exit utility via Aadhaar OTP)
    persona.profile.employment.doe = '30-Apr-2024';
    persona.profile.employment.exitDateUpdated = true;

    // 5. Mark all fixable issues as fixed
    persona.issues = (persona.issues || []).map((i) => {
      if (i.id !== 'dob_mismatch_major' && i.id !== 'service_overlap') {
        return { ...i, fixed: true };
      }
      return i;
    });

    // 6. Update Mandatory KYC checks
    persona.mandatoryChecks = (persona.mandatoryChecks || []).map((c) => {
      if (c.id === 'aadhaar') {
        return { ...c, status: 'passed' as const, statusLabel: '100% Matched via UIDAI' };
      }
      if (c.id === 'pan') {
        return { ...c, status: 'passed' as const, statusLabel: 'Seeded & Verified (0% TDS)' };
      }
      if (c.id === 'bank') {
        return { ...c, status: 'passed' as const, statusLabel: 'Verified (Zenith Bank ZNTH0000123)' };
      }
      if (c.id === 'exit_date') {
        return { ...c, status: 'passed' as const, statusLabel: 'Self-Marked: 30-Apr-2024' };
      }
      if (c.id === 'doc_quality' && persona.profile.chequeStatus === 'valid') {
        return { ...c, status: 'passed' as const, statusLabel: 'Verified Document' };
      }
      return c;
    });

    // Recalculate score
    const unResolved = (persona.mandatoryChecks || []).filter((c) => c.status !== 'passed');
    persona.claimReadiness = unResolved.length === 0 ? 100 : Math.max(90, 100 - unResolved.length * 5);
    persona.label = unResolved.length === 0 ? 'Clean record' : 'KYC issues';

    saveStoredPersonas(personas);
    logActivity('KYC Auto-Fix', persona.claimReadiness, 'Auto-seeded PAN, updated merged Zenith Bank IFSC, and self-marked Date of Exit.');

    return {
      success: true,
      persona: JSON.parse(JSON.stringify(persona)),
      newReadiness: persona.claimReadiness,
      summary: 'PAN ABCDE5566P seeded, Bank IFSC updated to ZNTH0000123 (Zenith United Bank), and Date of Exit recorded.',
    };
  },

  // Cheque Document Management API
  async fetchDigiLockerCheque(personaId: string): Promise<{ success: boolean; persona: Persona; newReadiness: number; message: string }> {
    await delay(350);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) throw new Error('Persona not found');

    persona.profile.chequeStatus = 'valid';
    persona.profile.chequeFileName = 'DigiLocker_Certified_Cheque.jpg';
    persona.profile.chequeSource = 'digilocker';
    persona.profile.chequeVerifiedAt = new Date().toISOString();

    const docCheck = (persona.mandatoryChecks || []).find((c) => c.id === 'doc_quality');
    if (docCheck) {
      docCheck.status = 'passed';
      docCheck.statusLabel = 'Verified (DigiLocker Vault)';
      docCheck.details = 'Certified cancelled cheque auto-fetched and cryptographically sealed from DigiLocker / Bank NPCI Vault.';
    }

    const unResolved = (persona.mandatoryChecks || []).filter((c) => c.status !== 'passed');
    persona.claimReadiness = unResolved.length === 0 ? 100 : Math.max(30, 100 - unResolved.length * 18);

    saveStoredPersonas(personas);
    logActivity('DigiLocker Cheque Link', persona.claimReadiness, 'Fetched certified digital cancelled cheque from DigiLocker bank repository.');

    return {
      success: true,
      persona: JSON.parse(JSON.stringify(persona)),
      newReadiness: persona.claimReadiness,
      message: 'DigiLocker Certified Cancelled Cheque fetched and verified successfully!',
    };
  },

  async uploadManualCheque(personaId: string, fileName: string): Promise<{ success: boolean; persona: Persona; newReadiness: number; message: string }> {
    await delay(250);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) throw new Error('Persona not found');

    persona.profile.chequeStatus = 'valid';
    persona.profile.chequeFileName = fileName || 'Uploaded_Scanned_Cheque.jpg';
    persona.profile.chequeSource = 'manual_upload';
    persona.profile.chequeVerifiedAt = new Date().toISOString();

    const docCheck = (persona.mandatoryChecks || []).find((c) => c.id === 'doc_quality');
    if (docCheck) {
      docCheck.status = 'passed';
      docCheck.statusLabel = 'Verified Scanned Copy';
      docCheck.details = `Scanned copy (${persona.profile.chequeFileName}) verified with OCR name and account match.`;
    }

    const unResolved = (persona.mandatoryChecks || []).filter((c) => c.status !== 'passed');
    persona.claimReadiness = unResolved.length === 0 ? 100 : Math.max(30, 100 - unResolved.length * 18);

    saveStoredPersonas(personas);
    logActivity('Manual Cheque Upload', persona.claimReadiness, `Uploaded scanned cheque document: ${fileName}`);

    return {
      success: true,
      persona: JSON.parse(JSON.stringify(persona)),
      newReadiness: persona.claimReadiness,
      message: 'Scanned cheque copy uploaded and verified with OCR name and account match.',
    };
  },

  async removeChequeDocument(personaId: string): Promise<{ success: boolean; persona: Persona; newReadiness: number; message: string }> {
    await delay(150);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) throw new Error('Persona not found');

    persona.profile.chequeStatus = 'not_uploaded';
    persona.profile.chequeFileName = '';
    persona.profile.chequeSource = undefined;
    persona.profile.chequeVerifiedAt = undefined;

    const docCheck = (persona.mandatoryChecks || []).find((c) => c.id === 'doc_quality');
    if (docCheck) {
      docCheck.status = 'warning';
      docCheck.statusLabel = 'Pending DigiLocker Fetch / Upload';
      docCheck.details = 'Cancelled cheque not yet linked. Fetch via DigiLocker or upload scanned copy.';
    }

    const unResolved = (persona.mandatoryChecks || []).filter((c) => c.status !== 'passed');
    persona.claimReadiness = unResolved.length === 0 ? 100 : Math.max(30, 100 - unResolved.length * 18);

    saveStoredPersonas(personas);
    logActivity('Removed Cheque Document', persona.claimReadiness, 'Reset cancelled cheque document.');

    return {
      success: true,
      persona: JSON.parse(JSON.stringify(persona)),
      newReadiness: persona.claimReadiness,
      message: 'Cancelled cheque document removed.',
    };
  },

  // Alias for backward compatibility
  async autoFixDigiLocker(personaId: string): Promise<{ success: boolean; persona: Persona; newReadiness: number; summary: string }> {
    return this.autoFixIssues(personaId);
  },

  // 6b. Manual KYC & Date of Exit Update
  async manualUpdateKyc(
    personaId: string,
    data: {
      pan?: string;
      ifsc?: string;
      bankAccount?: string;
      doe?: string;
      exitReason?: string;
    }
  ): Promise<{ success: boolean; persona: Persona; newReadiness: number }> {
    await delay(200);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) throw new Error('Persona not found');

    if (data.pan) {
      persona.profile.pan = data.pan.toUpperCase();
      persona.profile.panSeeded = true;
      const panCheck = persona.mandatoryChecks?.find((c) => c.id === 'pan');
      if (panCheck) {
        panCheck.status = 'passed';
        panCheck.statusLabel = 'Manually Verified';
      }
      const panIssue = persona.issues?.find((i) => i.id === 'pan_unseeded');
      if (panIssue) panIssue.fixed = true;
    }

    if (data.ifsc) {
      persona.profile.ifsc = data.ifsc.toUpperCase();
      persona.profile.ifscStatus = 'valid';
      persona.profile.bankVerified = true;
      const bankCheck = persona.mandatoryChecks?.find((c) => c.id === 'bank');
      if (bankCheck) {
        bankCheck.status = 'passed';
        bankCheck.statusLabel = `Verified (${data.ifsc.toUpperCase()})`;
      }
      const ifscIssue = persona.issues?.find((i) => i.id === 'defunct_ifsc');
      if (ifscIssue) ifscIssue.fixed = true;
    }

    if (data.bankAccount) {
      persona.profile.fullAccountNumber = data.bankAccount;
      persona.profile.accountLast4 = data.bankAccount.slice(-4);
    }

    if (data.doe) {
      persona.profile.employment.doe = data.doe;
      persona.profile.employment.exitDateUpdated = true;
      const exitCheck = persona.mandatoryChecks?.find((c) => c.id === 'exit_date');
      if (exitCheck) {
        exitCheck.status = 'passed';
        exitCheck.statusLabel = `Self-Marked: ${data.doe}`;
      }
      const exitIssue = persona.issues?.find((i) => i.id === 'exit_date_missing');
      if (exitIssue) exitIssue.fixed = true;
    }

    // Recalculate score
    const unResolved = (persona.mandatoryChecks || []).filter((c) => c.status !== 'passed');
    if (unResolved.length === 0) {
      persona.claimReadiness = 100;
      persona.label = 'Clean record';
    } else {
      persona.claimReadiness = Math.max(30, 100 - unResolved.length * 18);
    }

    saveStoredPersonas(personas);
    logActivity('Manual KYC Update', persona.claimReadiness, 'Manual correction applied and verified.');

    return {
      success: true,
      persona: JSON.parse(JSON.stringify(persona)),
      newReadiness: persona.claimReadiness,
    };
  },

  // 7. Submit claim
  async submitClaim(personaId: string, claimType = 'Final PF Settlement'): Promise<{ success: boolean; claim: ActiveClaim; trackingId: string }> {
    await delay(300);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) throw new Error('Persona not found');

    const trackingId = `CLM-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const newClaim: ActiveClaim = {
      claimId: trackingId,
      formType: claimType,
      submittedAt: today,
      currentStep: 2,
      estimatedSettlement: '7 to 10 days',
      steps: [
        {
          title: 'Claim Submitted',
          description: 'Your claim has been received.',
          completed: true,
          date: today,
        },
        {
          title: 'KYC Verified',
          description: 'Your KYC details were checked.',
          completed: true,
          date: today,
        },
        {
          title: 'Employer Confirmation Received',
          description:
            personaId === 'ravi-issues'
              ? 'Your previous employer needs to confirm exit date.'
              : 'Employer digital confirmation and service record attested.',
          completed: personaId !== 'ravi-issues',
          date: personaId !== 'ravi-issues' ? today : undefined,
        },
        {
          title: 'Claim Approved',
          description: 'EPFO approves the claim.',
          completed: false,
        },
        {
          title: 'Payment Sent to Bank',
          description: `Money is sent to your bank account (${persona.profile.bankName} ending with **${persona.profile.accountLast4}).`,
          completed: false,
        },
      ],
    };

    persona.activeClaim = newClaim;
    saveStoredPersonas(personas);
    logActivity('Claim Submitted', persona.claimReadiness, `Submitted claim ${trackingId} for ${claimType}`);

    return {
      success: true,
      claim: newClaim,
      trackingId,
    };
  },

  // 8. Get claim timeline
  async getClaimTimeline(personaId: string): Promise<{
    activeClaim?: ActiveClaim;
    previousClaim?: any;
    timeline: { title: string; description: string; status: 'completed' | 'pending' | 'not_started' }[];
  }> {
    await delay(120);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) {
      return {
        timeline: [],
      };
    }

    const defaultTimeline = [
      {
        title: 'Claim Submitted',
        description: 'Your claim has been received.',
        status: persona.activeClaim ? ('completed' as const) : ('not_started' as const),
      },
      {
        title: 'KYC Verified',
        description: 'Your KYC details were checked.',
        status: persona.activeClaim ? ('completed' as const) : ('not_started' as const),
      },
      {
        title: 'Employer Confirmation Received',
        description: 'Your previous employer needs to confirm exit date.',
        status:
          persona.activeClaim && personaId === 'ravi-issues'
            ? ('pending' as const)
            : persona.activeClaim
            ? ('completed' as const)
            : ('not_started' as const),
      },
      {
        title: 'Claim Approved',
        description: 'EPFO approves the claim.',
        status: 'not_started' as const,
      },
      {
        title: 'Payment Sent to Bank',
        description: 'Money is sent to your bank account.',
        status: 'not_started' as const,
      },
    ];

    return {
      activeClaim: persona.activeClaim,
      previousClaim: persona.previousClaim,
      timeline: defaultTimeline,
    };
  },

  // 9. Get grievance draft
  async getGrievanceDraft(personaId: string): Promise<{ subject: string; body: string; category: string; recommendedOffice: string }> {
    await delay(100);
    const personas = getStoredPersonas();
    const persona = personas[personaId];

    if (personaId === 'ravi-issues') {
      return {
        subject: `Grievance regarding KYC Verification & Missing Date of Exit - UAN: ${persona?.uan || '100000000002'}`,
        category: 'KYC & Member Profile Service',
        recommendedOffice: 'Regional Office Delhi South (Bhikaji Cama Place)',
        body: `To,
The Regional P.F. Commissioner,
EPFO Regional Office Delhi South.

Subject: Request for expedited KYC approval and updating Date of Exit (UAN: 100000000002)

Respected Sir/Madam,

I am writing to bring to your kind attention that my bank KYC verification (${persona?.profile?.bankName || 'Bank Account'} ending in ${persona?.profile?.accountLast4 || '7788'}) has been pending verification, and my previous employer (Apex Infotech Services) has failed to record my Date of Exit (last working date: April 2024).

Details for reference:
- Member Name: Ravi Kumar Verma
- UAN: 100000000002
- Establishment: ABC Solutions (DL/CPM/0029410)
- Aadhaar & PAN: Linked and verified

Kindly direct the employer / concerned section to update the exit date on the ECR portal so that I may submit my PF settlement claim without rejection.

Thanking you,
Yours sincerely,
Ravi Kumar Verma`,
      };
    }

    if (personaId === 'meena-rejected') {
      return {
        subject: `Grievance regarding Rejection of Claim CLM-2024-0981924 under vague reason 'Insufficient Service' - UAN: ${persona?.uan || '100000000003'}`,
        category: 'Claim Settlement & EPS Pension Scheme',
        recommendedOffice: 'Regional Office Chennai South (Royapettah)',
        body: `To,
The Regional P.F. Commissioner,
EPFO Regional Office Chennai.

Subject: Appeal against rejection of Claim CLM-2024-0981924 and clarification on EPS service duration

Respected Sir/Madam,

My online claim for PF and EPS withdrawal (Form 19 & 10C, Reference: CLM-2024-0981924) submitted on 14 May 2024 was rejected with a generic and unclear remark stating "Insufficient service".

I served at Sunrise Services from February 2014 to August 2021 (over 7 years of continuous non-contributory & contributory service). All monthly contributions were duly remitted by the employer.

Kindly review my Form 3A/6A ledger, reconcile the EPS service period, and re-process the claim settlement or provide specific itemized instructions on any missing documentation.

Thanking you,
Yours faithfully,
Meena Iyer`,
      };
    }

    // Default for clean record or others
    return {
      subject: `Inquiry regarding EPF Account status - UAN: ${persona?.uan || '100000000001'}`,
      category: 'General Information',
      recommendedOffice: 'Regional Office Bandra (Mumbai)',
      body: `To,
The Regional P.F. Commissioner,
EPFO.

Subject: General Inquiry / Profile Verification

Respected Sir/Madam,

All records, Aadhaar linking, and bank credentials for UAN ${persona?.uan || '100000000001'} (Asha Kumar) are fully up to date and verified. No formal grievance is currently pending or required.

Thanking you,
Yours sincerely,
Asha Kumar`,
    };
  },

  // 10. Get profile
  async getProfile(personaId: string): Promise<UserProfile> {
    await delay(100);
    const personas = getStoredPersonas();
    const persona = personas[personaId];
    if (!persona) throw new Error('Persona not found');
    return persona.profile;
  },

  // 11. Calculate PF
  calculatePF(input: {
    age: number;
    yearsOfService: number;
    reason: string;
    totalBalance?: number;
    basicPay?: number;
  }): CalculationResult {
    const { age, yearsOfService, reason, totalBalance = 186400 } = input;

    let eligibilityStatus: 'Eligible' | 'Partially eligible' | 'May not be eligible' | 'Please check details' = 'Eligible';
    let eligible = true;
    let maxAmount = 0;
    let category = 'Advance / Partial Withdrawal';
    let explanation = '';
    let tdsApplicable = false;
    let tdsPercent = 0;
    let taxNote = '';

    const normalizedReason = reason.toLowerCase().replace(/[\s_-]+/g, '_');

    // Basic Age & Service checks
    if (age < 18 || age > 60) {
      eligibilityStatus = 'Please check details';
      eligible = false;
      explanation = 'Age is outside the standard active EPF contributory employment bracket (18-60 years).';
    } else if (yearsOfService < 2 && !normalizedReason.includes('medical')) {
      eligibilityStatus = 'May not be eligible';
      eligible = false;
      explanation = 'Minimum 2 years of contributory service is recommended for non-medical EPF withdrawals.';
      maxAmount = Math.round(totalBalance * 0.3);
    }

    // Reason specific checks
    if (normalizedReason.includes('leaving') || normalizedReason.includes('unemployed') || normalizedReason.includes('job')) {
      category = 'Final PF Settlement (Form 19)';
      if (yearsOfService >= 5) {
        eligibilityStatus = 'Eligible';
        eligible = true;
        maxAmount = totalBalance;
        explanation = 'Eligible for 100% full final EPF settlement after 2 months of leaving employment (5+ years service exempt from TDS).';
        taxNote = 'Tax-Free: 5+ years continuous service is 100% exempt from TDS.';
      } else {
        eligibilityStatus = 'Eligible';
        eligible = true;
        maxAmount = totalBalance;
        tdsApplicable = true;
        tdsPercent = 10;
        explanation = 'Eligible for full settlement after leaving job. TDS applies since continuous service is under 5 years.';
        taxNote = 'Note: 10% TDS is deducted for service under 5 years unless Form 15G/15H is submitted with PAN.';
      }
    } else if (normalizedReason.includes('medical') || normalizedReason.includes('illness')) {
      category = 'Para 68J - Medical Treatment / Illness';
      eligibilityStatus = 'Eligible';
      eligible = true;
      maxAmount = Math.round(totalBalance * 0.8);
      explanation = 'Eligible: No minimum service required. Up to 80% of EPF balance (or 6 months basic wages) can be withdrawn for emergency treatment.';
      taxNote = 'Tax-Free: Medical emergency withdrawals are exempt from TDS.';
    } else if (normalizedReason.includes('marriage')) {
      category = 'Para 68K - Marriage Advance';
      if (yearsOfService >= 7) {
        eligibilityStatus = 'Partially eligible';
        eligible = true;
        maxAmount = Math.round(totalBalance * 0.5);
        explanation = 'Partially eligible: 7+ years service completed. You can withdraw up to 50% of employee contribution for marriage.';
        taxNote = 'Tax-Free: Non-refundable advances are exempt from tax.';
      } else {
        eligibilityStatus = 'May not be eligible';
        eligible = false;
        maxAmount = 0;
        explanation = 'May not be eligible: Mandatory minimum 7 years continuous service required for marriage advance.';
        taxNote = 'N/A';
      }
    } else if (normalizedReason.includes('education')) {
      category = 'Para 68K - Higher Education Advance';
      if (yearsOfService >= 7) {
        eligibilityStatus = 'Partially eligible';
        eligible = true;
        maxAmount = Math.round(totalBalance * 0.5);
        explanation = 'Partially eligible: 7+ years service completed. Up to 50% of employee share can be withdrawn for post-matriculation studies.';
        taxNote = 'Tax-Free: Advance for education is exempt from tax.';
      } else {
        eligibilityStatus = 'May not be eligible';
        eligible = false;
        maxAmount = 0;
        explanation = 'May not be eligible: Mandatory minimum 7 years continuous service required for education advance.';
        taxNote = 'N/A';
      }
    } else if (normalizedReason.includes('house') || normalizedReason.includes('home')) {
      category = 'Para 68B - Housing Purchase / Construction';
      if (yearsOfService >= 5) {
        eligibilityStatus = 'Eligible';
        eligible = true;
        maxAmount = Math.round(totalBalance * 0.9);
        explanation = 'Eligible: 5+ years service completed. Up to 90% of accumulated balance can be withdrawn for house purchase or construction.';
        taxNote = 'Tax-Free: Housing advances are exempt from TDS.';
      } else {
        eligibilityStatus = 'May not be eligible';
        eligible = false;
        maxAmount = 0;
        explanation = 'May not be eligible: Minimum 5 years of service is required for housing withdrawal.';
        taxNote = 'N/A';
      }
    } else if (normalizedReason.includes('retirement')) {
      category = 'Superannuation / Retirement Settlement';
      eligibilityStatus = 'Eligible';
      eligible = true;
      maxAmount = totalBalance;
      explanation = 'Eligible for 100% EPF balance settlement + Monthly EPS pension if eligible.';
      taxNote = 'Tax-Free: Superannuation settlements are 100% tax-free.';
    } else {
      maxAmount = Math.round(totalBalance * 0.3);
      explanation = 'Based on synthetic demo data and simplified rules.';
      taxNote = 'Standard EPFO taxation norms apply.';
    }

    return {
      eligible,
      eligibilityStatus,
      maxAmount,
      category,
      explanation,
      tdsApplicable,
      tdsPercent,
      taxNote,
      disclaimer: 'This calculator is for demonstration only. Actual EPFO rules may differ.',
    };
  },

  // Reset demo personas to pristine state
  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.PERSONAS_STATE);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_PERSONA_ID);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOG);
    localStorage.removeItem(STORAGE_KEYS.CLAIM);
    localStorage.removeItem(STORAGE_KEYS.ISSUES);
    localStorage.setItem(STORAGE_KEYS.PERSONAS_STATE, JSON.stringify(INITIAL_PERSONAS));
    logActivity('Reset Demo Data', 98, 'Reset all persona records to initial factory state.');
  },
};
