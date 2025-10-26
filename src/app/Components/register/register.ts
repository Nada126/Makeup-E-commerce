import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../Services/auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterModule,CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  registerForm!: FormGroup;
  message = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(6), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{6,}$/)],
      ],
    });
  }
  get f() {
    return this.registerForm.controls;
  }

  register() {
    if (this.registerForm.invalid) return;

    const { name, email, password } = this.registerForm.value;

    this.auth.register({ name, email, password }).subscribe({
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
