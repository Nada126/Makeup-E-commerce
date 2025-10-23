import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { CartService } from '../../Services/cart-service';
import { FavoriteService } from '../../Services/favourite-service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  user: any = {};
  isAdmin = false;
  cartCount = 0;
  favCount = 0; 

  constructor(
    private auth: AuthService,
    private router: Router,
    private cartService: CartService,
    private favService: FavoriteService 
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();

    // ✅ اشتراك في cartService لعرض عدد عناصر الكارت
    this.cartService.items$.subscribe(items => {
      this.cartCount = items.reduce((s, i) => s + i.quantity, 0);
    });

    // ✅ اشتراك في favService لعرض عدد المفضلات
    this.favService.items$.subscribe(items => {
      this.favCount = (items || []).length;
    });
  }

  get isLoggedIn(): boolean {
    if (this.auth.isAdmin()) {
      this.isAdmin = true;
    }
    return this.auth.isLoggedIn();
  }

  logout() {
    this.auth.logout();
    this.cartService.reload();
    this.favService.reload(); // ✅ نعمل reload عشان نفضي المفضلات عند تسجيل الخروج
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

  goToFavorites() { // ✅ زر المفضلات
    this.router.navigate(['/favourites']);
  }
}
