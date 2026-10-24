import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'aims-teller-console',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Teller Console</h1>
          <p>Till status: <span class="pill" [class.open]="tillOpen">{{ tillOpen ? 'Open' : 'Closed' }}</span></p>
        </div>
        <div class="actions">
          <button class="btn" (click)="tillOpen = !tillOpen">{{ tillOpen ? 'Close Till' : 'Open Till' }}</button>
        </div>
      </header>

      <div class="cats">
        @for (c of categories; track c.id) {
          <button class="cat" [class.on]="category === c.id" (click)="category = c.id">
            <strong>{{ c.label }}</strong>
            <span>{{ c.hint }}</span>
          </button>
        }
      </div>

      <section class="panel">
        <div class="panel-head">
          <h2>{{ activeCategory.label }}</h2>
          <span class="hint">{{ activeCategory.hint }}</span>
        </div>
        <form class="tx-form" (ngSubmit)="submit()">
          <div class="field">
            <label>Member / Account</label>
            <input name="account" [(ngModel)]="form.account" placeholder="Search member or account number" />
          </div>
          <div class="field">
            <label>Amount (TZS)</label>
            <input name="amount" [(ngModel)]="form.amount" type="number" min="0" placeholder="0" />
          </div>
          <div class="field">
            <label>Narration</label>
            <input name="narration" [(ngModel)]="form.narration" placeholder="Optional note" />
          </div>
          <button class="btn-primary" type="submit" [disabled]="!tillOpen || !form.account || !form.amount">
            Post {{ activeCategory.label }}
          </button>
          @if (!tillOpen) {
            <p class="warn">Open the till before posting transactions.</p>
          }
        </form>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>Today's Teller Activity</h2></div>
        <table class="tx-table">
          <thead>
            <tr><th>Time</th><th>Type</th><th>Account</th><th class="right">Amount (TZS)</th><th>Status</th></tr>
          </thead>
          <tbody>
            @for (t of posted; track t.id) {
              <tr>
                <td>{{ t.time }}</td>
                <td>{{ t.type }}</td>
                <td class="no">{{ t.account }}</td>
                <td class="right">{{ t.amount | number }}</td>
                <td><span class="status" [class]="t.status.toLowerCase()">{{ t.status }}</span></td>
              </tr>
            }
            @if (posted.length === 0) {
              <tr><td colspan="5" class="empty">No transactions posted today.</td></tr>
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
    .pill { padding: 2px 8px; border-radius: 6px; background: #fce4ec; color: #c2185b; font-weight: 600; }
    .pill.open { background: #e8f5e9; color: #2e7d32; }
    .btn, .btn-primary { padding: 8px 14px; border-radius: 7px; font-weight: 600; cursor: pointer; font-size: 13px; font-family: inherit; }
    .btn { background: white; border: 1px solid var(--line-strong); }
    .btn-primary { background: var(--brand); color: white; border: none; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .cats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .cat { text-align: left; padding: 12px 14px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); cursor: pointer; font-family: inherit; }
    .cat.on { border-color: var(--brand); box-shadow: 0 0 0 2px var(--brand-soft); }
    .cat strong { display: block; font-size: 13px; }
    .cat span { display: block; font-size: 11px; color: var(--ink-faint); margin-top: 3px; }
    .panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; margin-bottom: 16px; }
    .panel-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--line); }
    .panel-head h2 { margin: 0; font-size: 14px; }
    .hint { font-size: 12px; color: var(--ink-faint); }
    .tx-form { display: grid; grid-template-columns: 2fr 1fr 2fr auto; gap: 12px; align-items: end; padding: 16px; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: 11px; font-weight: 600; color: var(--ink-faint); text-transform: uppercase; }
    .field input { padding: 8px 10px; border: 1px solid var(--line-strong); border-radius: 7px; font-size: 13px; font-family: inherit; }
    .warn { grid-column: 1 / -1; margin: 0; color: var(--coral); font-size: 12px; }
    .tx-table { width: 100%; border-collapse: collapse; }
    .tx-table thead th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; color: var(--ink-faint); border-bottom: 1px solid var(--line); background: var(--paper); }
    .tx-table tbody td { padding: 10px 16px; border-bottom: 1px solid var(--line); font-size: 13px; }
    .no { font-family: monospace; }
    .right { text-align: right; }
    .status { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .status.pending { background: #fff3e0; color: #ef6c00; }
    .status.approved { background: #e8f5e9; color: #2e7d32; }
    .empty { text-align: center; color: var(--ink-faint); padding: 24px; }
  `]
})
export class TellerConsoleComponent {
  tillOpen = true;
  category = 'deposit';

  categories = [
    { id: 'deposit', label: 'Deposit', hint: 'Cash in to savings' },
    { id: 'withdrawal', label: 'Withdrawal', hint: 'Cash out of savings' },
    { id: 'repayment', label: 'Loan Repayment', hint: 'Collect loan instalment' },
    { id: 'share', label: 'Share Purchase', hint: 'Buy member shares' },
  ];

  form = { account: '', amount: null as number | null, narration: '' };

  posted: Array<{ id: string; time: string; type: string; account: string; amount: number; status: string }> = [];

  get activeCategory() {
    return this.categories.find((c) => c.id === this.category) ?? this.categories[0];
  }

  submit(): void {
    if (!this.tillOpen || !this.form.account || !this.form.amount) return;
    this.posted.unshift({
      id: `tx-${Date.now()}`,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      type: this.activeCategory.label,
      account: this.form.account,
      amount: this.form.amount,
      status: 'Pending',
    });
    this.form = { account: '', amount: null, narration: '' };
  }
}
