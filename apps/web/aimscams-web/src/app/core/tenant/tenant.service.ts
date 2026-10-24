import { Injectable, signal } from '@angular/core';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  branchId: string;
  branchName: string;
  currency: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private currentTenant = signal<Tenant>({
    id: 't-001',
    name: 'MFSL MFI',
    code: '101457',
    branchId: 'b-001',
    branchName: 'Head office',
    currency: 'TZS'
  });
  
  tenant = this.currentTenant.asReadonly();
  
  setBranch(branchId: string, branchName: string): void {
    this.currentTenant.update(t => ({ ...t, branchId, branchName }));
  }
}
