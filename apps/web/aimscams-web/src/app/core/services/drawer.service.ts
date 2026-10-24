import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Mobile drawer toggle bus. The sidebar owns the drawer DOM; the topbar's
 * menu button asks it to open/close through this service.
 */
@Injectable({ providedIn: 'root' })
export class DrawerService {
  readonly toggle$ = new Subject<void>();

  toggle(): void {
    this.toggle$.next();
  }
}
