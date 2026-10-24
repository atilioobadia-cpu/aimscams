import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DrawerService } from '../../../../app/core/services/drawer.service';

export interface NavChild {
  id: string;
  label: string;
  href?: string;
  soon?: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  soon?: boolean;
  children?: NavChild[];
}

export const NAVICONS: Record<string, string> = {
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><path d="M16 13h2"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v7H2v-7L5.5 5Z"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M15 9.5c0-1-1.3-1.5-3-1.5s-3 .5-3 1.5 1.3 1.5 3 1.5 3 .5 3 1.5-1.3 1.5-3 1.5-3-.5-3-1.5"/></svg>',
  swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h13l-3-3"/><path d="M20 17H7l3 3"/></svg>',
  cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m3 11 18-5v12L3 14v-3Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 9 6 6 6-6"/></svg>',
};

export const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'grid' },
  { id: 'members', label: 'Members', href: '/clients', icon: 'users' },
  { id: 'accounts', label: 'Accounts', href: '/savings-accounts', icon: 'wallet' },
  { id: 'applications', label: 'Applications', href: '/loan-applications', icon: 'inbox' },
  { id: 'loans', label: 'Loans', href: '/loan-accounts', icon: 'file' },
  { id: 'savings', label: 'Savings & Shares', href: '/savings-shares', icon: 'coin' },
  { id: 'transactions', label: 'Transactions', href: '/transactions', icon: 'swap' },
  { id: 'teller', label: 'Teller', href: '/teller', icon: 'cash' },
  { id: 'accounting', label: 'Accounting', icon: 'book', children: [
    { id: 'chart-of-accounts', label: 'Chart of accounts', href: '/chart-of-accounts' },
    { id: 'journal', label: 'Journal', href: '/journal-entries' },
    { id: 'trial-balance', label: 'Trial balance', href: '/trial-balance' },
  ] },
  { id: 'requests', label: 'Requests', href: '/requests', icon: 'bell' },
  { id: 'messages', label: 'Messages', soon: true, icon: 'message' },
  { id: 'campaigns', label: 'Campaigns', icon: 'megaphone', children: [
    { id: 'run-campaign', label: 'Run Campaign', soon: true },
    { id: 'active-campaigns', label: 'Active Campaigns', soon: true },
  ] },
  { id: 'reports', label: 'Reports', icon: 'chart', children: [
    { id: 'rep-loan', label: 'Loan', soon: true },
    { id: 'rep-savings', label: 'Savings', soon: true },
    { id: 'rep-tx', label: 'Transactions', soon: true },
    { id: 'rep-client', label: 'Client', soon: true },
    { id: 'rep-msp', label: 'MSP', soon: true },
    { id: 'rep-statement', label: 'Statement', soon: true },
  ] },
  { id: 'import', label: 'Import', icon: 'upload', children: [
    { id: 'imp-member', label: 'Member', soon: true },
    { id: 'imp-account', label: 'Account', soon: true },
    { id: 'imp-transaction', label: 'Transaction', soon: true },
  ] },
  { id: 'business', label: 'Business Account', soon: true, icon: 'briefcase' },
  { id: 'settings', label: 'Settings', icon: 'gear', children: [
    { id: 'gen', label: 'General', soon: true },
    { id: 'acc-settings', label: 'Accounting', soon: true },
    { id: 'branches', label: 'Branches', soon: true },
    { id: 'products', label: 'Products', soon: true },
    { id: 'policies', label: 'Policies', soon: true },
    { id: 'users', label: 'Users', soon: true },
    { id: 'roles', label: 'Roles', soon: true },
    { id: 'services', label: 'Services', soon: true },
  ] },
];

/** Route path -> nav item id, so the rail highlights the right row on any URL. */
const ROUTE_TO_NAV: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/clients': 'members',
  '/members': 'members',
  '/savings-accounts': 'accounts',
  '/loan-applications': 'applications',
  '/loan-accounts': 'loans',
  '/savings-shares': 'savings',
  '/savings': 'savings',
  '/transactions': 'transactions',
  '/teller': 'teller',
  '/chart-of-accounts': 'chart-of-accounts',
  '/journal-entries': 'journal',
  '/trial-balance': 'trial-balance',
  '/requests': 'requests',
};

/** Groups that must be expanded for a child route to be visible. */
const CHILD_TO_GROUP: Record<string, string> = {
  'chart-of-accounts': 'accounting',
  journal: 'accounting',
  'trial-balance': 'accounting',
};

import { SafeHtmlPipe } from '../../../../app/shared/pipes/safe-html.pipe';

@Component({
  selector: 'aims-sidebar',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  host: { '(window:resize)': 'onResize()' },
})
export class SidebarComponent implements AfterViewInit {
  private router = inject(Router);

  /** Emitted when the user clicks a nav item. Payload is the item id. */
  readonly navItemClick = output<string>();

  @ViewChild('navEl') navEl!: ElementRef<HTMLElement>;
  @ViewChild('pillEl') pillEl!: ElementRef<HTMLElement>;
  @ViewChild('ghostEl') ghostEl!: ElementRef<HTMLElement>;

  readonly NAV = NAV;
  readonly NAVICONS = NAVICONS;

  // Internal state (self-managed, mirrors the prototype's module-level state)
  protected collapsed = signal(
    localStorage.getItem('aimscams.rail.collapsed') === '1',
  );
  protected navActive = signal<string>('dashboard');
  protected openGroups = signal<Set<string>>(new Set());
  protected open = signal(false);

  protected pillShown = signal(false);
  protected ghostShown = signal(false);
  protected pillKey = signal<string>('');
  protected pillStyle = signal<{ top: number; height: number } | null>(null);
  protected ghostStyle = signal<{ top: number; height: number } | null>(null);

  /** Mobile drawer bus (scrim + rail.open live in this component's DOM). */
  protected readonly drawer: DrawerService = inject(DrawerService);

  iconOf(key: string | undefined) {
    return NAVICONS[key ?? ''];
  }

  private pillTimer = 0;

  constructor() {
    // Mobile drawer bus: the topbar menu button asks the sidebar to open/close.
    this.drawer.toggle$.subscribe(() => this.open.update((o) => !o));

    // Recompute pill geometry whenever the active item or open groups change.
    // DOM updates from signal bindings commit before effects run, so rects are current.
    effect(() => {
      this.navActive();
      this.openGroups();
      this.movePill(false);
    });
    
    // Sync active state with the current route, and auto-expand the parent group
    // when the matched item is a child (so the active child is actually visible).
    const syncFromUrl = () => {
      const path = this.router.url.split('?')[0].split('#')[0];
      const id = ROUTE_TO_NAV[path];
      if (!id) return;
      this.navActive.set(id);
      const group = CHILD_TO_GROUP[id];
      if (group) {
        this.openGroups.update((groups) => {
          if (groups.has(group)) return groups;
          const next = new Set(groups);
          next.add(group);
          return next;
        });
      }
    };

    // Run once at startup so a refresh on a deep link highlights the right row.
    syncFromUrl();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(syncFromUrl);
  }

  ngAfterViewInit() {
    // Mirror the prototype: persist collapsed state on <body> so the CSS
    // `body.rail-collapsed .rail` selector applies exactly as in the prototype.
    try {
      if (localStorage.getItem('aimscams.rail.collapsed') === '1') {
        document.body.classList.add('rail-collapsed');
        this.collapsed.set(true);
      }
    } catch {
      /* storage unavailable — ignore */
    }
    this.movePill(true);
  }

  onResize() {
    // On resize the row positions can shift (e.g. wrap). Re-place without animation.
    this.movePill(true);
  }

  toggleGroup(id: string) {
    this.openGroups.update((groups) => {
      const next = new Set(groups);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    this.movePill(true);
  }

  toggleCollapsed() {
    const next = !this.collapsed();
    this.collapsed.set(next);
    document.body.classList.toggle('rail-collapsed', next);
    try {
      localStorage.setItem('aimscams.rail.collapsed', next ? '1' : '0');
    } catch {
      /* storage unavailable — ignore */
    }
    this.movePill(false);
  }

  /** Click handler for top-level nav items (non-soon). Sets active state immediately. */
  onNavItemClick(event: MouseEvent, id: string, href: string | null, soon?: boolean) {
    if (soon) {
      event.preventDefault();
      return;
    }
    // Set active state instantly for responsive UI
    this.navActive.set(id);
    this.movePill(false);
    // Browser will follow href naturally
  }

  /** Click handler for child nav items. */
  onNavChildClick(event: MouseEvent, id: string, href: string | null, soon?: boolean) {
    if (soon) {
      event.preventDefault();
      return;
    }
    this.navActive.set(id);
    this.movePill(false);
  }

  /* ---------------- pill geometry (ported from prototype) ---------------- */

  private movePill(instant: boolean) {
    const nav = this.navEl?.nativeElement;
    const pill = this.pillEl?.nativeElement;
    const ghost = this.ghostEl?.nativeElement;
    if (!pill || !nav) return;

    const active = nav.querySelector('.nav-item.active, .nav-child.active');
    const hideAll = () => {
      pill.classList.remove('show');
      if (ghost) ghost.classList.remove('show');
      this.pillShown.set(false);
      this.ghostShown.set(false);
    };
    if (!active) {
      hideAll();
      return;
    }
    const group = active.closest('.nav-children');
    if (group && !group.classList.contains('open')) {
      hideAll();
      return;
    }

    const rect = active.getBoundingClientRect();
    if (rect.height < 6) {
      hideAll();
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const top = rect.top - navRect.top + nav.scrollTop;
    const height = rect.height;
    const key = top.toFixed(1) + ':' + height.toFixed(1);

    const setGeom = (el: HTMLElement) => {
      el.style.transition = 'none';
      el.style.height = height + 'px';
      el.style.transform = `translateY(${top}px)`;
    };

    if (instant) {
      if (ghost) {
        ghost.classList.remove('show');
        this.ghostShown.set(false);
      }
      setGeom(pill);
      this.pillStyle.set({ top, height });
      pill.classList.add('show');
      this.pillShown.set(true);
      this.pillKey.set(key);
      void pill.offsetHeight;
      pill.style.transition = '';
      return;
    }

    const same = this.pillKey() === key;
    const wasShown = this.pillShown();
    if (same) {
      if (!wasShown) {
        setGeom(pill);
        this.pillStyle.set({ top, height });
        pill.classList.add('show');
        this.pillShown.set(true);
        void pill.offsetHeight;
        pill.style.transition = '';
      }
      this.pillKey.set(key);
      return;
    }

    const op = parseFloat(getComputedStyle(pill).opacity) || 0;
    const doHandoff = wasShown && op > 0.25 && ghost;

    // Ghost takes over the old visual so nothing is ever un-highlighted.
    if (doHandoff) {
      ghost.style.transition = 'none';
      ghost.style.height = pill.style.height;
      ghost.style.transform = pill.style.transform;
      ghost.classList.add('show');
      this.ghostShown.set(true);
      this.ghostStyle.set({
        top: parseFloat(pill.style.transform.match(/translateY\(([\d.]+)/)?.[1] ?? '0'),
        height: parseFloat(pill.style.height) || 0,
      });
      void ghost.offsetHeight;
      ghost.style.transition = '';
    }

    // Move the real pill to the new row while invisible.
    pill.style.transition = 'none';
    pill.classList.remove('show');
    this.pillShown.set(false);
    setGeom(pill);
    void pill.offsetHeight;
    pill.style.transition = '';
    this.pillKey.set(key);
    this.pillStyle.set({ top, height });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        pill.classList.add('show');
        this.pillShown.set(true);
        if (doHandoff && ghost) {
          ghost.classList.remove('show');
          this.ghostShown.set(false);
        }
      });
    });
  }
}
