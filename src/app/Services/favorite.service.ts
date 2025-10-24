import { Injectable } from '@angular/core';
import { Product } from '../modules/Product';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private favoritesKey = 'favoriteProducts';
  private favoritesSubject = new BehaviorSubject<Product[]>(this.getFavorites());
  favorites$ = this.favoritesSubject.asObservable();

  constructor() {}

  // Get favorites from localStorage
  private getFavorites(): Product[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const favorites = localStorage.getItem(this.favoritesKey);
      return favorites ? JSON.parse(favorites) : [];
    }
    return [];
  }

  // Save favorites to localStorage
  private saveFavorites(favorites: Product[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
      this.favoritesSubject.next(favorites);
    }
  }

  // Add product to favorites
  addToFavorites(product: Product): void {
    const favorites = this.getFavorites();

    // Check if product already exists
    const exists = favorites.some((fav: Product) => fav.id === product.id);

    if (!exists) {
      favorites.push({ ...product, isFavorite: true });
      this.saveFavorites(favorites);
    }
  }

  // Remove product from favorites
  removeFromFavorites(productId: number): void {
    const favorites = this.getFavorites();
    const updatedFavorites = favorites.filter(fav => fav.id !== productId);
    this.saveFavorites(updatedFavorites);
  }

  // Check if product is in favorites
  isFavorite(productId: number): boolean {
    const favorites = this.getFavorites();
    return favorites.some(fav => fav.id === productId);
  }

  // Get all favorites
  getFavoritesList(): Product[] {
    return this.getFavorites();
  }

  // Clear all favorites
  clearFavorites(): void {
    this.saveFavorites([]);
  }

  // Get favorites count
  getFavoritesCount(): number {
    return this.getFavorites().length;
  }
}
