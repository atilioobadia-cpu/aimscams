import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface JournalEntry {
  id: string;
  date: string;
  ref: string;
  description: string;
  debit: number;
  credit: number;
  status: 'POSTED' | 'UNPOSTED' | 'REVERSED';
}

@Component({
  selector: 'aims-journal-entries',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Journal Entries</h1>
          <p>{{ entries.length }} entries</p>
        </div>
        <button class="btn-primary">New Entry</button>
      </header>
      <section class="panel">
        <table class="journal-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>Description</th>
              <th class="right">Debit (TZS)</th>
              <th class="right">Credit (TZS)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (entry of entries; track entry.id) {
              <tr>
                <td>{{ entry.date }}</td>
                <td class="ref">{{ entry.ref }}</td>
                <td>{{ entry.description }}</td>
                <td class="right">{{ entry.debit | number }}</td>
                <td class="right">{{ entry.credit | number }}</td>
                <td><span class="status" [class]="entry.status.toLowerCase()">{{ entry.status }}</span></td>
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
    .journal-table { width: 100%; border-collapse: collapse; }
    .journal-table thead th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; color: var(--ink-faint); border-bottom: 1px solid var(--line); background: var(--paper); }
    .journal-table tbody td { padding: 10px 16px; border-bottom: 1px solid var(--line); font-size: 13px; }
    .journal-table tbody tr:hover { background: var(--paper); }
    .ref { font-family: monospace; }
    .right { text-align: right; }
    .status { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .status.posted { background: #e8f5e9; color: #2e7d32; }
    .status.unposted { background: #fff3e0; color: #ef6c00; }
    .status.reversed { background: #f5f5f5; color: #616161; }
  `]
})
export class JournalEntriesComponent {
  entries: JournalEntry[] = [
    { id: 'je-001', date: '2026-10-24', ref: 'JV-001', description: 'Member deposit - Grace Mwakipesile', debit: 0, credit: 1_250_000, status: 'POSTED' },
    { id: 'je-002', date: '2026-10-24', ref: 'JV-002', description: 'Loan disbursement - Emmanuel Chirwa', debit: 450_000, credit: 0, status: 'POSTED' },
    { id: 'je-003', date: '2026-10-24', ref: 'JV-003', description: 'Share purchase - Hadija Nambuya', debit: 0, credit: 50_000, status: 'UNPOSTED' },
  ];
}
