import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TBLine {
  code: string;
  account: string;
  type: string;
  debit: number;
  credit: number;
}

@Component({
  selector: 'aims-trial-balance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Trial Balance</h1>
          <p>As at 24 October 2026</p>
        </div>
        <button class="btn-primary">Export</button>
      </header>
      <section class="panel">
        <table class="tb-table">
          <thead>
            <tr>
              <th>Account Code</th>
              <th>Account Name</th>
              <th>Type</th>
              <th class="right">Debit (TZS)</th>
              <th class="right">Credit (TZS)</th>
            </tr>
          </thead>
          <tbody>
            @for (line of lines; track line.code) {
              <tr>
                <td class="code">{{ line.code }}</td>
                <td>{{ line.account }}</td>
                <td>{{ line.type }}</td>
                <td class="right">{{ line.debit > 0 ? (line.debit | number) : '-' }}</td>
                <td class="right">{{ line.credit > 0 ? (line.credit | number) : '-' }}</td>
              </tr>
            }
            <tr class="totals">
              <td colspan="3"><strong>TOTALS</strong></td>
              <td class="right"><strong>{{ totalDebit | number }}</strong></td>
              <td class="right"><strong>{{ totalCredit | number }}</strong></td>
            </tr>
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
    .tb-table { width: 100%; border-collapse: collapse; }
    .tb-table thead th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; color: var(--ink-faint); border-bottom: 1px solid var(--line); background: var(--paper); }
    .tb-table tbody td { padding: 10px 16px; border-bottom: 1px solid var(--line); font-size: 13px; }
    .right { text-align: right; }
    .code { font-family: monospace; color: var(--ink-faint); }
    .totals { background: var(--paper); }
    .totals td { border-bottom: none; border-top: 2px solid var(--line-strong); }
  `]
})
export class TrialBalanceComponent {
  lines: TBLine[] = [
    { code: '1110', account: 'Cash on Hand', type: 'ASSET', debit: 1_250_000, credit: 0 },
    { code: '1120', account: 'Bank Accounts', type: 'ASSET', debit: 4_000_000, credit: 0 },
    { code: '1200', account: 'Loans and Advances', type: 'ASSET', debit: 12_450_000, credit: 0 },
    { code: '2100', account: 'Member Savings', type: 'LIABILITY', debit: 0, credit: 8_750_000 },
    { code: '2200', account: 'Member Shares', type: 'LIABILITY', debit: 0, credit: 3_200_000 },
    { code: '3100', account: 'Retained Earnings', type: 'EQUITY', debit: 0, credit: 5_750_000 },
  ];
  get totalDebit() { return this.lines.reduce((s, l) => s + l.debit, 0); }
  get totalCredit() { return this.lines.reduce((s, l) => s + l.credit, 0); }
}
