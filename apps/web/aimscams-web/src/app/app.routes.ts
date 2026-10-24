import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MembersListComponent } from './features/members/members-list/members-list.component';
import { SavingsSharesComponent } from './features/savings-shares/savings-shares.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ChartOfAccountsComponent } from './features/accounting/chart-of-accounts/chart-of-accounts.component';
import { JournalEntriesComponent } from './features/accounting/journal-entries/journal-entries.component';
import { TrialBalanceComponent } from './features/accounting/trial-balance/trial-balance.component';
import { ClientListComponent } from './features/members/client-list/client-list.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full', canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'members', component: MembersListComponent, canActivate: [authGuard] },
  { path: 'clients', component: ClientListComponent, canActivate: [authGuard] },
  { path: 'savings-shares', component: SavingsSharesComponent, canActivate: [authGuard] },
  { path: 'savings', component: SavingsSharesComponent, canActivate: [authGuard] },
  { path: 'chart-of-accounts', component: ChartOfAccountsComponent, canActivate: [authGuard] },
  { path: 'journal-entries', component: JournalEntriesComponent, canActivate: [authGuard] },
  { path: 'trial-balance', component: TrialBalanceComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/dashboard' },
];
