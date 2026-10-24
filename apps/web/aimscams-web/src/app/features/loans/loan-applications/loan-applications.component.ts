import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aims-loan-applications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Loan Applications</h1>
          <p>{{ apps.length }} applications</p>
        </div>
        <button class="btn-primary">New Application</button>
      </header>
      <section class="panel">
        <table class="loan-table">
          <thead>
            <tr>
              <th>App No</th>
              <th>Applicant</th>
              <th>Product</th>
              <th class="right">Amount (TZS)</th>
              <th>Applied</th>
              <th>Status</th>
              <th>Stage</th>
            </tr>
          </thead>
          <tbody>
            @for (app of apps; track app.no) {
              <tr>
                <td class="no">{{ app.no }}</td>
                <td>{{ app.applicant }}</td>
                <td>{{ app.product }}</td>
                <td class="right">{{ app.amount | number }}</td>
                <td>{{ app.applied }}</td>
                <td><span class="status" [class]="app.status.toLowerCase()">{{ app.status }}</span></td>
                <td>{{ app.stage }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
    .page-header h1 { margin: 0; font-size: 22px; }
    .page-header p { margin: 4px 0 0; color: var(--ink-faint); font-size: 12px; }
    .btn-primary { padding: 8px 14px; background: var(--brand); color: white; border: none; border-radius: 7px; font-weight: 600; cursor: pointer; }
    .panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
    .loan-table { width: 100%; border-collapse: collapse; }
    .loan-table thead th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; color: var(--ink-faint); border-bottom: 1px solid var(--line); background: var(--paper); }
    .loan-table tbody tr:hover { background: var(--paper); }
    .loan-table tbody td { padding: 10px 16px; border-bottom: 1px solid var(--line); font-size: 13px; }
    .no { font-family: monospace; }
    .right { text-align: right; }
    .status { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .status.pending { background: #fff3e0; color: #ef6c00; }
    .status.approved { background: #e8f5e9; color: #2e7d32; }
    .status.rejected { background: #fce4ec; color: #c2185b; }
  `]
})
export class LoanApplicationsComponent {
  apps = [
    { no: 'LA-001', applicant: 'Grace Mwakipesile (1001)', product: 'Personal Loan', amount: 500_000, applied: '2026-10-20', status: 'Pending', stage: 'KYC Review' },
    { no: 'LA-002', applicant: 'Emmanuel Chirwa (1002)', product: 'Business Loan', amount: 2_000_000, applied: '2026-10-22', status: 'Pending', stage: 'Guarantor Check' },
    { no: 'LA-003', applicant: 'Jitegemea Group (2001)', product: 'Group Loan', amount: 5_000_000, applied: '2026-10-23', status: 'Approved', stage: 'Sanctions' },
  ];
}
