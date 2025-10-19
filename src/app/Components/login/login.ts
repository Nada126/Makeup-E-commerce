import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth-service';

import { FormsModule} from '@angular/forms';
@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class Login{
  email = '';
  password = '';
  message = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.auth.login(this.email, this.password).subscribe(success => {
      if (success) {
        const user = this.auth.getCurrentUser();
        this.message = '✅ Login successful!';
        setTimeout(() => {
          if (user.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/home']);
          }
        }, 1000);
      } else {
        this.message = '❌ Invalid credentials!';
      }
    });
  }
}
