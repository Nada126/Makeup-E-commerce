import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { FavoriteService } from '../../Services/favorite.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  favoriteCount = 0;
  user: any = {};
  isAdmin = false;
  isLoggedIn = false;


  constructor(
    private auth: AuthService,
    private router: Router,
    public favoriteService: FavoriteService
  ) {}

  ngOnInit(): void {
    // Subscribe to login state changes
    this.auth.loginState$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
      this.user = this.auth.getCurrentUser();
      this.isAdmin = this.auth.isAdmin();
    });

    // Subscribe to favorites count
    this.favoriteService.favoritesCount$.subscribe((count: number) => {
      this.favoriteCount = count;
    });
  }

  // get isLoggedIn(): boolean {
  //   if (this.auth.isAdmin()) {
  //     this.isAdmin = true;
  //   }
  //   return this.auth.isLoggedIn();
  // }

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
