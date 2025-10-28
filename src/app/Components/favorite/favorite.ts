import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FavoriteService } from '../../Services/favorite.service';
import { Product } from '../../modules/Product';
import { CartService } from '../../Services/cart-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-favorite',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorite.html',
  styleUrls: ['./favorite.css']
})
export class Favorite implements OnInit {
  favoriteProducts: Product[] = [];
  loading = false;

  constructor(
    private favoriteService: FavoriteService,
    private cartService: CartService,
    public router: Router
  ) {}

  ngOnInit() {
    this.loadFavorites();

    // Subscribe to favorites changes
    this.favoriteService.favorites$.subscribe((favorites: Product[]) => {
      this.favoriteProducts = favorites;
    });
  }

  loadFavorites() {
    this.loading = true;
    this.favoriteProducts = this.favoriteService.getFavoritesList();
    this.loading = false;
  }

  removeFromFavorites(product: Product, event: Event) {
    event.stopPropagation();
    this.favoriteService.removeFromFavorites(product.id);
    product.isFavorite = false;

    // Show success message with SweetAlert
    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Removed from favorites',
      text: `${product.name} has been removed from your favorites`,
      showConfirmButton: false,
      timer: 2000,
      toast: true,
      background: '#f8f9fa',
      iconColor: '#ff6f91'
    });
  }

  clearAllFavorites() {
    Swal.fire({
      title: 'Clear All Favorites?',
      text: 'Are you sure you want to remove all products from your favorites?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6f91',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, clear all!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.favoriteService.clearFavorites();
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Favorites Cleared',
          text: 'All items have been removed from your favorites',
          showConfirmButton: false,
          timer: 2000,
          toast: true,
          background: '#f8f9fa',
          iconColor: '#ff6f91'
        });
      }
    });
  }

  getStarsArray(rating: any): boolean[] {
    const stars = Math.round(Number(rating) || 0);
    return Array.from({ length: 5 }, (_, i) => i < stars);
  }

  get totalItems(): number {
    return this.favoriteProducts.length;
  }

  get totalValue(): number {
    return this.favoriteProducts.reduce((total, product) => {
      const price = Number(product.price) || 0;
      return total + price;
    }, 0);
  }

  // Add to cart functionality with SweetAlert
  addToCart(product: Product, event?: Event) {
    if (event) event.stopPropagation();
    if (!product || product.id == null) return;

    const item = {
      productId: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      image: product.image_link,
      quantity: 1,
      product
    };

    this.cartService.addItem(item);

    // SweetAlert notification
    Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Added to Cart!',
      text: `${product.name} has been added to your cart`,
      showConfirmButton: false,
      timer: 2000,
      toast: true,
      background: '#f8f9fa',
      iconColor: '#28a745'
    });
  }

  // Open product details by ID
  openDetail(product: Product) {
    if (!product || product.id == null) return;
    this.router.navigate(['/product', product.id], { state: { product } });
  }

  // Navigate to product details when eye icon is clicked
  viewProductDetails(product: Product, event: Event) {
    event.stopPropagation();
    this.openDetail(product);
  }
}
