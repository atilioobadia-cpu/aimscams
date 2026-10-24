import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Member, MemberSummary } from '../models/member';

/**
 * Mock member service.
 *
 * Temporary stand-in until the real data layer (PGlite / ledger) is wired up
 * in a later step. All data is synthetic — no observed tenant records.
 */
const MEMBERS: Member[] = [
  { id: 'm-001', memberNo: '1001', first: 'Grace', last: 'Mwakipesile', phone: '+255 712 345 678', branch: 'Head office', kyc: 'Verified', status: 'Active', savings: 1_250_000, shares: 200_000, loanBalance: 0, joined: '2026-01-15' },
  { id: 'm-002', memberNo: '1002', first: 'Emmanuel', last: 'Chirwa', phone: '+255 754 102 330', branch: 'Head office', kyc: 'Verified', status: 'Active', savings: 840_000, shares: 150_000, loanBalance: 450_000, joined: '2026-01-20' },
  { id: 'm-003', memberNo: '1003', first: 'Hadija', last: 'Nambuya', phone: '+255 767 901 221', branch: 'Mbeya', kyc: 'Pending', status: 'Active', savings: 310_000, shares: 50_000, loanBalance: 0, joined: '2026-02-03' },
  { id: 'm-004', memberNo: '1004', first: 'Juma', last: 'Omary', phone: '+255 719 555 012', branch: 'Arusha', kyc: 'Verified', status: 'Active', savings: 2_100_000, shares: 100_000, loanBalance: 0, joined: '2026-02-10' },
  { id: 'm-005', memberNo: '1005', first: 'Neema', last: 'Sanga', phone: '+255 755 888 441', branch: 'Mwanza', kyc: 'Verified', status: 'Active', savings: 670_000, shares: 400_000, loanBalance: 120_000, joined: '2026-03-01' },
  { id: 'm-006', memberNo: '1006', first: 'Imani', last: 'Rwezaula', phone: '+255 782 111 909', branch: 'Mbeya', kyc: 'Pending', status: 'Active', savings: 190_000, shares: 0, loanBalance: 0, joined: '2026-03-12' },
  { id: 'm-007', memberNo: '1007', first: 'Khalifa', last: 'Hassan', phone: '+255 713 222 333', branch: 'Arusha', kyc: 'Verified', status: 'Dormant', savings: 45_000, shares: 100_000, loanBalance: 0, joined: '2026-03-18' },
  { id: 'm-008', memberNo: '1008', first: 'Zawadi', last: 'Kalunde', phone: '+255 769 777 888', branch: 'Mwanza', kyc: 'Verified', status: 'Active', savings: 980_000, shares: 75_000, loanBalance: 300_000, joined: '2026-04-02' },
  { id: 'm-009', memberNo: '1009', first: 'Saidi', last: 'Jumanne', phone: '+255 751 000 111', branch: 'Head office', kyc: 'Verified', status: 'Active', savings: 1_560_000, shares: 250_000, loanBalance: 0, joined: '2026-04-10' },
  { id: 'm-010', memberNo: '1010', first: 'Fatuma', last: 'Ilyas', phone: '+255 788 444 555', branch: 'Arusha', kyc: 'Pending', status: 'Active', savings: 260_000, shares: 0, loanBalance: 0, joined: '2026-04-22' },
];

const DELAY_MS = 350;

@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly members = signal<Member[]>(MEMBERS);

  list(): Observable<Member[]> {
    return of([...this.members()]).pipe(delay(DELAY_MS)) as Observable<Member[]>;
  }

  get(id: string): Observable<Member | undefined> {
    return of(this.members().find((m) => m.id === id)).pipe(delay(DELAY_MS)) as Observable<Member | undefined>;
  }

  summary(): Observable<MemberSummary> {
    const all = this.members();
    return of({
      totalMembers: all.length,
      activeMembers: all.filter((m) => m.status === 'Active').length,
      pendingKyc: all.filter((m) => m.kyc === 'Pending').length,
      totalSavings: all.reduce((t, m) => t + m.savings, 0),
    }).pipe(delay(DELAY_MS));
  }
}
