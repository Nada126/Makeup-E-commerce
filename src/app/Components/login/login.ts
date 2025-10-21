import { Component, NgZone } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from "jwt-decode";

declare const google: any;
declare var FB: any;
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
      version: 'v18.0'
    });
  }
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

    // ✅ Facebook SDK Init
    if (!(window as any).FB) {
      this.loadFbSdk();
    } else {
      this.initFb();
    }
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



  loginWithFacebook(): void {
    FB.login((response: any) => {
      if (response.authResponse) {
        FB.api('/me', { fields: 'name,email,picture' }, (userInfo: any) => {
          const userData = {
            name: userInfo.name,
            email: userInfo.email,
            avatar: userInfo.picture.data.url,
            role: 'user'
          };

          localStorage.setItem('token', response.authResponse.accessToken);
          localStorage.setItem('currentUser', JSON.stringify(userData));

          // ✅ احفظ المستخدم في db.json لو مش موجود
          this.auth.saveUser(userData).subscribe();

          this.ngZone.run(() => {
            this.message = `✅ Logged in as ${userData.name}`;
            this.router.navigate(['/home']);
          });
        });
      } else {
        this.message = '❌ Facebook login cancelled!';
      }
    }, { scope: 'email,public_profile' });
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
