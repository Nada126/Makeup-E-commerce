import { Component, NgZone } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';

declare const google: any;
declare var FB: any;
@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm!: FormGroup;
  email = '';
  password = '';
  message = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  loadFbSdk(): void {
    (window as any).fbAsyncInit = () => {
      this.initFb();
    };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    document.body.appendChild(script);
  }

  initFb(): void {
    FB.init({
      appId: '1343163154053468',
      cookie: true,
      xfbml: true,
      version: 'v18.0',
    });
  }
  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    // Initialize Google Identity Services
    google.accounts.id.initialize({
      client_id: '782430391351-uvr9gfcl89alqqdgv2i1vdr71tb4vt80.apps.googleusercontent.com',
      callback: this.handleCredentialResponse.bind(this),
    });

    google.accounts.id.renderButton(document.getElementById('googleBtn'), {
      theme: 'outline',
      size: 'large',
    });

    google.accounts.id.prompt();

    // ✅ Facebook SDK Init
    if (!(window as any).FB) {
      this.loadFbSdk();
    } else {
      this.initFb();
    }
  }
  get f() {
    return this.loginForm.controls;
  }
  handleCredentialResponse(response: any) {
    try {
      const decoded: any = jwtDecode(response.credential);
      const userData = {
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture,
        role: 'user',
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

  loginWithFacebook(): void {
    FB.login(
      (response: any) => {
        if (response.authResponse) {
          FB.api('/me', { fields: 'name,email,picture' }, (userInfo: any) => {
            const userData = {
              name: userInfo.name,
              email: userInfo.email||`${userInfo.id}@facebook.com`,
              avatar: userInfo.picture.data.url,
              role: 'user',
            };

            localStorage.setItem('token', response.authResponse.accessToken);
            localStorage.setItem('currentUser', JSON.stringify(userData));

            // Save user to db.json if not exists
            this.auth.saveUser(userData).subscribe({
              next: () => {
                this.ngZone.run(() => {
                  this.message = `✅ Logged in as ${userData.name}`;
                  this.router.navigate(['/home']);
                });
              },
              error: (err) => {
                console.error('Error saving user:', err);
                this.message = '❌ Error saving Facebook user.';
              },
            });
          });
        } else {
          this.message = '❌ Facebook login cancelled!';
        }
      },
      { scope: 'public_profile' }
    );
  }

  login() {
    if (this.loginForm.invalid) {
      this.message = '❌ Please fix the fields error in the form!';
      this.loginForm.markAllAsTouched;
      return;
    }

    const { email, password } = this.loginForm.value;
    // Keep your original logic unchanged
    this.auth.login(email, password).subscribe((success) => {
      if (success) {
        const user = this.auth.getCurrentUser();
        console.log(user);
        console.log(user.role);
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
