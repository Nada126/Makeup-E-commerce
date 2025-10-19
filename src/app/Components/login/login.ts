import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth-service';

import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class Login {
  email = '';
  password = '';
  message = '';

  constructor(private auth: AuthService, private router: Router) { }

  login() {
    if (!this.email || !this.password) {
      this.message = '⚠️ Please enter your email and password.';
      return;
    }

    this.auth.login(this.email, this.password).subscribe({
      next: success => {
        if (success) {
          this.message = '✅ Login successful!';
          setTimeout(() => this.router.navigate(['/home']), 1000);
        } else {
          this.message = '❌ Invalid credentials!';
        }
      },
      error: err => {
        console.error('Login error:', err);
        this.message = '⚠️ Error while logging in!';
      }
    });
  }
}
