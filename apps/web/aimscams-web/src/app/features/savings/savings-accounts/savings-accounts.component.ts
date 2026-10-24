import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'aims-savings-accounts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Savings Accounts</h1>
          <p>{{ accounts.length }} accounts</p>
        </div>
        <button class="btn-primary">New Savings Account</button>
      </header>
      <section class="panel">
        <table class="savings-table">
          <thead>
            <tr>
              <th>Account No</th>
              <th>Member</th>
              <th>Product</th>
              <th>Branch</th>
              <th class="right">Balance (TZS)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (acc of accounts; track acc.no) {
              <tr>
                <td class="no">{{ acc.no }}</td>
                <td>{{ acc.member }}</td>
                <td>{{ acc.product }}</td>
                <td>{{ acc.branch }}</td>
                <td class="right">{{ acc.balance | number }}</td>
                <td><span class="status active">Active</span></td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
    .page-header h1 { margin: 0; font-size: 22px; }
    .page-header p { margin: 4px 0 0; color: var(--ink-faint); font-size: 12px; }
    .btn-primary { padding: 8px 14px; background: var(--brand); color: white; border: none; border-radius: 7px; font-weight: 600; cursor: pointer; }
    .panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
    .savings-table { width: 100%; border-collapse: collapse; }
    .savings-table thead th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; color: var(--ink-faint); border-bottom: 1px solid var(--line); background: var(--paper); }
    .savings-table tbody tr:hover { background: var(--paper); }
    .savings-table tbody td { padding: 10px 16px; border-bottom: 1px solid var(--line); font-size: 13px; }
    .no { font-family: monospace; }
    .right { text-align: right; }
    .status { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .status.active { background: #e8f5e9; color: #2e7d32; }
  `]
})
export class SavingsAccountsComponent {
  accounts = [
    { no: 'S-10001', member: 'Grace Mwakipesile (1001)', product: 'Regular Savings', branch: 'Head office', balance: 1_250_000 },
    { no: 'S-10002', member: 'Emmanuel Chirwa (1002)', product: 'Regular Savings', branch: 'Head office', balance: 840_000 },
    { no: 'S-10003', member: 'Hadija Nambuya (1003)', product: 'Regular Savings', branch: 'Mbeya', balance: 310_000 },
  ];
}
