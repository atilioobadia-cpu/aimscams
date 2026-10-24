import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'aims-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="brand"><b>AIMS</b><span>CAMS</span></div>
          <p>Alpha Integrated Management System</p>
        </div>
        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="field">
            <label for="email">Email</label>
            <input 
              id="email" 
              type="email" 
              [(ngModel)]="email" 
              name="email" 
              required 
              placeholder="Enter your email"
            />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input 
              id="password" 
              type="password" 
              [(ngModel)]="password" 
              name="password" 
              required 
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
          @if (error()) {
            <div class="error">{{ error() }}</div>
          }
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--paper);
      padding: 20px;
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .login-header {
      padding: 32px 32px 24px;
      text-align: center;
      border-bottom: 1px solid var(--line);
    }
    .brand {
      display: flex;
      align-items: baseline;
      gap: 7px;
      justify-content: center;
      margin-bottom: 8px;
    }
    .brand b {
      font-size: 24px;
      letter-spacing: .13em;
      color: var(--brand);
    }
    .brand span {
      font-size: 14px;
      letter-spacing: .2em;
      color: #7c9a8d;
      font-weight: 600;
    }
    .login-header p {
      margin: 0;
      color: var(--ink-faint);
      font-size: 12px;
    }
    .login-form {
      padding: 24px 32px 32px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field label {
      font-size: 12px;
      font-weight: 600;
      color: var(--ink);
    }
    .field input {
      padding: 10px 12px;
      border: 1px solid var(--line-strong);
      border-radius: 7px;
      font-size: 13px;
      font-family: inherit;
    }
    .field input:focus {
      outline: 2px solid #cfe4dc;
      border-color: var(--brand);
    }
    .btn-primary {
      padding: 10px 16px;
      background: var(--brand);
      color: white;
      border: none;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-primary:hover:not(:disabled) {
      background: var(--brand-deep);
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .error {
      color: var(--coral);
      font-size: 12px;
      text-align: center;
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  
  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Please enter email and password');
      return;
    }
    
    this.loading.set(true);
    this.error.set('');
    
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Invalid credentials');
      }
    });
  }
}
