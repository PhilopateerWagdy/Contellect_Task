import { Component, OnInit, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ContactService } from '../services/contact.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  styleUrls: ['../app.css'],
  template: `
    <button (click)="logout()" style="margin-bottom: 10px;">Logout</button>
    <ag-grid-angular
      [theme]="'legacy'"
      class="ag-theme-quartz"
      style="width: 100%; height: 500px;"
      [rowData]="rowData"
      [columnDefs]="colDefs"
    ></ag-grid-angular>
  `,
})
export class ContactsComponent implements OnInit {
  private contactService = inject(ContactService);
  private router = inject(Router);
  private authService = inject(AuthService);

  rowData: any[] = [];
  totalPages = 1;
  page = 1;
  filters = {};

  colDefs: ColDef[] = [
    { field: 'name', editable: true },
    { field: 'phone', editable: true },
    { field: 'address', editable: true },
    { field: 'notes', editable: true },
    {
      headerName: 'Actions',
      cellRenderer: (params: any) => {
        const button = document.createElement('button');
        button.innerText = 'Delete';
        button.addEventListener('click', () =>
          this.deleteContact(params.data._id)
        );
        return button;
      },
    },
  ];

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    this.contactService.getContacts().subscribe({
      next: (data) => {
        this.rowData = data.contacts;
        this.totalPages = data.totalPages;
      },
      error: (err) => {
        console.error('Failed to fetch contacts', err);
        alert('Failed to fetch contacts.');
      },
    });
  }

  deleteContact(id: string) {
    if (confirm('Are you sure you want to delete this contact?')) {
      this.contactService.deleteContact(id).subscribe({
        next: () => this.loadContacts(),
        error: (err) => {
          console.error('Failed to delete contact', err);
          alert('Failed to delete contact.');
        },
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}
