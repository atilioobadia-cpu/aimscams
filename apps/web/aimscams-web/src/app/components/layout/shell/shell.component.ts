import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { DrawerService } from '../../../../app/core/services/drawer.service';

const LABELS: Record<string, string> = {
  dashboard: 'Overview',
  members: 'Members',
  accounts: 'Accounts',
  applications: 'Applications',
  loans: 'Loans',
  savings: 'Savings & Shares',
  'savings-shares': 'Savings & Shares',
  transactions: 'Transactions',
  teller: 'Teller',
  accounting: 'Accounting',
  requests: 'Requests',
  reports: 'Reports',
  settings: 'Settings',
};

const ROUTE_TO_NAV: Record<string, string> = {
  '/': 'dashboard',
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

@Component({
  selector: 'aims-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  private router = inject(Router);
  protected readonly drawer = inject(DrawerService);
  
  protected breadcrumb = signal('Overview');
  protected branch = signal('Head office');
  protected branchStatus = signal('Open');
  protected navActive = signal<string>('');
  protected sidebarCollapsed = signal(false);

  constructor() {
    // Sync breadcrumb and branch from route
    const syncFromUrl = () => {
      const path = this.router.url.split('?')[0].split('#')[0];
      const id = ROUTE_TO_NAV[path];
      if (id) {
        this.breadcrumb.set(LABELS[id] ?? 'Overview');
        this.navActive.set(id);
      }
    };
    syncFromUrl();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(syncFromUrl);
  }

  protected currentYear = new Date().getFullYear();

  protected onNavItemClick(id: string): void {
    // The sidebar handles navigation via href, just update breadcrumb
    const pathMap: Record<string, string> = {
      dashboard: '/dashboard',
      members: '/clients',
      accounts: '/savings-accounts',
      applications: '/loan-applications',
      loans: '/loan-accounts',
      savings: '/savings-shares',
      'savings-shares': '/savings-shares',
      transactions: '/transactions',
      teller: '/teller',
      requests: '/requests',
      accounting: '/chart-of-accounts',
      reports: '/reports',
      settings: '/settings',
    };
    if (pathMap[id]) {
      this.breadcrumb.set(LABELS[id] ?? 'Overview');
    }
  }
}