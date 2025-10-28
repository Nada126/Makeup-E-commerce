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

    this.cartService.items$.subscribe(items => {
      if (items && Array.isArray(items)) {
        this.cartCount = items.reduce((total, item) => {
          return total + (Number(item.quantity) || 1);
        }, 0);
      } else {
        this.cartCount = 0;
      }
      console.log('Cart count updated:', this.cartCount);
    });

    this.favoriteService.favorites$.subscribe((favorites: Product[]) => {
      this.favoriteCount = favorites?.length || 0;
      console.log('Favorite count updated:', this.favoriteCount);
    });
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  logout() {
    this.auth.logout();

    // Only call reload if the method exists
    if (this.cartService.reload) {
      this.cartService.reload();
    }

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
