import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aims-loan-accounts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Loan Accounts</h1>
          <p>{{ active.length }} active · {{ closed.length }} closed</p>
        </div>
        <div class="actions">
          <button class="btn">Disburse</button>
          <button class="btn-primary">New Loan</button>
        </div>
      </header>

      <div class="tabs">
        <button class="tab" [class.on]="tab === 'active'" (click)="tab = 'active'">Active</button>
        <button class="tab" [class.on]="tab === 'new'" (click)="tab = 'new'">New</button>
        <button class="tab" [class.on]="tab === 'closed'" (click)="tab = 'closed'">Closed</button>
      </div>

      <section class="panel">
        <table class="loan-table">
          <thead>
            <tr>
              <th>Loan No</th>
              <th>Member</th>
              <th>Product</th>
              <th class="right">Principal (TZS)</th>
              <th class="right">Outstanding (TZS)</th>
              <th class="right">Arrears (TZS)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (loan of currentRows; track loan.no) {
              <tr>
                <td class="no">{{ loan.no }}</td>
                <td>{{ loan.member }}</td>
                <td>{{ loan.product }}</td>
                <td class="right">{{ loan.principal | number }}</td>
                <td class="right">{{ loan.outstanding | number }}</td>
                <td class="right" [class.bad]="loan.arrears > 0">{{ loan.arrears | number }}</td>
                <td><span class="status" [class]="loan.status.toLowerCase()">{{ loan.status }}</span></td>
              </tr>
            }
            @if (currentRows.length === 0) {
              <tr><td colspan="7" class="empty">No loans in this tab.</td></tr>
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
    .actions { display: flex; gap: 8px; }
    .btn, .btn-primary { padding: 8px 14px; border-radius: 7px; font-weight: 600; cursor: pointer; font-size: 13px; }
    .btn { background: white; border: 1px solid var(--line-strong); }
    .btn-primary { background: var(--brand); color: white; border: none; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; }
    .tab { padding: 7px 14px; background: transparent; border: 1px solid transparent; border-radius: 7px; font-size: 13px; cursor: pointer; color: var(--ink-faint); font-family: inherit; }
    .tab.on { background: var(--surface); border-color: var(--line); color: var(--ink); font-weight: 600; }
    .panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
    .loan-table { width: 100%; border-collapse: collapse; }
    .loan-table thead th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; color: var(--ink-faint); border-bottom: 1px solid var(--line); background: var(--paper); }
    .loan-table tbody tr:hover { background: var(--paper); }
    .loan-table tbody td { padding: 10px 16px; border-bottom: 1px solid var(--line); font-size: 13px; }
    .no { font-family: monospace; }
    .right { text-align: right; }
    .bad { color: var(--coral); font-weight: 600; }
    .status { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .status.active { background: #e8f5e9; color: #2e7d32; }
    .status.closed { background: #f5f5f5; color: #616161; }
    .status.new { background: #e3f2fd; color: #1565c0; }
    .empty { text-align: center; color: var(--ink-faint); padding: 24px; }
  `]
})
export class LoanAccountsComponent {
  tab: 'active' | 'new' | 'closed' = 'active';

  loans = [
    { no: 'L-0001', member: 'Emmanuel Chirwa (1002)', product: 'Personal Loan', principal: 450_000, outstanding: 375_000, arrears: 0, status: 'Active' },
    { no: 'L-0002', member: 'Jitegemea Group (2001)', product: 'Group Loan', principal: 5_000_000, outstanding: 4_600_000, arrears: 120_000, status: 'Active' },
    { no: 'L-0003', member: 'Grace Mwakipesile (1001)', product: 'Business Loan', principal: 1_200_000, outstanding: 1_200_000, arrears: 0, status: 'New' },
    { no: 'L-0004', member: 'Hadija Nambuya (1003)', product: 'Emergency Loan', principal: 200_000, outstanding: 0, arrears: 0, status: 'Closed' },
  ];

  get active() { return this.loans.filter(l => l.status === 'Active'); }
  get closed() { return this.loans.filter(l => l.status === 'Closed'); }
  get currentRows() { return this.loans.filter(l => l.status.toLowerCase() === this.tab); }
}
