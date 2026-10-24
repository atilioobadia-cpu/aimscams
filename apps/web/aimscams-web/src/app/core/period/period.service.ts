import { Injectable, signal } from '@angular/core';

export interface Period {
  id: string;
  code: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'CLOSED' | 'LOCKED';
  isCurrent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PeriodService {
  private periods = signal<Period[]>([
    { id: 'p-2026', code: 'FY2026', startDate: '2026-01-01', endDate: '2026-12-31', status: 'OPEN', isCurrent: true },
    { id: 'p-2025', code: 'FY2025', startDate: '2025-01-01', endDate: '2025-12-31', status: 'CLOSED', isCurrent: false }
  ]);
  
  currentPeriod = signal<Period>(this.periods().find(p => p.isCurrent)!);
  
  periods$ = this.periods.asReadonly();
  
  canPost(): boolean {
    return this.currentPeriod().status === 'OPEN';
  }
  
  isPeriodClosed(): boolean {
    return this.currentPeriod().status !== 'OPEN';
  }
}
