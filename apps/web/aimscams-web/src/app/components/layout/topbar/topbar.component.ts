import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerService } from '../../../../app/core/services/drawer.service';

@Component({
  selector: 'aims-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent {
  readonly drawer = inject(DrawerService);

  /** Emitted when the user clicks the back button. */
  readonly back = output<void>();

  protected breadcrumb = 'Overview';
  protected branch = 'Head office';
}
