import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { FavoriteService } from '../../Services/favorite.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  user: any = {};
  isAdmin = false;
  favoriteCount = 0;

  constructor(
    private auth: AuthService,
    private router: Router,
    public favoriteService: FavoriteService
  ) { }

  ngOnInit(): void {
    // Initialize user data
    this.user = this.auth.getCurrentUser();

    // Check if user is admin
    if (this.auth.isAdmin()) {
      this.isAdmin = true;
    }

    // Subscribe to favorites changes
    // this.favoriteService.favoritesCount$.subscribe(count => {
    //   this.favoriteCount = count;
    // });
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  logout() {
    this.auth.logout();
    this.user = null;
    this.isAdmin = false;
    this.router.navigate(['/login']);
  }

  goToDashboard() {
    this.router.navigate(['/admin']);
  }
}
