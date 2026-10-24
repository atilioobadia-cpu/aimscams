import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aims-transactions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Transactions</h1>
          <p>{{ rows.length }} transactions</p>
        </div>
        <button class="btn">Export</button>
      </header>
      <section class="panel">
        <div class="filter-bar">
          <input type="text" placeholder="Search reference, account, member..." />
          <select><option>All Types</option><option>Deposit</option><option>Withdrawal</option><option>Repayment</option><option>Share Purchase</option></select>
          <select><option>All Status</option><option>Posted</option><option>Pending</option><option>Reversed</option></select>
        </div>
        <table class="tx-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>Type</th>
              <th>Account</th>
              <th>Member</th>
              <th class="right">Amount (TZS)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (t of rows; track t.ref) {
              <tr>
                <td>{{ t.date }}</td>
                <td class="no">{{ t.ref }}</td>
                <td>{{ t.type }}</td>
                <td class="no">{{ t.account }}</td>
                <td>{{ t.member }}</td>
                <td class="right">{{ t.amount | number }}</td>
                <td><span class="status" [class]="t.status.toLowerCase()">{{ t.status }}</span></td>
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
    .btn { padding: 8px 14px; border-radius: 7px; background: white; border: 1px solid var(--line-strong); font-weight: 600; cursor: pointer; font-size: 13px; }
    .panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
    .filter-bar { display: flex; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--line); background: var(--paper); }
    .filter-bar input, .filter-bar select { padding: 8px 10px; border: 1px solid var(--line-strong); border-radius: 7px; font-size: 13px; font-family: inherit; }
    .filter-bar input { flex: 1; }
    .tx-table { width: 100%; border-collapse: collapse; }
    .tx-table thead th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; color: var(--ink-faint); border-bottom: 1px solid var(--line); }
    .tx-table tbody tr:hover { background: var(--paper); }
    .tx-table tbody td { padding: 10px 16px; border-bottom: 1px solid var(--line); font-size: 13px; }
    .no { font-family: monospace; }
    .right { text-align: right; }
    .status { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .status.posted { background: #e8f5e9; color: #2e7d32; }
    .status.pending { background: #fff3e0; color: #ef6c00; }
    .status.reversed { background: #f5f5f5; color: #616161; }
  `]
})
export class TransactionsComponent {
  rows = [
    { date: '2026-10-24', ref: 'TX-1001', type: 'Deposit', account: 'S-10001', member: 'Grace Mwakipesile', amount: 250_000, status: 'Posted' },
    { date: '2026-10-24', ref: 'TX-1002', type: 'Repayment', account: 'L-0001', member: 'Emmanuel Chirwa', amount: 75_000, status: 'Posted' },
    { date: '2026-10-24', ref: 'TX-1003', type: 'Share Purchase', account: 'SH-1003', member: 'Hadija Nambuya', amount: 50_000, status: 'Pending' },
    { date: '2026-10-23', ref: 'TX-1004', type: 'Withdrawal', account: 'S-10002', member: 'Emmanuel Chirwa', amount: 40_000, status: 'Reversed' },
  ];
}
