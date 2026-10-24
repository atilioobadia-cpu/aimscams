import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MembersService } from '../../core/services/members.service';
import { Member } from '../../core/models/member';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'TZS',
  minimumFractionDigits: 0,
});

const compact = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return Math.round(n / 1e3) + 'K';
  return String(n);
};

type Tab = 'savings' | 'shares';

@Component({
  selector: 'aims-savings-shares',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-head">
      <div>
        <h1>Savings &amp; Shares</h1>
        <p>{{ totalMembers() }} members · amounts in TZS</p>
      </div>
      <div class="right">
        <button class="btn" type="button">Export</button>
        <button class="btn primary" type="button">New account</button>
      </div>
    </div>

    <div class="tabs" role="tablist">
      <button role="tab" [attr.aria-selected]="tab() === 'savings'" [class.active]="tab() === 'savings'" (click)="tab.set('savings')">Savings</button>
      <button role="tab" [attr.aria-selected]="tab() === 'shares'" [class.active]="tab() === 'shares'" (click)="tab.set('shares')">Shares</button>
    </div>

    <section class="kpis">
      <div class="kpi">
        <div class="top">
          <span class="icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/></svg>
          </span>
          <div style="min-width:0"><div class="label">Total savings</div></div>
        </div>
        <div class="value">TZS {{ compact(totalSavings()) }}</div>
        <div class="foot"><span class="muted">across all accounts</span></div>
      </div>
      <div class="kpi">
        <div class="top">
          <span class="icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M15 9.5c0-1-1.3-1.5-3-1.5s-3 .5-3 1.5 1.3 1.5 3 1.5 3 .5 3 1.5-1.3 1.5-3 1.5-3-.5-3-1.5"/></svg>
          </span>
          <div style="min-width:0"><div class="label">Share capital</div></div>
        </div>
        <div class="value">TZS {{ compact(totalShares()) }}</div>
        <div class="foot"><span class="muted">non-withdrawable</span></div>
      </div>
      <div class="kpi">
        <div class="top">
          <span class="icon gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </span>
          <div style="min-width:0"><div class="label">Members with savings</div></div>
        </div>
        <div class="value">{{ membersWithSavings() }}</div>
        <div class="foot"><span class="muted">of {{ totalMembers() }}</span></div>
      </div>
      <div class="kpi">
        <div class="top">
          <span class="icon coral">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><path d="M16 13h2"/></svg>
          </span>
          <div style="min-width:0"><div class="label">Members with shares</div></div>
        </div>
        <div class="value">{{ membersWithShares() }}</div>
        <div class="foot"><span class="muted">of {{ totalMembers() }}</span></div>
      </div>
    </section>

    @if (tab() === 'savings') {
      <section class="panel" aria-label="Savings accounts">
        <div class="panel-head">
          <h2>Savings accounts</h2>
          <span class="sub">{{ savingsRows().length }} accounts</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Phone</th>
                <th>Branch</th>
                <th class="num">Balance (TZS)</th>
                <th>Status</th>
                <th>KYC</th>
              </tr>
            </thead>
            <tbody>
              @for (m of savingsRows(); track m.id) {
                <tr class="clickable">
                  <td>
                    <div class="member-cell">
                      <div class="initials">{{ m.first[0] }}{{ m.last[0] }}</div>
                      <div>
                        <div class="nm">{{ m.first }} {{ m.last }}</div>
                        <div class="no">{{ m.memberNo }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ m.phone }}</td>
                  <td>{{ m.branch }}</td>
                  <td class="num"><span class="money">{{ formatMoney(m.savings) }}</span></td>
                  <td><span class="pill" [class.ok]="m.status === 'Active'" [class.muted]="m.status === 'Dormant'">{{ m.status }}</span></td>
                  <td><span class="pill" [class.ok]="m.kyc === 'Verified'">{{ m.kyc }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    } @else {
      <section class="panel" aria-label="Share capital">
        <div class="panel-head">
          <h2>Share capital</h2>
          <span class="sub">{{ shareRows().length }} members with shares</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Phone</th>
                <th>Branch</th>
                <th class="num">Shares (TZS)</th>
                <th>Status</th>
                <th>KYC</th>
              </tr>
            </thead>
            <tbody>
              @for (m of shareRows(); track m.id) {
                <tr class="clickable">
                  <td>
                    <div class="member-cell">
                      <div class="initials">{{ m.first[0] }}{{ m.last[0] }}</div>
                      <div>
                        <div class="nm">{{ m.first }} {{ m.last }}</div>
                        <div class="no">{{ m.memberNo }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ m.phone }}</td>
                  <td>{{ m.branch }}</td>
                  <td class="num"><span class="money">{{ formatMoney(m.shares ?? 0) }}</span></td>
                  <td><span class="pill" [class.ok]="m.status === 'Active'" [class.muted]="m.status === 'Dormant'">{{ m.status }}</span></td>
                  <td><span class="pill" [class.ok]="m.kyc === 'Verified'">{{ m.kyc }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
})
export class SavingsSharesComponent {
  private membersService = inject(MembersService);

  tab = signal<Tab>('savings');
  members = signal<Member[]>([]);

  constructor() {
    this.membersService.list().subscribe((members) => this.members.set(members));
  }

  totalMembers = computed(() => this.members().length);
  totalSavings = computed(() => this.members().reduce((sum, m) => sum + (m.savings || 0), 0));
  totalShares = computed(() => this.members().reduce((sum, m) => sum + (m.shares ?? 0), 0));
  membersWithSavings = computed(() => this.members().filter((m) => (m.savings || 0) > 0).length);
  membersWithShares = computed(() => this.members().filter((m) => (m.shares ?? 0) > 0).length);
  savingsRows = computed(() => [...this.members()].sort((a, b) => (b.savings || 0) - (a.savings || 0)));
  shareRows = computed(() => this.members().filter((m) => (m.shares ?? 0) > 0).sort((a, b) => (b.shares ?? 0) - (a.shares ?? 0)));

  protected readonly compact = compact;
  readonly formatMoney = (n: number) => money.format(n);
}
