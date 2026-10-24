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

const PI2 = 2 * Math.PI;
const DONUT_R = 46;
const DONUT_C = PI2 * DONUT_R;

@Component({
  selector: 'aims-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-head">
      <div>
        <h1>Overview</h1>
        <p>MFSL MFI · Head office · as at 23 October 2026 · amounts in TZS</p>
      </div>
      <div class="right">
        <select class="btn" aria-label="Period">
          <option>This month</option>
          <option>Last 30 days</option>
          <option>This quarter</option>
          <option>Year to date</option>
        </select>
        <button class="btn" type="button">Export</button>
      </div>
    </div>

    <div class="tabs" role="tablist">
      @for (t of tabs; track t[0]) {
        <button role="tab" [attr.aria-selected]="activeTab() === t[0]" [class.active]="activeTab() === t[0]" (click)="activeTab.set(t[0])">{{ t[1] }}</button>
      }
    </div>

    @if (activeTab() === 'overview') {
      <section class="kpis">
        <div class="kpi">
          <div class="top">
            <span class="icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            <div style="min-width:0"><div class="label">Total members</div></div>
          </div>
          <div class="value">{{ p().members }}</div>
          <div class="foot"><span class="delta up">+0</span><span>joined this month</span></div>
        </div>
        <div class="kpi">
          <div class="top">
            <span class="icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><path d="M16 13h2"/></svg>
            </span>
            <div style="min-width:0"><div class="label">Outstanding loan principal</div></div>
          </div>
          <div class="value">TZS {{ compact(p().outstanding) }}</div>
          <div class="foot"><span class="muted">{{ p().active }} active loans</span></div>
        </div>
        <div class="kpi">
          <div class="top">
            <span class="icon gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M15 9.5c0-1-1.3-1.5-3-1.5s-3 .5-3 1.5 1.3 1.5 3 1.5 3 .5 3 1.5-1.3 1.5-3 1.5-3-.5-3-1.5"/></svg>
            </span>
            <div style="min-width:0"><div class="label">Principal in arrears</div></div>
          </div>
          <div class="value">TZS {{ compact(p().arrears) }}</div>
          <div class="foot"><span class="delta down">PAR {{ p().par.toFixed(1) }}%</span><span>of the book</span></div>
        </div>
        <div class="kpi">
          <div class="top">
            <span class="icon coral">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="7.5" cy="7" r="4"/><path d="M17 8v4"/><path d="M17 16h.01"/><circle cx="17" cy="12" r="5"/></svg>
            </span>
            <div style="min-width:0"><div class="label">Clients in arrears</div></div>
          </div>
          <div class="value">{{ p().clientsInArrears }}</div>
          <div class="foot"><span class="muted">of {{ p().members }} borrowers</span></div>
        </div>
      </section>

      <div class="grid-2">
        <section class="panel">
          <div class="panel-head">
            <h2>Funds in vs funds out</h2>
            <span class="sub">member savings, last 6 months</span>
            <span class="right">
              <span class="legend"><span><i style="background:#0f4c3a"></i>In</span><span><i style="background:#c9b79a"></i>Out</span></span>
            </span>
          </div>
          <div class="chart">
            <div class="bars">
              @for (label of flow.labels; track label; let i = $index) {
                <div class="bar-col">
                  <div class="bar-pair">
                    <div class="bar in" [style.height.%]="barPct(flow.in[i])" [attr.title]="'In ' + compact(flow.in[i])"></div>
                    <div class="bar out" [style.height.%]="barPct(flow.out[i])" [attr.title]="'Out ' + compact(flow.out[i])"></div>
                  </div>
                  <div class="m">{{ label }}</div>
                </div>
              }
            </div>
            <div class="bar-axis"><span>0</span><span>TZS {{ compact(flowMax()) }}</span></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Total savings, shares & loans</h2></div>
          <div class="donut-wrap">
            <svg class="donut" width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Portfolio composition">
              <g transform="rotate(-90 60 60)" stroke-linecap="butt">
                @for (seg of donutSegments(); track seg.label) {
                  <circle cx="60" cy="60" r="46" fill="none" [attr.stroke]="seg.color" stroke-width="14" [attr.stroke-dasharray]="seg.dasharray" [attr.stroke-dashoffset]="seg.dashoffset" />
                }
                <text x="60" y="57" text-anchor="middle" font-size="10" fill="#6b7872">Total</text>
                <text x="60" y="72" text-anchor="middle" font-size="12" font-weight="600" fill="#14201c">TZS {{ donutTotal() }}</text>
              </g>
            </svg>
            <div class="dlegend">
              @for (seg of donutSegments(); track seg.label) {
                <div class="row"><i [style.background]="seg.color"></i><span class="n">{{ seg.label }}</span><span class="v">{{ seg.v }}</span><span class="p">{{ seg.pct }}%</span></div>
              }
            </div>
          </div>
        </section>
      </div>

      <div class="grid-2">
        <section class="panel">
          <div class="panel-head">
            <h2>Risk snapshot · PAR buckets</h2>
            <span class="sub">arrears by days past due</span>
            <span class="right">PAR {{ p().par.toFixed(1) }}%</span>
          </div>
          <div class="buckets">
            @for (b of buckets(); track b.label) {
              <div class="bucket">
                <span class="n">{{ b.label }}</span>
                <span class="track"><i [style.width.%]="b.trackPct" [style.background]="b.color"></i></span>
                <span class="c">{{ b.count }}</span>
                <span class="amt">{{ compact(b.amount) }}</span>
              </div>
            }
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Recent activity</h2><span class="right">{{ activity().length }} entries</span></div>
          <div class="activity">
            @for (t of activity(); track t.when) {
              <div class="act">
                <span class="ini">{{ t.initials }}</span>
                <div><div class="who">{{ t.who }}</div><div class="what">{{ t.what }}</div></div>
                <div class="amt" [class.dr]="t.type==='Deposit'" [class.cr]="t.type!=='Deposit'">{{ t.sign }}{{ moneyFormat(t.amount) }}</div>
                <div class="when">{{ t.when }}</div>
              </div>
            }
          </div>
        </section>
      </div>
    }

    @if (activeTab() === 'members') {
      <section class="kpis">
        <div class="kpi">
          <div class="top"><div style="min-width:0"><div class="label">Total members</div></div></div>
          <div class="value">{{ p().members }}</div>
          <div class="foot"><span class="muted">{{ p().active }} active</span></div>
        </div>
        <div class="kpi">
          <div class="top"><div style="min-width:0"><div class="label">New this month</div></div></div>
          <div class="value">0</div>
          <div class="foot"><span class="muted">October 2026</span></div>
        </div>
        <div class="kpi">
          <div class="top"><div style="min-width:0"><div class="label">KYC pending</div></div></div>
          <div class="value">{{ p().kycPending }}</div>
          <div class="foot"><span class="muted">awaiting documents</span></div>
        </div>
        <div class="kpi">
          <div class="top"><div style="min-width:0"><div class="label">Member savings</div></div></div>
          <div class="value">TZS {{ compact(p().savings) }}</div>
          <div class="foot"><span class="muted">across all branches</span></div>
        </div>
      </section>
      <div class="grid-2">
        <section class="panel">
          <div class="panel-head"><h2>New members</h2><span class="sub">last 6 months</span></div>
          <div class="chart">
            <div class="bars">
              @for (label of flow.labels; track label; let i = $index) {
                <div class="bar-col">
                  <div class="bar-pair">
                    <div class="bar in" [style.height.%]="barPct(0)" [attr.title]="'0 joined'"></div>
                  </div>
                  <div class="m">{{ label }}</div>
                </div>
              }
            </div>
            <div class="bar-axis"><span>0</span><span>0 members</span></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>By branch</h2></div>
          <table>
            <thead>
              <tr><th>Branch</th><th class="num">Members</th><th class="num">Savings</th><th class="num">Loans</th></tr>
            </thead>
            <tbody>
              @for (b of byBranch(); track b.branch) {
                <tr><td>{{ b.branch }}</td><td class="num">{{ b.count }}</td><td class="num money">{{ compact(b.savings) }}</td><td class="num money">{{ compact(b.loans) }}</td></tr>
              }
            </tbody>
          </table>
        </section>
      </div>
    }

    @if (activeTab() === 'loans') {
      <section class="kpis">
        <div class="kpi">
          <div class="top"><div style="min-width:0"><div class="label">Outstanding principal</div></div></div>
          <div class="value">TZS {{ compact(p().outstanding) }}</div>
          <div class="foot"><span class="muted">{{ p().active }} active loans</span></div>
        </div>
        <div class="kpi">
          <div class="top"><div style="min-width:0"><div class="label">Principal in arrears</div></div></div>
          <div class="value">TZS {{ compact(p().arrears) }}</div>
          <div class="foot"><span class="muted">overdue installments</span></div>
        </div>
        <div class="kpi">
          <div class="top"><div style="min-width:0"><div class="label">Clients in arrears</div></div></div>
          <div class="value">{{ p().clientsInArrears }}</div>
          <div class="foot"><span class="muted">of borrowers</span></div>
        </div>
        <div class="kpi">
          <div class="top"><div style="min-width:0"><div class="label">Portfolio at risk</div></div></div>
          <div class="value">{{ p().par.toFixed(1) }}%</div>
          <div class="foot"><span class="muted">arrears ÷ principal</span></div>
        </div>
      </section>
    }
  `,
})
export class DashboardComponent {
  private membersService = inject(MembersService);

  protected readonly tabs: [string, string][] = [
    ['overview', 'Overview'],
    ['members', 'Members'],
    ['loans', 'Loans'],
  ];
  protected activeTab = signal('overview');

  // expose module helpers to the template
  protected readonly compact = compact;

  members = signal<Member[]>([]);
  loading = signal(true);

  protected p = computed(() => {
    const all = this.members();
    const savings = all.reduce((t, m) => t + m.savings, 0);
    const outstanding = all.reduce((t, m) => t + (m.loanBalance || 0), 0);
    const active = all.filter((m) => m.status === 'Active').length;
    return {
      members: all.length,
      active,
      outstanding,
      savings,
      shares: Math.round(savings * 0.12),
      arrears: 0,
      par: 0,
      clientsInArrears: 0,
      kycPending: all.filter((m) => m.kyc === 'Pending').length,
    };
  });

  protected readonly flow = {
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    in: [1200000, 950000, 1400000, 1100000, 1600000, 1300000],
    out: [700000, 600000, 800000, 500000, 900000, 750000],
  };

  protected flowMax = computed(() => Math.max(1, ...this.flow.in, ...this.flow.out));

  protected barPct = (v: number) => Math.max(2, (v / this.flowMax()) * 100);

  protected donutSegments = computed(() => {
    const p = this.p();
    const segs = [
      { label: 'Savings', value: p.savings, color: '#0f4c3a' },
      { label: 'Shares', value: p.shares, color: '#7fa89a' },
      { label: 'Loan principal', value: p.outstanding, color: '#c9a25c' },
    ];
    const total = segs.reduce((t, s) => t + s.value, 0) || 1;
    const c = DONUT_C;
    let offset = 0;
    return segs.map((s) => {
      const length = (s.value / total) * c;
      const r = {
        ...s,
        dasharray: Math.max(0, length - 3) + ' ' + (c - Math.max(0, length - 3)),
        dashoffset: -offset,
        pct: ((s.value / total) * 100).toFixed(0),
        v: compact(s.value),
      };
      offset += length;
      return r;
    });
  });

  protected donutTotal = computed(() => compact(this.p().savings + this.p().shares + this.p().outstanding));

  protected readonly buckets = () => {
    const maxAmt = 2500000;
    return [
      { label: 'Current', count: 6, amount: 12000000, color: '#0f4c3a', trackPct: 100 },
      { label: '1–30 days', count: 2, amount: 1800000, color: '#b98a2e', trackPct: 15 },
      { label: '31–60 days', count: 1, amount: 600000, color: '#c9a25c', trackPct: 5 },
      { label: '60+ days', count: 1, amount: 400000, color: '#bf5443', trackPct: 3 },
    ];
  };

  protected readonly activity = () => [
    { initials: 'NM', who: 'Neema Kilonzo', what: 'Deposit · Mobile · SAV-0001', type: 'Deposit', amount: 250000, sign: '+', when: 'Oct 22' },
    { initials: 'BM', who: 'Baraka Mushi', what: 'Withdrawal · Cash · SAV-0002', type: 'Withdrawal', amount: 120000, sign: '−', when: 'Oct 21' },
    { initials: 'AM', who: 'Asha Mwakyusa', what: 'Deposit · Mobile · SAV-0003', type: 'Deposit', amount: 150000, sign: '+', when: 'Oct 20' },
    { initials: 'JM', who: 'Joseph Mrema', what: 'Loan payment · Cash · LN-0042', type: 'Payment', amount: 300000, sign: '−', when: 'Oct 19' },
    { initials: 'FS', who: 'Fatuma Suleiman', what: 'Deposit · Mobile · SAV-0005', type: 'Deposit', amount: 500000, sign: '+', when: 'Oct 18' },
    { initials: 'DM', who: 'Daniel Mwansasu', what: 'Withdrawal · Cash · SAV-0006', type: 'Withdrawal', amount: 30000, sign: '−', when: 'Oct 17' },
  ];

  protected readonly byBranch = computed(() => {
    const all = this.members();
    const byBranch = new Map<string, { branch: string; count: number; savings: number; loans: number }>();
    for (const m of all) {
      const b = byBranch.get(m.branch) ?? { branch: m.branch, count: 0, savings: 0, loans: 0 };
      b.count++;
      b.savings += m.savings;
      b.loans += m.loanBalance || 0;
      byBranch.set(m.branch, b);
    }
    return [...byBranch.values()];
  });

  protected joinsPct = () => 0;

  protected readonly moneyFormat = (n: number) => money.format(n);

  constructor() {
    this.membersService.list().subscribe({
      next: (rows: Member[]) => {
        this.members.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.members.set([]);
        this.loading.set(false);
      },
    });
  }
}
