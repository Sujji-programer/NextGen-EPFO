import { Persona, ActiveClaim } from '../types';

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * 1. Generates & Downloads Tabular Passbook (HTML)
 */
export function downloadPassbookFile(persona: Persona, format: 'html' | 'csv' = 'html'): void {
  if (format === 'csv') {
    const csvContent = [
      'Wage Month,Credit Date,EPF Wage (INR),EPS Wage (INR),EE Share (12%),ER Share (3.67%),Pension Fund (8.33%)',
      'Jul 2026,15 Aug 2026,72000,15000,8640,7390,1250',
      'Jun 2026,15 Jul 2026,72000,15000,8640,7390,1250',
      'May 2026,15 Jun 2026,72000,15000,8640,7390,1250',
      'Apr 2026,15 May 2026,72000,15000,8640,7390,1250',
      'Mar 2026,15 Apr 2026,70000,15000,8400,7150,1250',
      'Feb 2026,15 Mar 2026,70000,15000,8400,7150,1250',
      'Jan 2026,15 Feb 2026,70000,15000,8400,7150,1250',
      `Cumulative Employee Share,,,,"${persona.balance.employeeContribution}",,`,
      `Cumulative Employer Share,,,,,"${persona.balance.employerContribution}",`,
      `Pension Fund Corpus,,,,,,,"${persona.balance.pensionFund || 42000}"`,
      `Total Net Closing Balance,,,,"${persona.balance.total}",,`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EPFO_Passbook_${persona.uan}_${persona.name.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const employeeContrib = persona.balance.employeeContribution;
  const employerContrib = persona.balance.employerContribution;
  const interestEarned = persona.balance.interest;
  const totalBalance = persona.balance.total;
  const pensionFund = persona.balance.pensionFund || 42000;
  const employerName = persona.profile.employment.employer || 'Cloudnine Systems India Ltd';
  const memberId = persona.profile.employment.memberId || 'MH/BAN/0048291/000/0192834';
  const uan = persona.uan;
  const name = persona.name;
  const dob = persona.profile.dob;
  const doj = persona.profile.employment.from || '2018-07';
  const doe = persona.profile.employment.exitDateUpdated ? persona.profile.employment.to || '2024-04' : 'Active / In-Service';

  const months = [
    { month: 'Jul 2026', epfWage: 72000, epsWage: 15000, eeShare: 8640, erShare: 7390, epsShare: 1250, date: '15 Aug 2026' },
    { month: 'Jun 2026', epfWage: 72000, epsWage: 15000, eeShare: 8640, erShare: 7390, epsShare: 1250, date: '15 Jul 2026' },
    { month: 'May 2026', epfWage: 72000, epsWage: 15000, eeShare: 8640, erShare: 7390, epsShare: 1250, date: '15 Jun 2026' },
    { month: 'Apr 2026', epfWage: 72000, epsWage: 15000, eeShare: 8640, erShare: 7390, epsShare: 1250, date: '15 May 2026' },
    { month: 'Mar 2026', epfWage: 70000, epsWage: 15000, eeShare: 8400, erShare: 7150, epsShare: 1250, date: '15 Apr 2026' },
    { month: 'Feb 2026', epfWage: 70000, epsWage: 15000, eeShare: 8400, erShare: 7150, epsShare: 1250, date: '15 Mar 2026' },
    { month: 'Jan 2026', epfWage: 70000, epsWage: 15000, eeShare: 8400, erShare: 7150, epsShare: 1250, date: '15 Feb 2026' },
  ];

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EPFO Member Passbook - ${uan}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 24px; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
    .header-logo { font-size: 19px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; }
    .header-sub { font-size: 11px; color: #475569; margin-top: 3px; font-weight: 600; text-transform: uppercase; }
    .doc-title { font-size: 14px; font-weight: 700; color: #1e40af; margin-top: 6px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; }
    .meta-item { display: flex; justify-content: space-between; padding: 2px 0; }
    .meta-label { font-weight: 600; color: #475569; }
    .meta-val { font-weight: 700; color: #0f172a; }
    .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .summary-card { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; text-align: center; }
    .summary-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px; }
    .summary-amount { font-size: 15px; font-weight: 800; color: #0f172a; }
    .highlight-card { background: #eff6ff; border-color: #93c5fd; }
    .highlight-card .summary-amount { color: #1d4ed8; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
    th { background: #0f172a; color: #fff; font-weight: 600; text-align: right; padding: 7px 8px; font-size: 10px; text-transform: uppercase; }
    th:first-child, th:nth-child(2) { text-align: left; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; }
    td:first-child, td:nth-child(2) { text-align: left; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .totals-row { background: #f1f5f9 !important; font-weight: 700; border-top: 2px solid #0f172a; }
    .footer { margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; align-items: center; }
    .qr-stamp { display: inline-block; border: 1px dashed #64748b; padding: 6px 12px; border-radius: 4px; font-size: 9px; font-weight: 600; background: #fafafa; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-logo">EMPLOYEES' PROVIDENT FUND ORGANISATION, INDIA</div>
    <div class="header-sub">Ministry of Labour & Employment, Government of India</div>
    <div class="doc-title">MEMBER PASSBOOK & ACCUMULATION STATEMENT (FY 2025-2026)</div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="meta-item"><span class="meta-label">Member Name:</span> <span class="meta-val">${name}</span></div>
      <div class="meta-item"><span class="meta-label">Universal Account Number (UAN):</span> <span class="meta-val">${uan}</span></div>
      <div class="meta-item"><span class="meta-label">Member ID:</span> <span class="meta-val">${memberId}</span></div>
      <div class="meta-item"><span class="meta-label">Date of Birth:</span> <span class="meta-val">${dob}</span></div>
    </div>
    <div>
      <div class="meta-item"><span class="meta-label">Establishment Name:</span> <span class="meta-val">${employerName}</span></div>
      <div class="meta-item"><span class="meta-label">Date of Joining EPF/EPS:</span> <span class="meta-val">${doj}</span></div>
      <div class="meta-item"><span class="meta-label">Date of Exit:</span> <span class="meta-val">${doe}</span></div>
      <div class="meta-item"><span class="meta-label">Bank Status:</span> <span class="meta-val">${persona.profile.bankVerified ? 'Verified (NPCI Live)' : 'Pending'}</span></div>
    </div>
  </div>

  <div class="summary-cards">
    <div class="summary-card">
      <div class="summary-label">Employee Share (EE)</div>
      <div class="summary-amount">${formatINR(employeeContrib)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Employer Share (ER)</div>
      <div class="summary-amount">${formatINR(employerContrib)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Interest Accrued</div>
      <div class="summary-amount">${formatINR(interestEarned)}</div>
    </div>
    <div class="summary-card highlight-card">
      <div class="summary-label">Total Accumulation</div>
      <div class="summary-amount">${formatINR(totalBalance)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Wage Month</th>
        <th>Credit Date</th>
        <th>EPF Wage</th>
        <th>EPS Wage</th>
        <th>EE Share (12%)</th>
        <th>ER Share (3.67%)</th>
        <th>Pension Fund (8.33%)</th>
      </tr>
    </thead>
    <tbody>
      ${months
        .map(
          (m) => `<tr>
        <td>${m.month}</td>
        <td>${m.date}</td>
        <td>₹${m.epfWage.toLocaleString('en-IN')}</td>
        <td>₹${m.epsWage.toLocaleString('en-IN')}</td>
        <td>₹${m.eeShare.toLocaleString('en-IN')}</td>
        <td>₹${m.erShare.toLocaleString('en-IN')}</td>
        <td>₹${m.epsShare.toLocaleString('en-IN')}</td>
      </tr>`
        )
        .join('')}
      <tr class="totals-row">
        <td colspan="4" style="text-align: left;">CUMULATIVE CONTRIBUTIONS & INTEREST (8.25% P.A.)</td>
        <td>${formatINR(employeeContrib)}</td>
        <td>${formatINR(employerContrib)}</td>
        <td>${formatINR(pensionFund)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <div>
      <div>* Generated from Next-Gen EPFO Member Digital Services on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.</div>
      <div>* Interest calculation as per official Ministry gazette declaration.</div>
    </div>
    <div class="qr-stamp">
      DIGITALLY SIGNED EPF LEDGER<br>
      HASH: ${Math.random().toString(36).substring(2, 10).toUpperCase()}
    </div>
  </div>

  <div class="no-print" style="margin-top: 24px; text-align: center;">
    <button onclick="window.print()" style="background: #0f172a; color: #fff; border: none; padding: 10px 24px; font-size: 13px; font-weight: 700; border-radius: 6px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EPFO_Member_Passbook_${persona.uan}_${persona.name.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 2. Generates & Downloads Pre-filled Physical Joint Declaration Form
 */
export function downloadJointDeclarationFile(persona: Persona): void {
  const memberName = persona.name;
  const fatherName = persona.profile.fatherName || 'Not Specified';
  const uan = persona.uan;
  const memberId = persona.profile.employment.memberId || 'DL/CPM/0088192/000/0049281';
  const employerName = persona.profile.employment.employer || 'Orbitron Global Systems / TechNova';
  const epfoDob = persona.profile.epfoDob || persona.profile.dob || '15/06/1986';
  const correctDob = persona.profile.aadhaarDob || '10/01/1982';
  const correctName = persona.profile.aadhaarName || persona.name;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Joint Declaration Form - ${uan}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Times New Roman', serif; color: #000; background: #fff; line-height: 1.4; padding: 20px; font-size: 12pt; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .title { font-size: 14pt; text-transform: uppercase; margin-bottom: 4px; }
    .subtitle { font-size: 11pt; margin-bottom: 16px; }
    .to-block { margin-bottom: 16px; line-height: 1.3; }
    .body-text { text-align: justify; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11pt; }
    th, td { border: 1px solid #000; padding: 8px 10px; vertical-align: top; }
    th { background: #f2f2f2; text-align: left; }
    .diff-highlight { background-color: #fff3cd; font-weight: bold; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
    .sig-box { border-top: 1px solid #000; padding-top: 6px; text-align: center; }
    .instructions { font-size: 9.5pt; margin-top: 30px; border-top: 1px dashed #666; padding-top: 10px; color: #333; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="center">
    <div class="bold title">JOINT DECLARATION BY THE MEMBER AND THE EMPLOYER</div>
    <div class="subtitle">(Under Revised EPFO Standard Operating Procedure for Profile Modifications)</div>
  </div>

  <div class="to-block">
    To,<br>
    <strong>The Regional P.F. Commissioner</strong><br>
    Employees' Provident Fund Organisation (EPFO)<br>
    Regional Office: Delhi Central / Respective Field Office
  </div>

  <div class="body-text">
    Sir / Madam,<br>
    I, <strong>${memberName}</strong> (UAN: <strong>${uan}</strong>, Member ID: <strong>${memberId}</strong>), was / am an employee of <strong>M/s ${employerName}</strong>. 
    It is submitted that the particulars in EPFO master records contain discrepancies that exceed the automated online modification threshold (e.g. DOB variance &gt; 3 years / overlapping service). 
    I and my employer jointly request that the official records be rectified as per the verified documents enclosed below:
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">Sl.</th>
        <th style="width: 25%;">Particulars</th>
        <th style="width: 35%;">Correct Particulars (As Requested)</th>
        <th style="width: 35%;">Incorrect Particulars (Present in EPFO)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td class="bold">Member Name</td>
        <td>${correctName}</td>
        <td>${memberName}</td>
      </tr>
      <tr>
        <td>2</td>
        <td class="bold">Father's / Husband's Name</td>
        <td>${fatherName}</td>
        <td>${fatherName}</td>
      </tr>
      <tr class="diff-highlight">
        <td>3</td>
        <td class="bold">Date of Birth (DOB)</td>
        <td>${correctDob} (As per 10th Certificate/Passport)</td>
        <td>${epfoDob} (Mismatch &gt; 3 Years)</td>
      </tr>
      <tr>
        <td>4</td>
        <td class="bold">Universal Account No (UAN)</td>
        <td>${uan}</td>
        <td>${uan}</td>
      </tr>
      <tr>
        <td>5</td>
        <td class="bold">Date of Joining (DOJ)</td>
        <td>${persona.profile.employment.doj || '15-Mar-2018'}</td>
        <td>${persona.profile.employment.doj || '15-Mar-2018'}</td>
      </tr>
      <tr>
        <td>6</td>
        <td class="bold">Date of Exit (DOE) / Overlap</td>
        <td>${persona.profile.employment.doe || 'Reconciled Single Service Record'}</td>
        <td>${persona.profile.serviceOverlap ? 'Concurrent Dual Active ECR' : 'Not marked / In-Service'}</td>
      </tr>
    </tbody>
  </table>

  <div class="body-text">
    I am enclosing self-attested copies of the following supporting documents for verification:<br>
    1. Aadhaar Card (UIDAI Verified Copy)<br>
    2. Matriculation (10th Board) Pass Certificate / Valid Passport (Proof of Date of Birth)<br>
    3. Copy of First & Last Pay Slips / Service Relieving Letter
  </div>

  <div class="signatures">
    <div class="sig-box">
      <strong>Signature of Employee (Member)</strong><br>
      Name: ${memberName}<br>
      Mobile: ${persona.profile.mobile}<br>
      Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
    </div>
    <div class="sig-box">
      <strong>Authorized Signatory of Employer</strong><br>
      (With Official Seal & Establishment Stamp)<br>
      M/s ${employerName}
    </div>
  </div>

  <div class="instructions">
    <strong>Instructions for Field Office Submission:</strong><br>
    1. Get this Joint Declaration physically signed and stamped by the authorized signatory of your establishment.<br>
    2. Attach self-attested proof of Date of Birth (10th Marksheet, Passport, or Birth Certificate) and Aadhaar card.<br>
    3. Submit in duplicate to the Regional PF Commissioner's Office. An official inward acknowledgement receipt will be issued within 48 hours.
  </div>

  <div class="no-print" style="margin-top: 24px; text-align: center;">
    <button onclick="window.print()" style="background: #0f172a; color: #fff; border: none; padding: 10px 24px; font-size: 13px; font-weight: 700; border-radius: 6px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EPFO_Joint_Declaration_${uan}_${memberName.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 3. Generates & Downloads Official Claim Acknowledgment Receipt
 */
export function downloadClaimAcknowledgmentFile(
  claimData: {
    claimId: string;
    formType: string;
    amount?: number;
    trackingNumber?: string;
    timestamp?: string;
  },
  persona: Persona
): void {
  const claimId = claimData.claimId || `CLM-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const trackingNumber = claimData.trackingNumber || `EPFO-TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const timestamp = claimData.timestamp || new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const bankAccount = persona.profile.fullAccountNumber || `5010048291${persona.profile.accountLast4}`;
  const ifsc = persona.profile.ifsc;
  const bankName = persona.profile.bankName;
  const employerName = persona.profile.employment.employer;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EPFO Claim Acknowledgment - ${claimId}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 24px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .header-left { text-align: left; }
    .org-title { font-size: 17px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
    .org-sub { font-size: 11px; color: #475569; font-weight: 600; }
    .badge { background: #dcfce7; color: #166534; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 9999px; border: 1px solid #86efac; text-transform: uppercase; }
    .doc-title { font-size: 16px; font-weight: 800; color: #1e3a8a; margin-top: 10px; }
    .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-bottom: 16px; font-size: 12px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #e2e8f0; }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 600; }
    .val { color: #0f172a; font-weight: 700; }
    .highlight-row { background: #eff6ff; padding: 8px 10px; border-radius: 6px; border: 1px solid #bfdbfe; margin-top: 8px; }
    .timeline { margin-top: 20px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; }
    .timeline-title { font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 10px; text-transform: uppercase; }
    .step-item { display: flex; gap: 10px; font-size: 11px; margin-bottom: 8px; }
    .step-dot { width: 18px; height: 18px; border-radius: 50%; background: #10b981; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; }
    .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; align-items: center; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="org-title">Employees' Provident Fund Organisation</div>
      <div class="org-sub">Ministry of Labour & Employment, Government of India</div>
      <div class="doc-title">DIGITAL CLAIM FILING ACKNOWLEDGEMENT SLIP</div>
    </div>
    <div>
      <span class="badge">Aadhaar Authenticated</span>
    </div>
  </div>

  <div class="meta-box">
    <div class="grid-2">
      <div>
        <div class="row"><span class="label">Claim Reference ID:</span> <span class="val">${claimId}</span></div>
        <div class="row"><span class="label">EPFO Central Tracking ID:</span> <span class="val">${trackingNumber}</span></div>
        <div class="row"><span class="label">Submission Timestamp:</span> <span class="val">${timestamp}</span></div>
        <div class="row"><span class="label">Claim Form Type:</span> <span class="val">${claimData.formType}</span></div>
      </div>
      <div>
        <div class="row"><span class="label">Member Name:</span> <span class="val">${persona.name}</span></div>
        <div class="row"><span class="label">Universal Account No (UAN):</span> <span class="val">${persona.uan}</span></div>
        <div class="row"><span class="label">Establishment:</span> <span class="val">${employerName}</span></div>
        <div class="row"><span class="label">e-KYC Status:</span> <span class="val">100% Verified (0% TDS)</span></div>
      </div>
    </div>

    <div class="highlight-row">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 11px; color: #1e40af; font-weight: 700; text-transform: uppercase;">Direct Credit Bank Account (NPCI Live)</span>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">
            ${bankName} • A/C: ${bankAccount} • IFSC: ${ifsc}
          </div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 11px; color: #1e40af; font-weight: 700; text-transform: uppercase;">Estimated Disbursal</span>
          <div style="font-size: 13px; font-weight: 800; color: #166534;">
            ${claimData.amount ? formatINR(claimData.amount) : 'Full Entitlement'} (3–5 Working Days)
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="timeline">
    <div class="timeline-title">Automated Settlement Progression Track</div>
    <div class="step-item">
      <div class="step-dot">✓</div>
      <div><strong>Step 1: Online Form & Aadhaar Digital Signature Authenticated</strong> - Recorded in Unified Portal ledger.</div>
    </div>
    <div class="step-item">
      <div class="step-dot">✓</div>
      <div><strong>Step 2: Field Office Inward Allotment</strong> - Direct gateway assignment to Regional Field Office.</div>
    </div>
    <div class="step-item">
      <div class="step-dot" style="background: #3b82f6;">●</div>
      <div><strong>Step 3: Section 7A & Banking Gateway Clearance</strong> - Automated NPCI NACH clearing underway.</div>
    </div>
  </div>

  <div class="footer">
    <div>
      <div>* You can track real-time status using Tracking ID <strong>${trackingNumber}</strong> at epfindia.gov.in.</div>
      <div>* System-generated statutory receipt. No physical signature required.</div>
    </div>
    <div style="text-align: right; font-family: monospace; font-size: 9px; font-weight: 700;">
      DIGITAL RECEIPT HASH: ${Math.random().toString(36).substring(2, 12).toUpperCase()}
    </div>
  </div>

  <div class="no-print" style="margin-top: 24px; text-align: center;">
    <button onclick="window.print()" style="background: #0f172a; color: #fff; border: none; padding: 10px 24px; font-size: 13px; font-weight: 700; border-radius: 6px; cursor: pointer;">
      Print / Save Slip as PDF
    </button>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EPFO_Claim_Slip_${claimId}_${persona.name.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 4. Generates & Downloads Official Statutory PF Eligibility & Entitlement Calculation Receipt
 */
export interface CalculationReceiptPayload {
  persona: Persona;
  category: string;
  basicSalary: number;
  serviceYears: number;
  serviceMonths: number;
  totalServiceYears: number;
  eeBalance: number;
  erBalance: number;
  pensionBalance: number;
  maxAmount: number;
  requestedAmount: number;
  approvedAmount: number;
  tdsPercent: number;
  tdsAmount: number;
  netPayableAmount: number;
  explanation: string;
  taxNote: string;
  isAutoSettlement: boolean;
}

export function downloadCalculationReceiptFile(payload: CalculationReceiptPayload): void {
  const {
    persona,
    category,
    basicSalary,
    serviceYears,
    serviceMonths,
    totalServiceYears,
    eeBalance,
    erBalance,
    pensionBalance,
    maxAmount,
    requestedAmount,
    approvedAmount,
    tdsPercent,
    tdsAmount,
    netPayableAmount,
    explanation,
    taxNote,
    isAutoSettlement,
  } = payload;

  const dateFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const receiptId = `EPFO/CALC/${Date.now().toString().slice(-8)}`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EPFO Statutory Calculation Receipt - ${receiptId}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 28px; line-height: 1.5; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
    .header-logo { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; }
    .header-sub { font-size: 11px; color: #475569; margin-top: 3px; font-weight: 600; text-transform: uppercase; }
    .receipt-title { font-size: 14px; font-weight: 700; color: #1e40af; margin-top: 6px; }
    .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; font-size: 12px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
    .meta-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding: 4px 0; }
    .meta-label { color: #64748b; font-weight: 600; }
    .meta-value { color: #0f172a; font-weight: 700; }
    .fin-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    .fin-table th { background: #0f172a; color: #fff; text-align: left; padding: 9px 12px; font-size: 11px; text-transform: uppercase; }
    .fin-table th:last-child { text-align: right; }
    .fin-table td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
    .fin-table td:last-child { text-align: right; font-weight: 700; font-family: 'Courier New', monospace; }
    .fin-table tr:nth-child(even) { background: #f8fafc; }
    .highlight-row { background: #ecfdf5 !important; font-weight: 800; font-size: 13px; border-top: 2px solid #059669; }
    .highlight-row td { color: #065f46; }
    .notes-card { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 11px; color: #92400e; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .footer { border-top: 1px solid #cbd5e1; padding-top: 12px; margin-top: 24px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; align-items: center; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-logo">कर्मचारी भविष्य निधि संगठन (EPFO)</div>
    <div class="header-sub">Employees' Provident Fund Organisation • Ministry of Labour &amp; Employment, Govt. of India</div>
    <div class="receipt-title">OFFICIAL STATUTORY ASSESSMENT &amp; WITHDRAWAL ELIGIBILITY RECEIPT</div>
  </div>

  <div class="meta-box">
    <div class="grid-2">
      <div class="meta-row">
        <span class="meta-label">Receipt Reference:</span>
        <span class="meta-value" style="font-family: monospace;">${receiptId}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Generated Timestamp:</span>
        <span class="meta-value">${dateFormatted}, ${timeFormatted} IST</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Member Name:</span>
        <span class="meta-value">${persona.name}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Universal Account Number (UAN):</span>
        <span class="meta-value" style="font-family: monospace;">${persona.uan}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Continuous Service Tenure:</span>
        <span class="meta-value">${serviceYears} Yrs ${serviceMonths} Mos (${totalServiceYears} Yrs Total)</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Monthly Basic + DA Wage:</span>
        <span class="meta-value">₹${basicSalary.toLocaleString('en-IN')}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Selected Claim Category:</span>
        <span class="meta-value">${category}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Processing Channel:</span>
        <span class="meta-value">${isAutoSettlement ? '<span class="badge badge-success">Auto-Settlement Active (Sub-₹5L 68J)</span>' : '<span class="badge badge-amber">Standard Field Officer Assessment</span>'}</span>
      </div>
    </div>
  </div>

  <table class="fin-table">
    <thead>
      <tr>
        <th>Ledger &amp; Assessment Component</th>
        <th>Statutory Benchmark / Basis</th>
        <th>Calculated Figure (INR)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Accumulated Employee Share (EE)</td>
        <td>12% Mandatory Contribution + Compounded Interest</td>
        <td>₹${eeBalance.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Accumulated Employer Share (ER)</td>
        <td>3.67% EPF Corpus + Compounded Interest</td>
        <td>₹${erBalance.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Pension Fund Corpus (EPS 1995)</td>
        <td>8.33% Diversion (Subject to ₹15,000 Wage Ceiling)</td>
        <td>₹${pensionBalance.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td><strong>Maximum Statutory Entitlement</strong></td>
        <td>Scheme 1952 Para Limits (Capped at Formula)</td>
        <td><strong>₹${maxAmount.toLocaleString('en-IN')}</strong></td>
      </tr>
      <tr>
        <td>Requested Withdrawal Amount</td>
        <td>Member Input Value</td>
        <td>₹${requestedAmount.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>TDS Deduction (${tdsPercent}%)</td>
        <td>Section 192A / 206AA Income Tax Act 1961</td>
        <td style="color: ${tdsAmount > 0 ? '#b91c1c' : '#0f172a'};">- ₹${tdsAmount.toLocaleString('en-IN')}</td>
      </tr>
      <tr class="highlight-row">
        <td><strong>NET ESTIMATED DISBURSAL AMOUNT</strong></td>
        <td><strong>Approved for Direct Bank Credit (NPCI/NACH)</strong></td>
        <td><strong>₹${netPayableAmount.toLocaleString('en-IN')}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="notes-card">
    <div style="font-weight: 700; margin-bottom: 4px;">STATUTORY RULES &amp; TAXATION DISCLOSURE:</div>
    <div><strong>Rule Basis:</strong> ${explanation}</div>
    <div style="margin-top: 4px;"><strong>Taxation Assessment:</strong> ${taxNote}</div>
  </div>

  <div class="footer">
    <div>
      <div>* Computer-generated statutory computation sheet for informational and pre-filing validation.</div>
      <div>* Directives in accordance with Employees' Provident Funds Scheme, 1952 and EPS, 1995.</div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 700; color: #0f172a;">EPFO NextGen Portal</div>
      <div style="font-family: monospace; font-size: 9px;">VERIFICATION STAMP: ${Math.random().toString(36).substring(2, 12).toUpperCase()}</div>
    </div>
  </div>

  <div class="no-print" style="margin-top: 24px; text-align: center;">
    <button onclick="window.print()" style="background: #0f172a; color: #fff; border: none; padding: 10px 24px; font-size: 13px; font-weight: 700; border-radius: 6px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EPFO_Eligibility_Receipt_${persona.uan}_${persona.name.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

