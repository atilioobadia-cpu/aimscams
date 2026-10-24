import { Injectable } from '@angular/core';

export interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  ipAddress?: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private events: AuditEvent[] = [];
  
  log(entityType: string, entityId: string, action: string, details?: any): void {
    const event: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityType,
      entityId,
      action,
      userId: 'u-001',
      userName: 'FRANKO SANGA EKSAUDI',
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
      details
    };
    this.events.push(event);
    console.log('[AUDIT]', event);
  }
  
  getEvents(entityType?: string, entityId?: string): AuditEvent[] {
    let result = this.events;
    if (entityType) result = result.filter(e => e.entityType === entityType);
    if (entityId) result = result.filter(e => e.entityId === entityId);
    return result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}
