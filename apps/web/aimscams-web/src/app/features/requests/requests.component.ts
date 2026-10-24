import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RequestRow {
  id: string;
  type: string;
  subject: string;
  requestedBy: string;
  requestedAt: string;
  amount?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

@Component({
  selector: 'aims-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Requests</h1>
          <p>{{ pending.length }} awaiting your approval</p>
        </div>
      </header>

      <div class="tabs">
        <button class="tab" [class.on]="tab === 'PENDING'" (click)="tab = 'PENDING'">Pending ({{ pending.length }})</button>
        <button class="tab" [class.on]="tab === 'APPROVED'" (click)="tab = 'APPROVED'">Approved</button>
        <button class="tab" [class.on]="tab === 'REJECTED'" (click)="tab = 'REJECTED'">Rejected</button>
      </div>

      <section class="panel">
        <table class="req-table">
          <thead>
            <tr>
              <th>Request</th>
              <th>Type</th>
              <th>Subject</th>
              <th>Requested By</th>
              <th class="right">Amount (TZS)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (r of visible; track r.id) {
              <tr>
                <td class="no">{{ r.id }}</td>
                <td>{{ r.type }}</td>
                <td>{{ r.subject }}<br /><span class="when">{{ r.requestedAt }}</span></td>
                <td>{{ r.requestedBy }}</td>
                <td class="right">{{ r.amount ? (r.amount | number) : '—' }}</td>
                <td>
                  @if (r.status === 'PENDING') {
                    <button class="mini ok" (click)="decide(r, 'APPROVED')">Approve</button>
                    <button class="mini no" (click)="decide(r, 'REJECTED')">Reject</button>
                  } @else {
                    <span class="status" [class]="r.status.toLowerCase()">{{ r.status }}</span>
                  }
                </td>
              </tr>
            }
            @if (visible.length === 0) {
              <tr><td colspan="6" class="empty">Nothing here.</td></tr>
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
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; }
    .tab { padding: 7px 14px; background: transparent; border: 1px solid transparent; border-radius: 7px; font-size: 13px; cursor: pointer; color: var(--ink-faint); font-family: inherit; }
    .tab.on { background: var(--surface); border-color: var(--line); color: var(--ink); font-weight: 600; }
    .panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
    .req-table { width: 100%; border-collapse: collapse; }
    .req-table thead th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; color: var(--ink-faint); border-bottom: 1px solid var(--line); background: var(--paper); }
    .req-table tbody td { padding: 10px 16px; border-bottom: 1px solid var(--line); font-size: 13px; vertical-align: top; }
    .no { font-family: monospace; }
    .when { font-size: 11px; color: var(--ink-faint); }
    .right { text-align: right; }
    .mini { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid transparent; font-family: inherit; }
    .mini.ok { background: #e8f5e9; color: #2e7d32; border-color: #c8e6c9; }
    .mini.no { background: #fce4ec; color: #c2185b; border-color: #f8bbd0; margin-left: 6px; }
    .status { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .status.approved { background: #e8f5e9; color: #2e7d32; }
    .status.rejected { background: #fce4ec; color: #c2185b; }
    .empty { text-align: center; color: var(--ink-faint); padding: 24px; }
  `]
})
export class RequestsComponent {
  tab: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';

  requests: RequestRow[] = [
    { id: 'RQ-001', type: 'Teller Transaction', subject: 'Deposit approval — S-10001', requestedBy: 'Teller One', requestedAt: '24 Oct 2026, 09:12', amount: 250_000, status: 'PENDING' },
    { id: 'RQ-002', type: 'Loan Disbursement', subject: 'Disburse L-0003 — Grace Mwakipesile', requestedBy: 'Loan Officer', requestedAt: '24 Oct 2026, 08:40', amount: 1_200_000, status: 'PENDING' },
    { id: 'RQ-003', type: 'Till Close', subject: 'Close till — Main Branch', requestedBy: 'Teller Two', requestedAt: '23 Oct 2026, 17:05', status: 'PENDING' },
    { id: 'RQ-004', type: 'Reversal', subject: 'Reverse TX-1004', requestedBy: 'Teller Two', requestedAt: '23 Oct 2026, 16:30', amount: 40_000, status: 'APPROVED' },
  ];

  get pending() { return this.requests.filter(r => r.status === 'PENDING'); }
  get visible() { return this.requests.filter(r => r.status === this.tab); }

  decide(row: RequestRow, status: 'APPROVED' | 'REJECTED'): void {
    row.status = status;
  }
}
