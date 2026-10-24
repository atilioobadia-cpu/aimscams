import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type Permission = 
  | 'MEMBER:READ' | 'MEMBER:CREATE' | 'MEMBER:UPDATE' | 'MEMBER:DELETE'
  | 'LOAN:READ' | 'LOAN:CREATE' | 'LOAN:APPROVE' | 'LOAN:DISBURSE'
  | 'SAVINGS:READ' | 'SAVINGS:DEPOSIT' | 'SAVINGS:WITHDRAW'
  | 'TELLER:OPEN' | 'TELLER:CLOSE' | 'TELLER:APPROVE'
  | 'ACCOUNTING:READ' | 'ACCOUNTING:POST' | 'ACCOUNTING:CLOSE'
  | 'REPORT:READ' | 'REPORT:EXPORT'
  | 'ADMIN:USER' | 'ADMIN:ROLE' | 'ADMIN:CONFIG';

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

@Injectable({
  providedIn: 'root'
})
export class RbacService {
  private auth = inject(AuthService);
  
  private roles: Role[] = [
    { id: 'ADMIN', name: 'System Administrator', permissions: ['*' as Permission] },
    { id: 'BRANCH_MANAGER', name: 'Branch Manager', permissions: [
      'MEMBER:READ', 'MEMBER:CREATE', 'MEMBER:UPDATE',
      'LOAN:READ', 'LOAN:CREATE', 'LOAN:APPROVE',
      'SAVINGS:READ', 'SAVINGS:DEPOSIT', 'SAVINGS:WITHDRAW',
      'TELLER:OPEN', 'TELLER:CLOSE', 'TELLER:APPROVE',
      'REPORT:READ', 'REPORT:EXPORT'
    ]},
    { id: 'LOAN_OFFICER', name: 'Loan Officer', permissions: [
      'MEMBER:READ', 'MEMBER:CREATE', 'MEMBER:UPDATE',
      'LOAN:READ', 'LOAN:CREATE', 'LOAN:APPROVE',
      'REPORT:READ'
    ]},
    { id: 'TELLER', name: 'Teller', permissions: [
      'MEMBER:READ',
      'SAVINGS:READ', 'SAVINGS:DEPOSIT', 'SAVINGS:WITHDRAW',
      'TELLER:OPEN', 'TELLER:CLOSE',
      'REPORT:READ'
    ]},
    { id: 'ACCOUNTANT', name: 'Accountant', permissions: [
      'ACCOUNTING:READ', 'ACCOUNTING:POST', 'ACCOUNTING:CLOSE',
      'REPORT:READ', 'REPORT:EXPORT'
    ]},
    { id: 'CASHIER', name: 'Cashier', permissions: [
      'SAVINGS:READ', 'SAVINGS:DEPOSIT', 'SAVINGS:WITHDRAW',
      'TELLER:OPEN'
    ]},
    { id: 'AUDITOR', name: 'Internal Auditor', permissions: [
      'MEMBER:READ', 'LOAN:READ', 'SAVINGS:READ',
      'ACCOUNTING:READ', 'REPORT:READ', 'REPORT:EXPORT'
    ]}
  ];
  
  hasPermission(permission: Permission): boolean {
    const user = this.auth.user();
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  }
  
  getUserRole(): Role | undefined {
    const user = this.auth.user();
    if (!user) return undefined;
    return this.roles.find(r => r.id === user.role);
  }
  
  getAllRoles(): Role[] {
    return this.roles;
  }
}
