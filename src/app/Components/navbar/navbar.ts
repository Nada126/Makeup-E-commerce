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

  constructor(
    private auth: AuthService,
    private router: Router,
    public favoriteService: FavoriteService
  ) { }

  // Use only the getter, remove the property declaration
  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  ngOnInit() {
    this.favoriteService.favorites$.subscribe(favorites => {
      this.favoriteCount = favorites.length;
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
