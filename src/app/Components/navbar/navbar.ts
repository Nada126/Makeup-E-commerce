import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../Services/auth-service';
import { CartService } from '../../Services/cart-service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit{
  user:any = {}
  isAdmin = false
  cartCount = 0;
  constructor(private auth: AuthService, private router: Router, private cartService: CartService) { }
  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    this.cartService.items$.subscribe(items => {
      this.cartCount = items.reduce((s, i) => s + i.quantity, 0);
    });
  }
  get isLoggedIn(): boolean {
    if(this.auth.isAdmin()){
      this.isAdmin = true;
    }
    return this.auth.isLoggedIn();
  }
  logout() {
    this.auth.logout();
    this.cartService.reload();
    this.user = null
    this.isAdmin = false
    this.router.navigate(['/login']);
  }
  goToDashboard() {
    this.router.navigate(['/admin']);
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }
}
