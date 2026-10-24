import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'aims-client-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Clients</h1>
          <p>Manage individual and group members</p>
        </div>
        <div class="actions">
          <button class="btn">Add Group</button>
          <button class="btn-primary">Add Client</button>
        </div>
      </header>
      <section class="panel">
        <div class="filter-bar">
          <input type="text" placeholder="Search by name, ID, phone..." />
          <select><option>All Types</option><option>Individual</option><option>Group</option></select>
          <select><option>All Status</option><option>Active</option><option>Pending</option><option>Inactive</option></select>
        </div>
        <table class="client-table">
          <thead>
            <tr>
              <th>Client No</th>
              <th>Name</th>
              <th>Type</th>
              <th>Phone</th>
              <th>Branch</th>
              <th>KYC</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (c of clients; track c.no) {
              <tr [routerLink]="['/members', c.no]">
                <td class="no">{{ c.no }}</td>
                <td>{{ c.name }}</td>
                <td>{{ c.type }}</td>
                <td>{{ c.phone }}</td>
                <td>{{ c.branch }}</td>
                <td><span class="kyc" [class]="c.kyc.toLowerCase()">{{ c.kyc }}</span></td>
                <td><span class="status" [class]="c.status.toLowerCase()">{{ c.status }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
    .page-header h1 { margin: 0; font-size: 22px; }
    .page-header p { margin: 4px 0 0; color: var(--ink-faint); font-size: 12px; }
    .actions { display: flex; gap: 8px; }
    .btn, .btn-primary { padding: 8px 14px; border-radius: 7px; font-weight: 600; cursor: pointer; font-size: 13px; }
    .btn { background: white; border: 1px solid var(--line-strong); }
    .btn-primary { background: var(--brand); color: white; border: none; }
    .panel { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
    .filter-bar { display: flex; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--line); background: var(--paper); }
    .filter-bar input, .filter-bar select { padding: 8px 10px; border: 1px solid var(--line-strong); border-radius: 7px; font-size: 13px; }
    .filter-bar input { flex: 1; }
    .client-table { width: 100%; border-collapse: collapse; }
    .client-table thead th { text-align: left; padding: 10px 16px; font-size: 11px; text-transform: uppercase; color: var(--ink-faint); border-bottom: 1px solid var(--line); }
    .client-table tbody tr { cursor: pointer; }
    .client-table tbody tr:hover { background: var(--paper); }
    .client-table tbody td { padding: 10px 16px; border-bottom: 1px solid var(--line); font-size: 13px; }
    .no { font-family: monospace; }
    .kyc, .status { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .kyc.verified { background: #e8f5e9; color: #2e7d32; }
    .kyc.pending { background: #fff3e0; color: #ef6c00; }
    .status.active { background: #e8f5e9; color: #2e7d32; }
    .status.pending { background: #fff3e0; color: #ef6c00; }
  `]
})
export class ClientListComponent {
  clients = [
    { no: '1001', name: 'Grace Mwakipesile', type: 'Individual', phone: '+255 712 345 678', branch: 'Head office', kyc: 'Verified', status: 'Active' },
    { no: '1002', name: 'Emmanuel Chirwa', type: 'Individual', phone: '+255 754 102 330', branch: 'Head office', kyc: 'Verified', status: 'Active' },
    { no: '1003', name: 'Hadija Nambuya', type: 'Individual', phone: '+255 767 901 221', branch: 'Mbeya', kyc: 'Pending', status: 'Active' },
    { no: '2001', name: 'Jitegemea Group', type: 'Group', phone: '+255 713 555 111', branch: 'Head office', kyc: 'Verified', status: 'Active' },
  ];
}
