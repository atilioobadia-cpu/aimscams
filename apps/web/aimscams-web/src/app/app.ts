import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ShellComponent } from './components/layout/shell/shell.component';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'aims-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ShellComponent],
  template: `
    @if (isLoginRoute()) {
      <router-outlet></router-outlet>
    } @else {
      <aims-shell></aims-shell>
    }
  `,
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  
  ngOnInit(): void {
    this.auth.checkAuth();
  }
  
  isLoginRoute(): boolean {
    return this.router.url.includes('/login');
  }
}
