import { Component, NgZone } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from "jwt-decode";

declare const google: any;
@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})

export class Login {
  email = '';
  password = '';
  message = '';

  constructor(private auth: AuthService, private router: Router, private ngZone: NgZone) { }

  ngOnInit() {
    // Initialize Google Identity Services
    google.accounts.id.initialize({
      client_id: '782430391351-uvr9gfcl89alqqdgv2i1vdr71tb4vt80.apps.googleusercontent.com',
      callback: this.handleCredentialResponse.bind(this)
    });

    google.accounts.id.renderButton(
      document.getElementById('googleBtn'),
      { theme: 'outline', size: 'large' }
    );

    google.accounts.id.prompt(); // optional: يظهر popup تلقائي
  }

  handleCredentialResponse(response: any) {
    try {
      const decoded: any = jwtDecode(response.credential);
      const userData = {
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture,
        role: 'user'
      };

      localStorage.setItem('token', 'google-jwt-token');
      localStorage.setItem('currentUser', JSON.stringify(userData));

      this.auth.saveUser(userData).subscribe();
      this.ngZone.run(() => {
        this.message = `✅ Logged in as ${userData.name}`;
        this.router.navigate(['/home']);
      });
    } catch (err) {
      console.error('Error decoding JWT:', err);
      this.message = '❌ Google login failed!';
    }
  }

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
