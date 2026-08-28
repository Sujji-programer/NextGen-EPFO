import { ViewName, GPTSettings } from '../types';

export interface PredefinedIntent {
  id: string;
  keywords: string[];
  answer: string;
  actionView?: ViewName;
  actionLabel?: string;
}

export const PREDEFINED_ANSWERS: Record<string, PredefinedIntent> = {
  rejection_reason: {
    id: 'rejection_reason',
    keywords: ['rejected', 'rejection', 'why', 'reason', 'claim rejected', 'refus', 'rejected claim'],
    answer:
      'Common PF claim rejection reasons include name mismatch, date of birth mismatch, bank account issues, missing employer exit date, incomplete KYC, and EPS service gaps. Use EPFO Claim to check your specific issue before submitting.',
    actionView: 'claimDoctorView',
    actionLabel: 'Open EPFO Claim',
  },
  kyc_mismatch: {
    id: 'kyc_mismatch',
    keywords: ['kyc', 'mismatch', 'name', 'aadhaar', 'pan', 'bank', 'dob', 'father', 'spelling'],
    answer:
      'KYC mismatch happens when your name, date of birth, father’s name, PAN, Aadhaar, or bank details do not match exactly across EPFO records. Small spelling differences can also cause rejection. EPFO Claim can detect these issues before submission.',
    actionView: 'claimDoctorView',
    actionLabel: 'Check KYC in EPFO Claim',
  },
  eps_service: {
    id: 'eps_service',
    keywords: ['eps', 'pension', 'service', 'insufficient service', 'pensionable', 'scheme certificate'],
    answer:
      'EPS service is your pensionable service period under the Employees’ Pension Scheme. If your previous employer did not update your exit date, EPS service may appear incomplete. This can cause rejection or pension calculation issues.',
    actionView: 'claimDoctorView',
    actionLabel: 'Check Service in EPFO Claim',
  },
  transfer_pf: {
    id: 'transfer_pf',
    keywords: ['transfer', 'old pf', 'previous job', 'form 13', 'old account', 'merge', 'consolidate'],
    answer:
      'To transfer old PF, use the Transfer Old PF option. The system can detect old accounts and prepare a transfer request. In real EPFO, this is similar to a Form 13 transfer request.',
    actionView: 'transferView',
    actionLabel: 'Transfer Old PF',
  },
  withdrawal_time: {
    id: 'withdrawal_time',
    keywords: ['how long', 'time', 'days', 'withdrawal', 'settlement', 'processing', 'turnaround', 'duration'],
    answer:
      'EPFO’s Citizen Charter mentions around 20 days for settlement, but actual time may vary. This prototype shows a simple estimated timeline of 7 to 10 days for demo purposes.',
    actionView: 'trackingView',
    actionLabel: 'Track Existing Claim',
  },
  claim_readiness: {
    id: 'claim_readiness',
    keywords: ['readiness', 'check', 'score', 'ready', 'risk', 'diagnostic'],
    answer:
      'Claim Readiness Score checks common rejection risks before submission, such as KYC mismatch, bank verification, and missing exit date. Open EPFO Claim to check your score.',
    actionView: 'claimDoctorView',
    actionLabel: 'Check Readiness Score',
  },
  open_claim_doctor: {
    id: 'open_claim_doctor',
    keywords: ['open epfo claim', 'open claim doctor', 'start claim', 'file claim', 'withdraw pf', 'doctor', 'claim doctor', 'epfo claim'],
    answer: 'Opening EPFO Claim.',
    actionView: 'claimDoctorView',
    actionLabel: 'Open EPFO Claim',
  },
  check_balance: {
    id: 'check_balance',
    keywords: ['balance', 'pf balance', 'passbook', 'money', 'contribution', 'fund'],
    answer: 'Opening PF balance view.',
    actionView: 'balanceView',
    actionLabel: 'View PF Balance',
  },
  calculator: {
    id: 'calculator',
    keywords: ['calculate', 'calculator', 'amount', 'estimate', 'eligibility', 'how much'],
    answer: 'Opening PF calculator.',
    actionView: 'calculatorView',
    actionLabel: 'Open PF Calculator',
  },
  grievance: {
    id: 'grievance',
    keywords: ['grievance', 'complaint', 'cpgrams', 'help', 'escalate', 'epfigms', 'dispute'],
    answer:
      'You can use the grievance helper to create a simple draft. In real life, EPFO grievances may be raised through official channels. This prototype generates a sample draft only.',
    actionView: 'grievanceView',
    actionLabel: 'Open Grievance Helper',
  },
  forms: {
    id: 'forms',
    keywords: ['form 19', 'form 10c', 'form 13', 'form 31', 'forms', 'which form'],
    answer:
      'Form 19 and Form 10C are commonly used for final PF and pension withdrawal. Form 13 is used for PF transfer. Form 31 is used for corrections or partial withdrawal depending on context. In this system, EPFO Claim automatically chooses the correct option for you.',
    actionView: 'claimDoctorView',
    actionLabel: 'Select Form in EPFO Claim',
  },
  uan: {
    id: 'uan',
    keywords: ['uan', 'activation', 'umang', 'login', 'universal account number'],
    answer:
      'UAN is your Universal Account Number. In real EPFO, UAN activation may be required before filing claims. This prototype uses a mock login for demonstration.',
    actionView: 'profileView',
    actionLabel: 'View UAN Profile',
  },
  employer_exit: {
    id: 'employer_exit',
    keywords: ['employer', 'exit date', 'hr', 'company', 'leaving date', 'date of exit', 'doe'],
    answer:
      'If your employer has not updated your exit date, your claim can get stuck or rejected. EPFO Claim can generate a sample employer reminder or grievance draft.',
    actionView: 'claimDoctorView',
    actionLabel: 'Fix Exit Date in EPFO Claim',
  },
  accessibility: {
    id: 'accessibility',
    keywords: ['accessibility', 'disability', 'font', 'contrast', 'voice', 'screen reader'],
    answer:
      'This prototype supports simple accessibility features such as larger text, high contrast, voice input where available, and plain-language guidance.',
    actionView: 'settingsView',
    actionLabel: 'Open Accessibility Settings',
  },
  synthetic_data: {
    id: 'synthetic_data',
    keywords: ['real', 'fake', 'synthetic', 'demo', 'official', 'data', 'is this real'],
    answer:
      'This is an EPFO citizen application prototype. It is designed to assist members in verifying their claims and diagnosing KYC discrepancies.',
  },
  default: {
    id: 'default',
    keywords: [],
    answer:
      'I can help with claim rejection, KYC mismatch, PF balance, transfer, calculator, grievance, and claim readiness. Try asking: “Why was my claim rejected?”',
    actionView: 'claimDoctorView',
    actionLabel: 'Open EPFO Claim',
  },
};

export interface AssistantResponse {
  answer: string;
  source: 'demo' | 'ai' | 'fallback';
  actionView?: ViewName;
  actionLabel?: string;
  fallbackNotice?: string;
  autoNavigate?: boolean;
}

export interface AssistantContext {
  personaName?: string;
  uan?: string;
  totalBalance?: number;
  serviceYears?: number;
  serviceMonths?: number;
  failedKycChecks?: string[];
  activeView?: string;
  isBankMismatch?: boolean;
  isDoeMissing?: boolean;
}

const BASE_EPFO_SYSTEM_PROMPT = `You are PF Sahayak, the intelligent AI advisor built into the NextGen EPFO Citizen Portal.
Your purpose is to answer member questions accurately, clearly, and authoritatively according to statutory Indian Provident Fund regulations (EPF Scheme 1952, EPS 1995, EDLI 1976).

KEY KNOWLEDGE OF THIS PORTAL'S FEATURES & NAVIGATION:
1. "Claim Doctor" (claimDoctorView): 10-point pre-submission verification that diagnoses rejection risks, bank IFSC errors, missing employer exit dates (DOE), and service overlaps.
2. "Auto-Fix Issues": 1-Click autonomous reconciliation that syncs DigiLocker Aadhaar/PAN, fixes merged bank IFSCs, and normalizes name discrepancies.
3. "Auto-fill with DigiLocker": Authenticates official government identity credentials and populates member profile cards.
4. "PF Eligibility & Limit Calculator" (calculatorView): Computes statutory advance/withdrawal entitlements for Form 31 (Housing Para 68B, Marriage/Edu Para 68K, Illness Para 68J, Pandemic Para 68L), Form 19 (Final Settlement), and Form 10C (EPS Table D Pension Withdrawal). Lets members view and download calculation receipts.
5. "Transfer Old PF" (transferView): Automated Form 13 transfer for previous employment accounts.
6. "Passbook & Contributions" (balanceView): Visual breakdown of Employee Share (EE), Employer Share (ER), and Pension Fund (EPS 8.33%).
7. "Grievance Assistant" (grievanceView): Generates EPFiGMS and CPGRAMS draft petitions.

STATUTORY EPF / EPS / TDS RULES:
- Form 31 Advances: Non-refundable. Housing requires 5 yrs service (up to 36x wage / EE+ER); Marriage requires 7 yrs (up to 50% EE); Illness (no min service, up to 6x wage or EE share).
- Form 19 (PF Final Settlement): 2 months of unemployment after exit date; 100% of EE + ER shares paid.
- Form 10C (EPS Pension): Available if total service is < 10 years (computed via Table D factor * Average Wage). If >= 10 years, Scheme Certificate is issued for monthly pension starting at age 58.
- TDS Rules (Section 192A): 0% TDS if service >= 5 years, OR if amount < ₹50,000, OR if Form 15G/15H is submitted. If service < 5 years and amount >= ₹50,000: 10% TDS with valid PAN, 20% TDS without PAN.

GUIDELINES FOR YOUR RESPONSES:
- Provide clear, direct, and actionable advice.
- When relevant, direct the user to the exact portal screen or feature.
- Highlight statutory references (e.g. Form 31 Para 68B, Table D factor, Section 192A).
- Maintain a polite, professional, and reassuring tone.`;

export class AssistantBrain {
  private static STORAGE_KEY_TOKENS = 'nextgen_epfo_tokens_used';

  public static getTokensUsed(): number {
    try {
      const val = localStorage.getItem(this.STORAGE_KEY_TOKENS);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  public static setTokensUsed(tokens: number): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_TOKENS, tokens.toString());
    } catch {
      // ignore
    }
  }

  public static resetTokensUsed(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY_TOKENS);
    } catch {
      // ignore
    }
  }

  /**
   * Find local predefined match by searching keywords
   */
  public static matchPredefinedIntent(query: string): PredefinedIntent {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return PREDEFINED_ANSWERS.default;

    // Direct check for high-priority navigation commands
    if (
      cleanQuery.includes('open epfo claim') ||
      cleanQuery.includes('open claim doctor') ||
      cleanQuery.includes('start claim') ||
      cleanQuery.includes('file claim') ||
      cleanQuery.includes('epfo claim') ||
      cleanQuery === 'claim doctor'
    ) {
      return PREDEFINED_ANSWERS.open_claim_doctor;
    }

    if (
      cleanQuery.includes('check balance') ||
      cleanQuery.includes('show balance') ||
      cleanQuery.includes('my balance') ||
      cleanQuery === 'balance' ||
      cleanQuery.includes('passbook')
    ) {
      return PREDEFINED_ANSWERS.check_balance;
    }

    if (
      cleanQuery.includes('open calculator') ||
      cleanQuery.includes('calculate pf') ||
      cleanQuery.includes('calculate amount') ||
      cleanQuery === 'calculator'
    ) {
      return PREDEFINED_ANSWERS.calculator;
    }

    if (
      cleanQuery.includes('track claim') ||
      cleanQuery.includes('claim status') ||
      cleanQuery.includes('tracking')
    ) {
      return PREDEFINED_ANSWERS.withdrawal_time;
    }

    if (cleanQuery.includes('raise grievance') || cleanQuery.includes('file complaint')) {
      return PREDEFINED_ANSWERS.grievance;
    }

    // Score based matching for other intents
    let bestMatch: PredefinedIntent | null = null;
    let highestScore = 0;

    for (const [key, intent] of Object.entries(PREDEFINED_ANSWERS)) {
      if (key === 'default') continue;
      let score = 0;
      for (const kw of intent.keywords) {
        if (cleanQuery.includes(kw)) {
          score += kw.length; // weight longer keyword matches higher
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = intent;
      }
    }

    return highestScore >= 3 && bestMatch ? bestMatch : PREDEFINED_ANSWERS.default;
  }

  /**
   * Process a user query through the 3-mode engine
   */
  public static async processQuery(
    userQuestion: string,
    gptSettings?: GPTSettings,
    context?: AssistantContext
  ): Promise<AssistantResponse> {
    const trimmed = userQuestion.trim();
    if (!trimmed) {
      return {
        answer: PREDEFINED_ANSWERS.default.answer,
        source: 'demo',
        actionView: PREDEFINED_ANSWERS.default.actionView,
        actionLabel: PREDEFINED_ANSWERS.default.actionLabel,
      };
    }

    // Quick voice command check
    const localMatch = this.matchPredefinedIntent(trimmed);

    // If local match is an explicit navigation intent or user is in Local Demo Mode
    const isGptEnabled = gptSettings?.enabled && !!gptSettings?.apiKey?.trim();

    if (!isGptEnabled) {
      return {
        answer: localMatch.answer,
        source: 'demo',
        actionView: localMatch.actionView,
        actionLabel: localMatch.actionLabel,
        autoNavigate:
          localMatch.id === 'open_claim_doctor' ||
          localMatch.id === 'check_balance' ||
          localMatch.id === 'calculator',
      };
    }

    // Build context-enriched system prompt
    let dynamicSystemPrompt = BASE_EPFO_SYSTEM_PROMPT;
    if (context) {
      dynamicSystemPrompt += `\n\nCURRENT LOGGED-IN CITIZEN CONTEXT:
- Name: ${context.personaName || 'Unknown'}
- UAN: ${context.uan || 'N/A'}
- Total PF Balance: ₹${context.totalBalance ? context.totalBalance.toLocaleString('en-IN') : '0'}
- Continuous Service: ${context.serviceYears || 0} years ${context.serviceMonths || 0} months
- Failed KYC Checks: ${context.failedKycChecks && context.failedKycChecks.length > 0 ? context.failedKycChecks.join(', ') : 'None (100% Compliant)'}
- Bank IFSC Mismatch: ${context.isBankMismatch ? 'YES (e.g. Horizon National Bank merged into Zenith United Bank)' : 'NO'}
- Date of Exit Missing: ${context.isDoeMissing ? 'YES (Employer has not updated exit date)' : 'NO'}`;
    }

    // Check token budget
    const tokenBudget = gptSettings.tokenBudget || 10000;
    const currentTokens = this.getTokensUsed();
    const maxTokens = gptSettings.maxTokens || 350;
    const estimatedRequestTokens =
      Math.ceil(dynamicSystemPrompt.length / 4) +
      Math.ceil(trimmed.length / 4) +
      maxTokens;

    if (currentTokens + estimatedRequestTokens > tokenBudget) {
      return {
        answer: localMatch.answer,
        source: 'fallback',
        actionView: localMatch.actionView,
        actionLabel: localMatch.actionLabel,
        fallbackNotice: 'Token budget reached. Using demo answers.',
      };
    }

    // Attempt GPT Assist Mode
    try {
      const apiKey = gptSettings.apiKey.trim();
      const model = gptSettings.model || 'gpt-4o-mini';
      const apiEndpoint = gptSettings.apiEndpoint || 'https://api.openai.com/v1/chat/completions';

      // 10-second timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: dynamicSystemPrompt,
            },
            {
              role: 'user',
              content: trimmed,
            },
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('OpenAI API Error:', response.status, errorText);
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const gptReply = data?.choices?.[0]?.message?.content?.trim();

      if (!gptReply) {
        throw new Error('Empty response from API');
      }

      // Update tokens consumed
      const promptTokens = data?.usage?.prompt_tokens || Math.ceil(trimmed.length / 4) + 40;
      const completionTokens = data?.usage?.completion_tokens || Math.ceil(gptReply.length / 4);
      const totalTokens = promptTokens + completionTokens;
      this.setTokensUsed(currentTokens + totalTokens);

      return {
        answer: gptReply,
        source: 'ai',
        actionView: localMatch.actionView,
        actionLabel: localMatch.actionLabel,
      };
    } catch (err: any) {
      console.warn('GPT Assistant Fallback triggered:', err?.message || err);
      return {
        answer: localMatch.answer,
        source: 'fallback',
        actionView: localMatch.actionView,
        actionLabel: localMatch.actionLabel,
        fallbackNotice: 'Switched to demo answers to save API usage.',
      };
    }
  }

  /**
   * Test connection helper for Settings panel
   */
  public static async testGptConnection(
    apiKey: string,
    model: string = 'gpt-4o-mini',
    apiEndpoint: string = 'https://api.openai.com/v1/chat/completions'
  ): Promise<{ success: boolean; message: string }> {
    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: 'Please enter an API key first.' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Ping test.',
            },
            {
              role: 'user',
              content: 'Hi',
            },
          ],
          max_tokens: 5,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { success: true, message: 'Connection successful! GPT model responded.' };
      } else {
        const errData = await response.json().catch(() => ({}));
        const msg = errData?.error?.message || `HTTP ${response.status}`;
        return { success: false, message: `Connection failed: ${msg}` };
      }
    } catch (e: any) {
      return { success: false, message: e.name === 'AbortError' ? 'Connection timed out.' : 'Network connection failed.' };
    }
  }
}
