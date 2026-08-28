import { Persona } from '../types';

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function generatePassbookHTML(persona: Persona): string {
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
  const doe = persona.profile.employment.exitDateUpdated ? persona.profile.employment.to || '2024-04' : 'Active / Not Marked';

  // Synthetic monthly contribution rows for passbook
  const months = [
    { month: 'Jul 2026', epfWage: 72000, epsWage: 15000, eeShare: 8640, erShare: 7390, epsShare: 1250, date: '15 Aug 2026' },
    { month: 'Jun 2026', epfWage: 72000, epsWage: 15000, eeShare: 8640, erShare: 7390, epsShare: 1250, date: '15 Jul 2026' },
    { month: 'May 2026', epfWage: 72000, epsWage: 15000, eeShare: 8640, erShare: 7390, epsShare: 1250, date: '15 Jun 2026' },
    { month: 'Apr 2026', epfWage: 72000, epsWage: 15000, eeShare: 8640, erShare: 7390, epsShare: 1250, date: '15 May 2026' },
    { month: 'Mar 2026', epfWage: 70000, epsWage: 15000, eeShare: 8400, erShare: 7150, epsShare: 1250, date: '15 Apr 2026' },
    { month: 'Feb 2026', epfWage: 70000, epsWage: 15000, eeShare: 8400, erShare: 7150, epsShare: 1250, date: '15 Mar 2026' },
    { month: 'Jan 2026', epfWage: 70000, epsWage: 15000, eeShare: 8400, erShare: 7150, epsShare: 1250, date: '15 Feb 2026' },
    { month: 'Dec 2025', epfWage: 70000, epsWage: 15000, eeShare: 8400, erShare: 7150, epsShare: 1250, date: '15 Jan 2026' },
    { month: 'Nov 2025', epfWage: 70000, epsWage: 15000, eeShare: 8400, erShare: 7150, epsShare: 1250, date: '15 Dec 2025' },
    { month: 'Oct 2025', epfWage: 70000, epsWage: 15000, eeShare: 8400, erShare: 7150, epsShare: 1250, date: '15 Nov 2025' },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EPFO Member Passbook - ${uan}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
    .header-logo { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; }
    .header-sub { font-size: 12px; color: #475569; margin-top: 3px; font-weight: 600; text-transform: uppercase; }
    .doc-title { font-size: 15px; font-weight: 700; color: #1e40af; margin-top: 6px; }
    
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
    
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
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
      <div class="meta-item"><span class="meta-label">Bank Verified:</span> <span class="meta-val">${persona.profile.bankVerified ? 'Yes (NPCI Linked)' : 'Pending'}</span></div>
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
      <div class="summary-label">Interest (8.25% p.a.)</div>
      <div class="summary-amount">${formatINR(interestEarned)}</div>
    </div>
    <div class="summary-card highlight-card">
      <div class="summary-label">Total Closing Balance</div>
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
      <div>* Generated from Next-Gen EPFO Digital Member Portal on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.</div>
      <div>* All calculations reflect official Ministry gazette notifications for 8.25% declared interest.</div>
    </div>
    <div class="qr-stamp">
      DIGITALLY VERIFIED EPF RECORD<br>
      HASH: ${Math.random().toString(36).substring(2, 10).toUpperCase()}
    </div>
  </div>

  <div class="no-print" style="margin-top: 24px; text-align: center;">
    <button onclick="window.print()" style="background: #1d4ed8; color: #fff; border: none; padding: 10px 24px; font-size: 13px; font-weight: 700; border-radius: 6px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`;
}

export function downloadPassbookFile(persona: Persona): void {
  const htmlContent = generatePassbookHTML(persona);
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
