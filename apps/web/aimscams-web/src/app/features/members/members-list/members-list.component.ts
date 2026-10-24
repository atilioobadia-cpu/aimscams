import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MembersService } from '../../../../app/core/services/members.service';
import { Member } from '../../../../app/core/models/member';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'TZS',
  minimumFractionDigits: 0,
});

const initials = (m: Member) => m.first[0] + m.last[0];

@Component({
  selector: 'aims-members-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './members-list.component.html',
  styleUrls: ['./members-list.component.scss'],
})
export class MembersListComponent {
  private membersService = inject(MembersService);

  members = signal<Member[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  query = signal('');
  branch = signal('All branches');
  status = signal('All statuses');
  page = signal(1);
  readonly pageSize = 20;

  branches = computed(() => {
    const set = new Set<string>(['All branches']);
    this.members().forEach((m) => set.add(m.branch));
    return [...set];
  });

  filtered = computed(() => {
    const q = this.query().toLowerCase();
    return this.members().filter(
      (m) =>
        (this.branch() === 'All branches' || m.branch === this.branch()) &&
        (this.status() === 'All statuses' || m.status === this.status()) &&
        (!q ||
          (m.first + ' ' + m.last + ' ' + m.id + ' ' + m.memberNo + ' ' + m.phone)
            .toLowerCase()
            .includes(q)),
    );
  });

  pages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  pageRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  readonly formatMoney = (n: number) => money.format(n);
  readonly initialsOf = initials;
  readonly Math = Math;
  readonly statusOptions = ['All statuses', 'Active', 'Dormant'];

  constructor() {
    this.load();
    effect(() => {
      if (this.page() > this.pages()) this.page.set(1);
    });
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.membersService.list().subscribe({
      next: (rows: Member[]) => {
        this.members.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load members.');
        this.loading.set(false);
      },
    });
  }

  onSearch(value: string) {
    this.query.set(value.trim().toLowerCase());
    this.page.set(1);
  }

  onBranch(value: string) {
    this.branch.set(value);
    this.page.set(1);
  }

  onStatus(value: string) {
    this.status.set(value);
    this.page.set(1);
  }

  prev() {
    if (this.page() > 1) this.page.update((p) => p - 1);
  }

  next() {
    if (this.page() < this.pages()) this.page.update((p) => p + 1);
  }

  activeCount = computed(() => this.members().filter((m) => m.status === 'Active').length);
}
