import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MembersListComponent } from './features/members/members-list/members-list.component';
import { SavingsSharesComponent } from './features/savings-shares/savings-shares.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ChartOfAccountsComponent } from './features/accounting/chart-of-accounts/chart-of-accounts.component';
import { JournalEntriesComponent } from './features/accounting/journal-entries/journal-entries.component';
import { TrialBalanceComponent } from './features/accounting/trial-balance/trial-balance.component';
import { ClientListComponent } from './features/members/client-list/client-list.component';
import { SavingsAccountsComponent } from './features/savings/savings-accounts/savings-accounts.component';
import { LoanApplicationsComponent } from './features/loans/loan-applications/loan-applications.component';
import { LoanAccountsComponent } from './features/loans/loan-accounts/loan-accounts.component';
import { TellerConsoleComponent } from './features/teller/teller-console/teller-console.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { RequestsComponent } from './features/requests/requests.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'members', component: MembersListComponent, canActivate: [authGuard] },
  { path: 'clients', component: ClientListComponent, canActivate: [authGuard] },
  { path: 'savings-shares', component: SavingsSharesComponent, canActivate: [authGuard] },
  { path: 'savings', component: SavingsSharesComponent, canActivate: [authGuard] },
  { path: 'savings-accounts', component: SavingsAccountsComponent, canActivate: [authGuard] },
  { path: 'loan-applications', component: LoanApplicationsComponent, canActivate: [authGuard] },
  { path: 'loan-accounts', component: LoanAccountsComponent, canActivate: [authGuard] },
  { path: 'teller', component: TellerConsoleComponent, canActivate: [authGuard] },
  { path: 'transactions', component: TransactionsComponent, canActivate: [authGuard] },
  { path: 'requests', component: RequestsComponent, canActivate: [authGuard] },
  { path: 'chart-of-accounts', component: ChartOfAccountsComponent, canActivate: [authGuard] },
  { path: 'journal-entries', component: JournalEntriesComponent, canActivate: [authGuard] },
  { path: 'trial-balance', component: TrialBalanceComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/dashboard' },
];
