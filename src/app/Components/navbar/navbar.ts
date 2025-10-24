import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { FavoriteService } from '../../Services/favorite.service';
import { CommonModule } from '@angular/common';
import { CartService } from '../../Services/cart-service';
import { Product } from '../../modules/Product';

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
  cartCount = 0;
  favCount = 0; 

  constructor(
    private auth: AuthService,
    private router: Router,
    public favoriteService: FavoriteService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    // Initialize user data
    this.user = this.auth.getCurrentUser();

    // Check if user is admin
    if (this.auth.isAdmin()) {
      this.isAdmin = true;
    }

    // ✅ Subscribe to cartService for cart items count
    this.cartService.items$.subscribe(items => {
      this.cartCount = items.reduce((s, i) => s + i.quantity, 0);
    });

    // ✅ Subscribe to favoriteService for favorites count
    this.favoriteService.favorites$.subscribe((favorites: Product[]) => {
      this.favCount = favorites.length;
      this.favoriteCount = favorites.length; // Keep both for compatibility
    });
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  logout() {
    this.auth.logout();
    this.cartService.reload();
    // this.favoriteService.clearFavorites(); // Optional: clear favorites on logout
    this.user = null;
    this.isAdmin = false;
    this.router.navigate(['/login']);
  }

  goToDashboard() {
    this.router.navigate(['/admin']);
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  goToFavorites() {
    this.router.navigate(['/favorites']);
  }
}