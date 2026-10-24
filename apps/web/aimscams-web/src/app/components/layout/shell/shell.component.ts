import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

const LABELS: Record<string, string> = {
  dashboard: 'Overview',
  members: 'Members',
  savings: 'Savings & Shares',
  'savings-shares': 'Savings & Shares',
  accounting: 'Accounting',
  reports: 'Reports',
  settings: 'Settings',
};

@Component({
  selector: 'aims-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  private router = inject(Router);
  protected breadcrumb = 'Overview';

  onNavItem(id: string): void {
    const href: Record<string, string> = {
      dashboard: '/dashboard',
      members: '/members',
      savings: '/savings-shares',
      'savings-shares': '/savings-shares',
      accounting: '/accounting',
      reports: '/reports',
      settings: '/settings',
    };
    if (href[id]) {
      this.breadcrumb = LABELS[id] ?? id;
      this.router.navigateByUrl(href[id]);
    }
  }
}
