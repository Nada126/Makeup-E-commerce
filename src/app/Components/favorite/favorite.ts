// favorite.component.ts - SEPARATE FILE
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoriteService } from '../../Services/favorite.service';
import { Product } from '../../modules/Product';

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

  constructor(private favoriteService: FavoriteService) {}

  ngOnInit() {
    this.loadFavorites();

    // Subscribe to favorites changes
    this.favoriteService.userFavorites$.subscribe((favorites: Product[]) => {
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
  }

  clearAllFavorites() {
    if (confirm('Are you sure you want to remove all favorites?')) {
      this.favoriteService.clearFavorites();
    }
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
}
