import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth-service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit{
  user:any = {}
  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
  }
  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }
  logout() {
    this.auth.logout();
    this.user = null
    this.router.navigate(['/login']);
  }
}
