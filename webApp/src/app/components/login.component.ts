import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Login</h2>
    <form (ngSubmit)="onSubmit()">
      <input
        type="text"
        [(ngModel)]="username"
        name="username"
        placeholder="Username"
        required
      />
      <input
        type="password"
        [(ngModel)]="password"
        name="password"
        placeholder="Password"
        required
      />
      <button type="submit" [disabled]="loading">Login</button>
    </form>
    <p *ngIf="errorMessage" style="color:red;">{{ errorMessage }}</p>
  `,
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        console.log('Token received:', res.token);
        this.authService.saveToken(res.token);
        console.log('Token saved. Navigating to /contacts...');
        this.router.navigate(['/contacts']);
      },
      error: () => {
        this.errorMessage = 'Invalid username or password';
        this.loading = false;
      },
    });
  }
}
