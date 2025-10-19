import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../Services/auth-service';
@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  name = '';
  email = '';
  password = '';
  message = '';

  constructor(private auth: AuthService, private router: Router) {}

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): boolean {
    const passRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    return passRegex.test(password);
  }

  register() {
    if (!this.name || !this.email || !this.password) {
      this.message = '⚠️ All fields are required!';
      return;
    }

    if (!this.validateEmail(this.email)) {
      this.message = '⚠️ Invalid email format!';
      return;
    }

    if (!this.validatePassword(this.password)) {
      this.message = '⚠️ Password must be at least 6 chars, include a number and uppercase letter.';
      return;
    }

    this.auth
      .register({
        name: this.name,
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (success) => {
          if (success) {
            this.message = '✅ Registered successfully!';
            setTimeout(() => this.router.navigate(['/login']), 1000);
          } else {
            this.message = '⚠️ User already exists!';
          }
        },
        error: (err) => {
          console.error('Registration error:', err);
          this.message = '❌ Error while registering!';
        },
      });
  }
}
