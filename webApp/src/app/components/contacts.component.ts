import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ContactService } from '../services/contact.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AgGridAngular, FormsModule],
  styleUrls: ['../app.css'],
  template: `
    <button (click)="logout()" style="margin-bottom: 10px;">Logout</button>

    <!-- Add Contact Form -->
    <div
      style="margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 10px;"
    >
      <input [(ngModel)]="newContact.name" placeholder="Name" required />
      <input [(ngModel)]="newContact.phone" placeholder="Phone" required />
      <input [(ngModel)]="newContact.address" placeholder="Address" required />
      <input [(ngModel)]="newContact.notes" placeholder="Notes" required />
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
    ></ag-grid-angular>

    <div
      style="margin-top: 10px; display: flex; align-items: center; gap: 10px;"
    >
      <button (click)="previousPage()" [disabled]="page <= 1">Previous</button>
      <span>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <span style="margin-left: 1rem;">
          {{ startContact }}-{{ endContact }} of {{ totalContacts }}
        </span>
      </span>
      <button (click)="nextPage()" [disabled]="page >= totalPages">Next</button>
    </div>
  `,
})
export class ContactsComponent implements OnInit, AfterViewInit {
  @ViewChild(AgGridAngular) grid!: AgGridAngular;
  private contactService = inject(ContactService);
  private router = inject(Router);
  private authService = inject(AuthService);

  rowData: any[] = [];
  userRole: string | null = null;
  newContact = {
    name: '',
    phone: '',
    address: '',
    notes: '',
  };

  totalPages = 1;
  page = 1;
  totalContacts = 0;
  pageLimit = 5;
  filters: Record<string, string> = {};

  colDefs: ColDef[] = [
    { field: 'name', editable: true, filter: true },
    { field: 'phone', editable: true, filter: true },
    { field: 'address', editable: true, filter: true },
    { field: 'notes', editable: true },
    { field: 'update lock' },
  ];

  getRowId = (params: any) => params.data._id;

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    if (this.userRole === 'admin') {
      this.colDefs.push({
        headerName: 'Actions',
        cellRenderer: (params: any) => {
          const button = document.createElement('button');
          button.innerText = 'Delete';
          button.addEventListener('click', () =>
            this.deleteContact(params.data._id)
          );
          return button;
        },
      });
    }
    this.loadContacts();
  }

  loadContacts() {
    this.contactService
      .getContacts(this.page, this.pageLimit, this.filters)
      .subscribe({
        next: (data) => {
          this.rowData = data.contacts.slice(); // triggers Angular change detection
          this.totalPages = data.totalPages;
          this.totalContacts = data.totalContacts;

          // Optional force refresh
          if (this.grid && this.grid.api) {
            this.grid.api.refreshCells({ force: true });
          }
        },
        error: (err) => {
          console.error('Failed to fetch contacts', err);
          alert('Failed to fetch contacts.');
        },
      });
  }

  ngAfterViewInit() {
    this.grid.api.addEventListener('filterChanged', () => {
      this.handleGridFilterChange();
    });
  }

  handleGridFilterChange() {
    const filterModel = this.grid.api.getFilterModel();

    this.filters = {};
    if (filterModel['name']?.filter) {
      this.filters['name'] = filterModel['name'].filter;
    }
    if (filterModel['phone']?.filter) {
      this.filters['phone'] = filterModel['phone'].filter;
    }
    if (filterModel['address']?.filter) {
      this.filters['address'] = filterModel['address'].filter;
    }

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
    const potentialEnd = this.page * this.pageLimit;
    return potentialEnd > this.totalContacts
      ? this.totalContacts
      : potentialEnd;
  }

  deleteContact(id: string) {
    if (confirm('Are you sure you want to delete this contact?')) {
      const rowNode = this.grid.api.getRowNode(id);
      if (rowNode) {
        this.grid.api.applyTransaction({ remove: [rowNode.data] });
      }

      this.contactService.deleteContact(id).subscribe({
        next: () => {
          this.totalContacts--;

          const maxPage = Math.ceil(this.totalContacts / this.pageLimit) || 1;

          // Update the page BEFORE calling loadContacts
          if (this.page > maxPage) {
            this.page = maxPage;
          }

          this.loadContacts(); // Will now fetch using the correct updated page
        },
        error: (err) => {
          console.error('Failed to delete contact', err);
          alert('Failed to delete contact on server. Reverting.');
          this.loadContacts(); // to revert UI if backend deletion failed
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
      next: (createdContact) => {
        this.totalContacts++;
        const newTotalPages =
          Math.ceil(this.totalContacts / this.pageLimit) || 1;

        if (this.page !== newTotalPages) {
          this.page = newTotalPages;
        }

        this.loadContacts();

        this.newContact = {
          name: '',
          phone: '',
          address: '',
          notes: '',
        };
      },
      error: (err) => {
        console.error('Failed to add contact', err);

        if (err.error && err.error.errors && Array.isArray(err.error.errors)) {
          alert(err.error.errors.join('\n')); // show all errors line by line
        } else if (err.error && err.error.message) {
          alert(err.error.message);
        } else {
          alert('Failed to add contact due to an unknown error.');
        }
      },
    });
  }

  logout() {
    this.authService.logout();
  }
}
