import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, delay } from 'rxjs';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
  branchId: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  
  private currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  
  user = this.currentUser.asReadonly();
  
  login(email: string, password: string): Observable<boolean> {
    // Mock login - will be replaced with real OIDC
    const mockUser: User = {
      id: 'u-001',
      email: email,
      fullName: 'FRANKO SANGA EKSAUDI',
      role: 'ADMIN',
      tenantId: 't-001',
      branchId: 'b-001',
      permissions: ['*']
    };
    
    this.currentUser.set(mockUser);
    this.isAuthenticated.set(true);
    localStorage.setItem('aimscams_user', JSON.stringify(mockUser));
    
    return of(true).pipe(delay(300));
  }
  
  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('aimscams_user');
    this.router.navigate(['/login']);
  }
  
  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  }
  
  checkAuth(): void {
    const stored = localStorage.getItem('aimscams_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch {
        this.logout();
      }
    }
  }
}
