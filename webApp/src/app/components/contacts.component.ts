import {
  AfterViewInit,
  Component,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ContactService } from '../services/contact.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AgGridAngular, FormsModule],
  styleUrls: ['../app.css'],
  template: `
    <button (click)="logout()" style="margin-bottom: 10px;">Logout</button>
    <div
      style="margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 10px;"
    >
      <input [(ngModel)]="newContact.name" placeholder="Name" required />
      <input [(ngModel)]="newContact.phone" placeholder="Phone" required />
      <input [(ngModel)]="newContact.address" placeholder="Address" />
      <input [(ngModel)]="newContact.notes" placeholder="Notes" />
      <button (click)="addContact()">Add Contact</button>
    </div>

    <ag-grid-angular
      #agGrid
      [theme]="'legacy'"
      class="ag-theme-quartz"
      style="width: 100%; height: 500px;"
      [rowData]="rowData"
      [columnDefs]="colDefs"
      [getRowId]="getRowId"
      (cellEditingStarted)="onCellEditingStarted($event)"
      (cellEditingStopped)="onCellEditingStopped($event)"
    ></ag-grid-angular>

    <div
      style="margin-top: 10px; display: flex; align-items: center; gap: 10px;"
    >
      <button (click)="previousPage()" [disabled]="page <= 1">Previous</button>
      <span>Page {{ page }} of {{ totalPages }}</span>
      <span style="margin-left: 1rem;"
        >{{ startContact }}-{{ endContact }} of {{ totalContacts }}</span
      >
      <button (click)="nextPage()" [disabled]="page >= totalPages">Next</button>
    </div>
  `,
})
export class ContactsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(AgGridAngular) grid!: AgGridAngular;
  private contactService = inject(ContactService);
  private router = inject(Router);
  private authService = inject(AuthService);

  socket!: Socket;
  rowData: any[] = [];
  userRole: string | null = null;
  newContact = { name: '', phone: '', address: '', notes: '' };

  totalPages = 1;
  page = 1;
  totalContacts = 0;
  pageLimit = 5;
  filters: Record<string, string> = {};

  colDefs: ColDef[] = [
    {
      field: 'name',
      editable: (params) => {
        const data = params.data;
        return !data.isLocked || data.lockedBy === this.authService.getUserId();
      },
      filter: true,
    },
    {
      field: 'phone',
      editable: (params) => {
        const data = params.data;
        return !data.isLocked || data.lockedBy === this.authService.getUserId();
      },
      filter: true,
    },
    {
      field: 'address',
      editable: (params) => {
        const data = params.data;
        return !data.isLocked || data.lockedBy === this.authService.getUserId();
      },
      filter: true,
    },
    {
      field: 'notes',
      editable: (params) => {
        const data = params.data;
        return !data.isLocked || data.lockedBy === this.authService.getUserId();
      },
    },
    {
      field: 'isLocked',
      valueFormatter: (params) => (params.value ? 'Locked' : ''),
    },
  ];

  getRowId = (params: any) => params.data._id;

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    if (this.userRole === 'admin') {
      this.colDefs.push({
        headerName: 'Actions',
        cellRenderer: (params: any) => {
          const btn = document.createElement('button');
          btn.innerText = 'Delete';
          btn.addEventListener('click', () =>
            this.deleteContact(params.data._id)
          );
          return btn;
        },
      });
    }
    this.connectSocket();
    this.loadContacts();
  }

  ngAfterViewInit() {
    this.grid.api.addEventListener('filterChanged', () =>
      this.handleGridFilterChange()
    );
  }

  ngOnDestroy() {
    if (this.socket) this.socket.disconnect();
  }

  connectSocket() {
    this.socket = io('http://localhost:3001', { withCredentials: true });
    this.socket.on('connect', () => console.log('Connected to Socket.io'));
    this.socket.on('contactLocked', ({ id, isLocked, lockedBy }) => {
      const rowNode = this.grid.api.getRowNode(id);
      if (rowNode) {
        rowNode.setDataValue('isLocked', isLocked);
        rowNode.setDataValue('lockedBy', lockedBy);
      }
    });
    this.socket.on('contactUpdated', (updatedContact) => {
      const rowNode = this.grid.api.getRowNode(updatedContact._id);
      if (rowNode) {
        ['name', 'phone', 'address', 'notes', 'isLocked', 'lockedBy'].forEach(
          (field) => {
            if (updatedContact[field] !== undefined) {
              rowNode.setDataValue(field, updatedContact[field]);
            }
          }
        );
      } else {
        this.loadContacts();
      }
    });
  }

  onCellEditingStarted(event: any) {
    const id = event.data._id;
    this.contactService.lockContact(id).subscribe({
      next: (response) => {
        console.log('Contact locked on server.');
        event.node.setDataValue('isLocked', true);
        event.node.setDataValue('lockedBy', this.authService.getUserId());
      },
      error: (err) => {
        alert(
          err.error?.message || 'Contact is already locked by another user.'
        );
        if (this.grid.api.getEditingCells().length > 0)
          this.grid.api.stopEditing(true);
        // Do NOT update local state if locking failed
        this.loadContacts();
      },
    });
  }

  onCellEditingStopped(event: any) {
    const id = event.data._id;
    const userId = this.authService.getUserId();

    const updatedData = {
      name: event.data.name,
      phone: event.data.phone,
      address: event.data.address,
      notes: event.data.notes,
    };

    // Always attempt update regardless of local state
    this.contactService.updateContact(id, updatedData).subscribe({
      next: () => {
        console.log('Contact updated on server.');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update contact.');
        this.loadContacts();
      },
    });

    // Always attempt unlock
    this.contactService.unlockContact(id).subscribe({
      next: () => {
        console.log('Contact unlocked on server.');
        event.node.setDataValue('isLocked', false);
        event.node.setDataValue('lockedBy', null);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to unlock contact.');
        this.loadContacts();
      },
    });
  }

  loadContacts() {
    this.contactService
      .getContacts(this.page, this.pageLimit, this.filters)
      .subscribe({
        next: (data) => {
          this.rowData = data.contacts.slice();
          this.totalPages = data.totalPages;
          this.totalContacts = data.totalContacts;
          if (this.grid && this.grid.api)
            this.grid.api.refreshCells({ force: true });
        },
        error: (err) => {
          alert('Failed to fetch contacts.');
          console.error(err);
        },
      });
  }

  handleGridFilterChange() {
    const model = this.grid.api.getFilterModel();
    this.filters = {};
    if (model['name']?.filter) this.filters['name'] = model['name'].filter;
    if (model['phone']?.filter) this.filters['phone'] = model['phone'].filter;
    if (model['address']?.filter)
      this.filters['address'] = model['address'].filter;
    this.page = 1;
    this.loadContacts();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.loadContacts();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadContacts();
    }
  }

  get startContact() {
    return (this.page - 1) * this.pageLimit + 1;
  }

  get endContact() {
    const end = this.page * this.pageLimit;
    return end > this.totalContacts ? this.totalContacts : end;
  }

  deleteContact(id: string) {
    if (confirm('Are you sure you want to delete this contact?')) {
      const rowNode = this.grid.api.getRowNode(id);
      if (rowNode) this.grid.api.applyTransaction({ remove: [rowNode.data] });
      this.contactService.deleteContact(id).subscribe({
        next: () => {
          this.totalContacts--;
          const maxPage = Math.ceil(this.totalContacts / this.pageLimit) || 1;
          if (this.page > maxPage) this.page = maxPage;
          this.loadContacts();
        },
        error: (err) => {
          alert('Failed to delete contact on server.');
          console.error(err);
          this.loadContacts();
        },
      });
    }
  }

  addContact() {
    if (!this.newContact.name || !this.newContact.phone) {
      alert('Name and Phone are required.');
      return;
    }
    this.contactService.addContact(this.newContact).subscribe({
      next: () => {
        this.totalContacts++;
        const newTotalPages =
          Math.ceil(this.totalContacts / this.pageLimit) || 1;
        if (this.page !== newTotalPages) this.page = newTotalPages;
        this.loadContacts();
        this.newContact = { name: '', phone: '', address: '', notes: '' };
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add contact.');
        console.error(err);
      },
    });
  }

  logout() {
    this.authService.logout();
  }
}
