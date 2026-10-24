import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Account {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  parent?: string;
  balance?: number;
  level: number;
}

@Component({
  selector: 'aims-chart-of-accounts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Chart of Accounts</h1>
          <p>{{ accounts.length }} accounts</p>
        </div>
        <button class="btn-primary">Add Account</button>
      </header>
      <section class="panel">
        <table class="coa-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Account Name</th>
              <th>Type</th>
              <th class="right">Balance</th>
            </tr>
          </thead>
          <tbody>
            @for (acc of accounts; track acc.code) {
              <tr [style.padding-left.px]="acc.level * 20">
                <td class="code">{{ acc.code }}</td>
                <td [class.indent]="acc.level > 0">{{ acc.name }}</td>
                <td><span class="type-badge" [class]="acc.type.toLowerCase()">{{ acc.type }}</span></td>
                <td class="right">{{ acc.balance | number }}</td>
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
    .panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); }
    .coa-table { width: 100%; border-collapse: collapse; }
    .coa-table thead th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; color: var(--ink-faint); border-bottom: 1px solid var(--line); }
    .coa-table tbody td { padding: 10px 16px; border-bottom: 1px solid var(--line); font-size: 13px; }
    .coa-table tbody tr:hover { background: var(--paper); }
    .code { font-family: monospace; color: var(--ink-faint); }
    .indent { padding-left: 30px !important; }
    .right { text-align: right; }
    .type-badge { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .type-badge.asset { background: #e8f5e9; color: #2e7d32; }
    .type-badge.liability { background: #fff3e0; color: #ef6c00; }
    .type-badge.equity { background: #e3f2fd; color: #1565c0; }
    .type-badge.income { background: #f3e5f5; color: #6a1b9a; }
    .type-badge.expense { background: #fce4ec; color: #c2185b; }
  `]
})
export class ChartOfAccountsComponent {
  accounts: Account[] = [
    { code: '1000', name: 'ASSETS', type: 'ASSET', level: 0 },
    { code: '1100', name: 'Cash and Bank', type: 'ASSET', parent: '1000', level: 1, balance: 5_250_000 },
    { code: '1110', name: 'Cash on Hand', type: 'ASSET', parent: '1100', level: 2, balance: 1_250_000 },
    { code: '1120', name: 'Bank Accounts', type: 'ASSET', parent: '1100', level: 2, balance: 4_000_000 },
    { code: '1200', name: 'Loans and Advances', type: 'ASSET', parent: '1000', level: 1, balance: 12_450_000 },
    { code: '2000', name: 'LIABILITIES', type: 'LIABILITY', level: 0 },
    { code: '2100', name: 'Member Savings', type: 'LIABILITY', parent: '2000', level: 1, balance: 8_750_000 },
    { code: '2200', name: 'Member Shares', type: 'LIABILITY', parent: '2000', level: 1, balance: 3_200_000 },
    { code: '3000', name: 'EQUITY', type: 'EQUITY', level: 0 },
    { code: '3100', name: 'Retained Earnings', type: 'EQUITY', parent: '3000', level: 1, balance: 5_750_000 },
    { code: '4000', name: 'INCOME', type: 'INCOME', level: 0 },
    { code: '4100', name: 'Interest on Loans', type: 'INCOME', parent: '4000', level: 1, balance: 1_850_000 },
    { code: '5000', name: 'EXPENSES', type: 'EXPENSE', level: 0 },
    { code: '5100', name: 'Interest on Savings', type: 'EXPENSE', parent: '5000', level: 1, balance: 320_000 },
  ];
}
