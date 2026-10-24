import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ShellComponent } from './components/layout/shell/shell.component';

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
export class AppComponent {
  private router = inject(Router);
  
  isLoginRoute(): boolean {
    return this.router.url.includes('/login');
  }
}
